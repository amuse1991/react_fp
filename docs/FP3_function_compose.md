# FP 중요 기능 정리 3 :: 함수 합성하기

함수형 프로그래밍의 핵심은 문제를 작은 작업들로 쪼갠 후, 이들을 다시 조합하는 것입니다. side effect가 없는 순수한 함수는 합성이 가능합니다. 이렇게 합성된 함수는 그 자체로도 순수한 함수이기 때문에 시스템의 다른 부분을 손대지 않아도 더 복잡한 프로그램의 일부로 다시 합성될 수 있습니다.

함수 합성을 R.compose로 구현하는 예시는 다음과 같습니다.

```js
// 서술부
const explode = str => str.split(/\s+/);
const count = arr => arr.length;
const coundWords = R.compose(count, explode);
// 평가부
countWords("hello, world"); //-> 19
```

함수 합성을 이용하면 위와 같이 서술부와 평가부를 분리할 수 있습니다. R.compose는 count, explode를 합성한 후, 해당 인수(countWords에 전달하는 인수)를 받는 함수를 반환합니다. countWords()가 호출될 때 까지 아무런 평가도 이루어지지 않는 것입니다.

## R.compose, R.pipe

함수 합성에 사용되는 함수입니다. compose는 오른쪽에서부터, pipe는 왼쪽에서부터 합성한다는 점 외에는 동일합니다. compose를 기준으로 글을 이어나가 보겠습니다.

> Performs right-to-left function composition. The last argument may have any arity; the remaining arguments must be unary.
>
> Note: The result of compose is not automatically curried.

R.compse의 공식 문서에서 가져온 글 입니다. 중요한 부분은 마지막 함수를 제외한 함수들은 반드시 단항(또는 무항)이어야 한다는 점입니다.(pipe는 첫번째 함수) 예를 들어 살펴보겠습니다.

```js
const smartStudent = R.compse(
  R.head,
  R.plunk(0),
  R.reverse,
  R.sortBy(R.prop(1)),
  R.zip // a, b 두 개의 배열을 받아 하나의 배열로 합칩니다.
);
smartStudent(students, grades); // zip에 대한 인자 2개를 넘겨줍니다.

const f = R.pipe(Math.pow, R.negate, R.inc);
f(3, 4); // Math.pow에 대한 인자 2개를 넘겨줍니다.
```
