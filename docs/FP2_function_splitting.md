# FP 중요 기능 정리 2 :: 다항함수의 항수 줄이기

함수형 프로그래밍에서는 인수의 개수(항수)가 적을수록 좋습니다. 항수의 개수가 복잡도와 비례하는 경우가 많기 때문입니다. 이번 포스트에서는 다항함수의 항수를 줄여, 더 유연한 함수를 만드는 기능들을 소개합니다.

# curry

항수가 1개인 순수함수는 한 가지 용도, 즉 단일 책임을 담당하는 가장 단순한 함수이며, 가장 좋은 형태의 함수라고 할 수 있습니다.

curry를 사용하면 다항 함수를 단항 함수로 쉽게 변형할 수 있습니다.

다항함수를 curry한 후, 일부 인수만 넣고 호출하면 함수가 실행되는 게 아니라 <strong> 모자란 나머지 인수가 채워지기를 기다리는 새로운 함수가 반환됩니다</strong>

즉, 커링은 함수가 인수를 모두 받을 때 까지 실행을 <strong>보류/지연</strong>시켜 단항 함수의 순차열로 전환하는 기법이라고 할 수 있습니다.

```
curry(f) :: ((a,b,c) -> d) -> a -> b -> c -> d
```

```js
const checkType = R.curry((type, obj) => {
  return R.is(type, obj) ? obj : new Error("TypeError");
});

checkType(String)("Hello"); //-> 'hello'
checkType(String)(42); //-> TypeError
```

## 자주 사용되는 curry 사용법1 :: 함수 팩토리 구현

DB 또는 Cache array에서 학생 데이터를 가져오는 함수를 findStudent가정해 봅시다. 다항 함수로 구성하면 findStudentFromDB(db,key), findStudnetFromCache(cache,key)로 구현이 가능합니다.

curry를 사용하면 다음과 같이 구현이 가능합니다.

```js
const findStudentFromDB = R.curry((db, key) => db.find(key));
const findStudentFromCache = R.curry((cache, key) => cache[key]);
```

두 함수는 커리된 함수이므로, 다음 두 부분을 분리할 수 있습니다.

1. db를 사용할 지 cache를 사용할 지 평가하는 부분
2. 실제 데이터를 가져오는 부분

1번 기능을 분리해 findStudnet라는 팩토리 함수를 생성합니다.

```js
// 1. db를 사용할 지 cache를 사용할 지 평가하는 부분
const findStudent = useDB ? findStudentFromDb(db) : findStudentFromCache(cache);

// 2. 실제 데이터를 가져오는 부분
findStudent("1234");
```

findStudent라는 팩토리 메소드를 사용해 실제 구현부를 추상화 하였습니다. 호출자 관점에서는 메소드를 호출해서 데이터를 받을 뿐, 데이터가 db에서 오는지 cache에서 오는지 신경쓰지 않을 수 있습니다.

## 자주 사용되는 curry 사용법2 :: 재사용 가능한 함수 템플릿 구현

어플리케이션의 상태(에러, 경고, 디버그)에 따라 로그를 다르게 처리하고 싶다고 가정해 봅시다. 재사용 가능한 함수 템플릿을 커링으로 정의해 유연성과 재사용성을 높여 보겠습니다.

먼저 다항 함수인 logger 함수 템플릿을 작성합니다.

```js
const logger = (appender, layout, name, level, message) => {
  // 원하는 appender를 정의합니다.
  const appenders = {
    alert: new Log4js.JSAlertAppender(),
    console: new Log4js.BrowserConsoleAppender()
  };

  // 원하는 layout provider를 정의합니다.
  const layouts = {
    basic: new Log4js.BasicLayout(),
    json: new Log4js.JsonLayout()
  };

  // 1. appender 선택
  const myAppender = appenders[appender];
  // 2. layout 설정
  myAppender.setLayout(layouts[layout]);
  // 3-1. name 이름을 가진 logger 생성
  const logger = new Log4js.getLogger(name);
  // 3-2. logger에 appender 추가
  logger.addAppender(myAppender);
  // 4. level, message를 로그로 작성
  logger.log(level, message, null);
};
```

지역 변수를 사용하는 3-2를 제외하면 1-4 각 단계의 기능이 각각의 매개변수에 의존하고 있습니다. curry를 통해 매개변수를 분리해 보겠습니다.

```js
const log = R.curry(logger);
// appender, layout, name 매개변수만 사용해 alertLogger를 만들었습니다.
const alertLogger = log("alert", "json", "AL");
// level, message 매개변수까지 전달해 주면 함수가 실행되며 로그를 작성합니다.
alertLogger("ERROR", "에러 발생!!");

// 언제든지 커리된 log를 재사용해 다른 로거를 만들 수 있습니다.
// 이번에는 level까지 정의한 로거를 만들어 보겠습니다.
const consoleErrorLogger = log("console", "basic", "CEL", "ERROR");
consoleErrorLogger("에러 발생!!");
```

# partial application(부분 적용) :: partial, R.\_\_

partial application은 함수의 일부 매개변수 값을 고정시켜 항수가 더 작은 함수를 생성하는 기법입니다.

curry와 유사하지만, 매개변수를 전달하는 내부 메커니즘이 다릅니다.

- curry : 단항함수를 중첩 생성 후, 각 단항함수들의 결과를 합성하여 최종 결과 도출.
- partial : 미리 전달된 매개변수 값을 바인딩 한 후, 인수가 적은 새로운 함수 반환.

둘의 차이를 코드로 표현하면 다음과 갑습니다.

```js
// curry
const curriedSum = function (a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
};
// partial
const partialSum = function (a) {
  // function(a)가 실행되고 (b,c)=>a+b+c를 반환한다.
  // a는 (b,c)=>a+b+c의 클로저에 남는다.
  return function (b, c) {
    return a + b + c;
  };
};
```

partialSum은 인자로 받은 a를 바인딩 후, a 인자가 빠진 (b,c)=>a+b+c 함수를 반환합니다. curry는 모든 인자를 받을 때 까지 아무것도 실행되지 않지만, partial은 a값이 전달된 경우 함수가 부분 실행되며, a값은 반환되는 함수의 클로저에 남아있을 뿐입니다.

Ramda.js에서는 R.prtial 을 이용해 다음과 같이 코드를 작성할 수 있습니다.

```js
const greet = (salutation, title, firstName, lastName) =>
  salutation + ", " + title + " " + firstName + " " + lastName + "!";

const sayHello = R.partial(greet, ["Hello"]);
const sayHelloToMs = R.partial(sayHello, ["Ms."]);
sayHelloToMs("Jane", "Jones"); //=> 'Hello, Ms. Jane Jones!'
```

또는 R.curry에 R.\_\_ 라는 placeholder를 이용해 부분 적용을 구현할 수 있습니다.

> The special placeholder value R.\_\_ may be used to specify "gaps", allowing partial application of any combination of arguments, regardless of their positions. If g is as above and \_ is R.\_\_, the following are equivalent:
>
> - g(1, 2, 3)
> - g(\_, 2, 3)(1)
> - g(\_, \_, 3)(1)(2)
> - g(\_, \_, 3)(1, 2)
> - g(\_, 2)(1)(3)
> - g(\_, 2)(1, 3)
> - g(\_, 2)(\_, 3)(1)
>
> \- Ramda.js docs / curry (https://ramdajs.com/docs/#curry) -
