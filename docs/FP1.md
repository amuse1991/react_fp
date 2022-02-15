# FP 중요 기능 정리 1 :: 불변성

Ramda.js를 기반으로 함수형 프로그래밍의 핵심 기능을 정리해 보겠습니다. 이번 포스트에서는 불변성 관련 기능을 살펴보겠습니다.

# lens (또는 functional reference)

lens로 속성을 감싸면 속성의 불변성을 유지하면서 get, set 할 수 있습니다.

- R.view : getter의 역할.
- R.set : setter의 역할. <strong>새로운 객체</strong>를 생성해 반환하기 때문에 객체의 불변성이 유지됩니다.
- R.over : R.set과 동일하게 setter 역할을 하며, 새로운 객체를 생성해 반환한다. 다른 점은 R.over는 함수를 인자로 받아 해당 함수를 적용한 값을 반환한다는 점입니다.

```js
const xLens = R.lens(R.prop("x"), R.assoc("x"));

R.view(xLens, { x: 1, y: 2 }); //=> 1
R.set(xLens, 4, { x: 1, y: 2 }); //=> {x: 4, y: 2}
R.over(xLens, R.negate, { x: 1, y: 2 }); //=> {x: -1, y: 2}
```
