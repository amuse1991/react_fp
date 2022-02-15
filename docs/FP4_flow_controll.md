# FP 중요 기능 정리 4 :: 제어 흐름 관리

함수형 프로그래밍에서는 if, for같은 제어 흐름도 함수 조합기를 이용해 구현합니다. 이전에 살펴본 compose, pipe도 함수 조합기의 일부입니다. 이번 포스트에서는 제어 흐름을 관리하는데 자주 사용되는 함수 조합기를 다루어 보겠습니다.

이번 포스트에서 다루게 될 함수들을 간단히 정리하면 다음과 같습니다.

- identity : 주어진 인수와 동일한 값을 반환.
- tap : 객체 하나와 함수 하나를 받아, 객체에 함수를 실행하고, 다시 객체를 반환.
- alternation : 함수 2개를 받아 값이 있으면 첫 번째 함수를, 없으면(ex. null)두 번째 함수를 실행.
- sequence : 2개 이상의 함수를 인수로 받아, 동일한 값에 대해 각 함수를 차례로 실행하는 함수를 반환.
- fork(join) : 주어진 입력을 처리할 terminal function 2개와 하나의 join함수를 받음. 주어진 입력을 2개로 분기(fork)해 각각 다른 terminal function을 수행하고 그 결과를 조합(join).

## identity

주어진 인수와 똑같은 값을 반환합니다.

```
identity :: (a) -> a
```

일반적으로 사용되는 경우는 다음과 같습니다.

- 암묵적 프로그래밍(tacit programming), 무인수(point-free) 코드를 작성할 때, 함수 인수를 평가하는 시점에 데이터를 제공할 때 사용됩니다.

```js
const runProgram = R.pipe(
  R.map(R.toLower),
  R.uniq,
  R.sortBy(R.identity) // 호출 시 건네받은 인수를 identity함수로 꺼냅니다.
);

runProgram(["Banana", "APPLE"]); //-> [apple, banana]
```

- 함수 조합기의 흐름을 단위 테스트 할 때 사용됩니다.
- 캡슐화된 자료형에서 데이터를 추출할 때 사용됩니다. 예를 들어, 에러를 통제하기 위해 wrapping 한 컨테이너에서 값을 추출할 때 사용됩니다.

```js
// Wrapper 에는 getter가 없습니다.
class Wrapper {
  constructor(value) {
    this._value = value;
  }

  // 주어진 함수를 매핑합니다.
  map(f) {
    return f(this._value);
  }
}
const wrap = val => new Wrapper(val);

// getter 대신 identity를 매핑하여 _value값을 추출합니다.
const wrappedVal = wrap("Hello");
wrappedVal.map(R.identity); //-> "Hello"
```

![identity](https://user-images.githubusercontent.com/31612261/154015091-41ea2581-35d6-4e1a-93e6-7eb343f81818.jpeg)

위 코드에 대해 더 자세한 내용은 향후 포스트에서 모나드를 살펴보며 알아보겠습니다.

## tap

tap 조합기는 객체 하나와 함수 하나를 받아, 객체에 함수를 실행하고, 다시 객체를 반환합니다. void 함수를 연결하는데 유용하게 쓸 수 있습니다.

```
tap :: (a -> *) -> a -> a
```

예를 들어, compose 중간에 로깅 함수를 연결하고 싶다고 가정해 봅시다. 로깅 함수는 로그라는 사이드 이펙트를 남기고 void를 반환합니다. 그런데, <strong>반환 값이 void면 다음 함수로의 연결이 제대로 이루어질 수 없으므로, tap을 이용해 로그 처리 후 다시 객체를 반환아여 체인을 이어가는 것 입니다.</strong>

```js
// logger(outType,template,name,level,message) -> void
// partial을 이용해 message를 제외한 나머지 매개변수를 바인딩합니다.
const debugLog = R.partial(logger, "console", "basic", "MyLogger", "DEBUG");

// tap을 사용하였으므로, 합성 도중에 debug를 연결할 수 있습니다.
const debug = R.tap(debugLog);
/* 
  A -> clearInput -> A -> debug -> (void가 아니라)A -> checkLength -> A -> debug -> (void가 아니라)A
*/
const isValidKey = R.compose(debug, checkLength, debug, cleanInput);
```

로깅 외에도 DOM 업데이트, 파일IO 등 void를 반환하는 함수를 합성할 때 유용하게 사용될 수 있습니다.

## alternation(alt, or조합기)

함수 2개를 받아 값이 있으면 첫 번째 함수를, 없으면(ex. null)두 번째 함수를 실행한 후, 결과를 반환합니다.

curry를 이용해 표현하면 다음과 같습니다.

```js
const alt = R.curry((f1, f2, val) => f1(val) || f2(val));
```

alt를 이용하면 A실패시 B를 수행하도록 할 수 있습니다.

예를 들어, 데이터 조회가 실패하면 새 학생을 생성하도록 할 수 있습니다.

```js
// 데이터 조회가 성공하면 해당 데이터를 DOM에 추가, 실패하면 데이터 생성 후 DOM에 추가

// 명령형으로 구현하면 다음과 같습니다.
const student = findStudent("123");
if (student) {
  const info = csv(studnet);
  append("#student-info", info);
} else {
  const newStudent = createStudent("123");
  const info = csv(newStudent);
  append("#student-info", info);
}

// alt를 이용해 함수형으로 멋지게 구현할 수 있습니다.
const showStudent = R.compose(
  append("#student-info"),
  csv,
  alt(findStudent, createStudent)
);
```

## sequence

2개 이상의 함수를 인수로 받아, 동일한 값에 대해 각 함수를 차례로 실행하는 함수를 반환하는 조합기 입니다. 다음과 같이 구현과 사용이 가능합니다.

```js
const seq = (f1,f2,...,fn) => {
  const funcs = Array.prototype.slice.call(arguments);
  return val => {
    funcs.forEach(fn => {
      fn(val);
    });
  };
};

const showStudent = R.compose(
  seq(
    append('#studnet-info'),
    consoleLog
  ),
  csv,
  findStudent
);
```

sequence 조합기는 함수들을 차례로 수행할 뿐 값을 반환하지는 않습니다. 합성 중간 단계에 seq를 넣고 싶으면 R.tap으로 연결하면 됩니다.

## fork(join)

주어진 입력을 2개로 분기(fork)해 각각 다른 terminal function을 수행하고 그 결과를 조합(join)합니다. 따라서 fork 함수 2개 + join함수 1개가 필요합니다.

![fork](https://user-images.githubusercontent.com/31612261/154022862-ea91d856-a48c-4625-95d7-793a3b3145ac.png)

fork는 다음과 같이 구현할 수 있습니다.

```js
// f1과 f2를 각각 실행 후 결과에 join함수를 적용합니다.
const fork = (join, f1, f2) => val => join(f1(val), f2(val));
```

다음 예시는 평균 점수를 구하는 예제입니다.

```js
const averageGrade = R.compose(
  getLetterGrade,
  // sum과 length를 구한 후, 두 결과를 나눕니다.
  fork(R.divide, R.sum, R.length)
);
```
