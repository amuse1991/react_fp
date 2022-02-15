# FP 중요 기능 정리 5 :: 함수형 프로그래밍의 에러 처리1 (functor, monad)

명령형 코드는 주로 try-catch 구문으로 예외를 처리합니다. try 문으로 안전하지 않은 코드를 둘러싸는 아이디어 입니다. 함수형 프로그래밍에서도, <strong>'위험한 코드를 안전망으로 감싼다'</strong> 라는 개념은 동일하게 적용됩니다. 다만, try-catch문은 에러가 발생했을 때 제어를 넘겨주는 방식인 반면 함수형 프로그래밍에서는 특수한 객체를 사용하여, 제어를 역전시키지 않고 데이터 흐름을 유지하며 에러를 처리합니다.

이 특수한 객체를 '모나드'라고 부릅니다. 모나드에 대해 살펴보기 전에 더 넓은 개념인 functor에 대해 살펴보도록 하겠습니다.

## Functor

값을 특정한 컨테이너로 감싸 불변성을 유지하는 것은 함수형 프로그래밍의 기본적인 디자인 패턴입니다. Functor, Applicative, Monad, Arrow와 같은 개념들은 모두 이 기본적인 아이디어를 베이스로 하고 있습니다.

![containing](https://adit.io/imgs/functors/value_and_context.png)

수학적으로 functor는 두 범주 사이를 대응시키는 함수입니다. 저는 범주론의 functor 대해 정확히 이해하고 있는 것이 아니기 때문에...🥲 하스켈의 Functor 클래스를 통해 functor의 개념을 풀어보고자 합니다.

하스켈에서 functor는 typeclss입니다. 인터페이스와 유사하므로, 이해의 편의를 위해 그냥 인터페이스라고 부르겠습니다. functor 인터페이스는 다음과 같이 정의됩니다.

```
class  Functor f  where
    fmap :: (a -> b) -> f a -> f b
```

즉, <strong>functor는 fa를 fb로 매핑하는 fmap함수를 가지는 데이터 구조</strong>라고 할 수 있습니다.

<details>
  <summary>Functor 조금 더 알아보기</summary>
  
Functor 인터페이스 구현체는 다음 조건을 모두 만족해야 합니다.
반대로 말하면, 아래 조건만 만족하면 어떤 클래스건 Functor 라고 할 수 있습니다.

- (a -> b) -> f a -> f b를 만족하는 fmap 함수를 제공해야 합니다.
- fmap 함수는 다음 조건을 만족해야 합니다.

  - x.fmap(id) = x // 항등함수를 매핑하면 자신과 동일한 값을 반환해야 함
  - x.fmap(f).fmap(g) = x.fmap(compose(f, g)) // 먼저 하나를 매핑하고 다음 것을 매핑한 결과가 둘을 합성해 매핑한 결과와 동일해야 함

자바스크립트에서는 대표적으로 Array가 Functor입니다. 위 조건을 만족하는 map 함수를 제공하고 있기 때문입니다.

덧붙여, 반드시 객체만 Functor인 것은 아닙니다. 위 조건만 만족하면 어느 타입이나 functor라고 부를 수 있습니다. function 타입도 마찬가지입니다.

```js
const functor = (__val, fmap) => fmap(__val);
// __val을 클로저로만 접근 가능하게 하기 위해 partial 사용
const wrapper = val => R.partial(functor, [val]);
const wrappedVal = wrapper(1);

const plus10 = a => a + 10;
const mul5 = a => a * 5;

wrappedVal(R.identity); //-> 1
wrappedVal(R.compose(plus10, mul5)); //-> 15
R.compose(plus10, mul5)(wrappedVal(R.identity)); //-> 15
```

</details>

본 포스트에서 functor를 언급한 이유는, <strong>fmap을 이용하면 원본 데이터의 불변성을 지키면서 데이터에 다른 함수를 매핑시킨 결과를 얻을 수 있기 때문!!</strong>입니다.

데이터를 캡슐화하면서 mapping 함수를 제공하는 functor를 간단하게 작성해 보겠습니다.

```js
class Wrapper {
  constructor(value) {
    this._value = value;
  }

  // map :: (A -> B) -> A -> B
  map(f) {
    // 매핑 함수
    return f(this._value);
  }
}

// wrap :: A -> Wrapper(A)
const wrap = val => new Wrapper(val); // 값을 래핑하도록 도와주는 헬퍼 함수
```

\_value에 접근하는 유일한 방법은 map함수를 통해 함수를 값에 매핑하는 것 뿐입니다. 예를 들어, 값을 확인하려면 map(R.identitiy)처럼 identity함수를 매핑해서 사용해야 합니다.

```js
const wrappedVal = wrap("Hello!");
wrappedVal.map(R.identity); //-> "Hello!"
```

identity함수는 a => a 함수로 \_value에 매핑되면 \_value를 반환합니다. 결과적으로는 getter와 같지만 개념적으로는 functor의 매핑 개념이 적용된 것입니다!

마지막으로 정리하자면, Functor 구조를 사용하면 값의 변화 없이 특정 함수를 적용 후, 함수가 적용된 값을 받아볼 수 있는 안전한 모델을 정의할 수 있습니다.

## Monad

함수형 프로그래밍의 개념을 간단한 그림과 함께 선보이는 [포스트](https://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html)에서 인용한 글로 모나드에 대한 이야기를 시작해 볼까 합니다.

> Functors apply a function to a wrapped value:
>
> Functors 는 함수를 래핑된 값에 적용합니다:
>
> ![functors](https://adit.io/imgs/functors/fmap.png)
>
> Applicatives apply a wrapped function to a wrapped value:
>
> Applicatives는 래핑된 함수를 래핑된 값에 적용합니다:
>
> ![applicative](https://adit.io/imgs/functors/applicative.png)
>
> <strong> Monads apply a function that returns a wrapped value to a wrapped value.
>
> Monads는 래핑된 값에 함수를 적용한 후, 래핑된 값을 반환합니다. </strong>
>
> ![monad](https://adit.io/imgs/functors/recap.png) > \>\>=는 바인드 연산자로 래핑된 값을 꺼내서 함수에 넣어주는 기능을 합니다.

모나드는 래핑된 값을 뜯어 함수를 적용한 후, 나온 값을 래핑해서 반환하는 functor라고 할 수 있습니다. 모나드를 사용하면 <strong>합성을 할 때 데이터를 안전하게 흘려보낼 수 있습니다.</strong>

A함수와 B함수를 합성하려면, A함수의 출력 타입과 B함수의 입력 타입이 같아야 합니다. A가 number를 반환하면 B는 number를 받아 연산을 수행해야 합성이 이루어집니다.

만약 A가 number 대신 Null 또는 에러 객체를 반환하면 에러가 발생합니다. 하지만 모나드를 사용해 항상 같은 타입의 객체를 반환한다면 합성이 자연스럽게 이루어질 수 있습니다.

대표적으로 Maybe 모나드를 들 수 있습니다. Maybe 모나드 타입은 값이거나(Just val), 값이 아닐 수 있습니다(Nothing). 코드로 간단히 살펴보면 다음과 같습니다.

```js
class Maybe { ... }
// 값이 있는 경우에 해당하는 하위 클래스
class Just extends Maybe { ... }
// 값이 없는 경우에 해당하는 하위 클래스
class Nothing extends Maybe { ... }

```

compose(f1, f2, f3)(obj)를 한다고 가정했을 때, Maybe 모나드를 사용한다면 도중에 에러가 발생해도 Nothing을 반환하며 함수 체인이 계속됩니다. Nothing을 인자로 받으면 그대로 Nothing을 반환하고, Just를 인자로 받으면 로직을 실행 후 다시 Maybe 객체를 반환하면 됩니다.

try-catch 처럼 try블럭의 코드를 멈추고 제어 흐름을 catch로 넘기는 것과 차이가 느껴지시나요? 에러가 발생해도 합성된 함수 사이의 데이터 흐름은 그대로 이어집니다. 덕분에 합성된 함수는 여전히 순수한 함수로 남을 수 있구요! 이것이 함수형 프로그래밍에서 에러를 다루는 방식입니다.

다음 포스트에서는 여러가지 모나드를 소개하고, 실제로 모나드를 사용해 api 호출 또는 IO 작업과 같은 위험한 코드들을 안전하게 처리하는 방법에 대해 소개하겠습니다.
