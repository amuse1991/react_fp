# mirage.js

mirage.js는 API 서버를 mocking 하는 기능을 제공합니다. 작동 방식은 클라이언트가 보내는 리퀘스트를 인터셉트해서 mock response를 보내주는 방식입니다. 일종의 가짜 서버를 만드는 방식이라 테스팅 뿐만 아니라 개발에도 활용할 수 있습니다.

> Mirage is a JavaScript library that lets frontend developers mock out backend APIs. Unlike other mocking libraries, Mirage makes it easy to recreate dynamic scenarios, the kind that are typically only possible when using a real production server.

이번 포스팅에서는 mirage.js를 이용해 환율 정보를 반환하는 API 서버를 mocking해 보겠습니다.

## 데이터 만들기

mirage.js는 db, fixture, factory를 지원합니다. 이 중 factory를 이용하면 쉽게 데이터를 만들어 낼 수 있습니다. db나 fixture에 비해 훨씬 유동적으로 테스트 데이터를 생성할 수 있기 때문에 매우 유용합니다.

예를 들어, 실제 db에 new_field 라는 필드가 추가된다면 mirage db나 fixtures는 데이터를 직접 수정해 주어야 합니다. 하지만 factory를 이용한다면 코드 몇 줄만 추가해 주면 됩니다.

factory를 사용할 때 함께 사용하면 유용한 라이브러리로 [faker.js](https://fakerjs.dev/)가 있습니다. 아래는 이 둘을 사용해 환율 정보를 만드는 코드입니다.

```js
createServer({
  models: {
    currency: Model
  },

  factories: {
    currency: Factory.extend({
      currency_code() {
        return faker.finance.currencyCode();
      },
      effective_date() {
        return faker.date.between(
          "2022-01-01T00:00:00.000Z",
          "2022-02-01T00:00:00.000Z"
        );
      },
      exchange_rate() {
        return faker.finance.amount(0, 2, 5);
      },
      bid_rate() {
        return faker.finance.amount(0, 2, 5);
      },
      offer_rate() {
        return faker.finance.amount(0, 2, 5);
      }
    })
  },

  // 100개 currency 데이터 생성
  seeds(server) {
    server.createList("currency", 100);
  }
});
```

## 라우팅 구현

간단한 get api를 구현한 후, createServer 코드 안에 넣어줍니다.

```js
    routes() {
      this.get("/api/currency", (schema, request) => {
        const { effective_date } = request.queryParams;
        return effective_date
          ? schema.all("currency")
          : schema.findBy("currency", {
              effective_date: new Date(effective_date)
            });
      });
    }
```

## React에 적용

이제 완성된 서버를 react 시작 시 호출해 주기만 하면 됩니다!
server.ts 파일을 만들어 서버를 export 해 줍니다. 저는 [공식 문서](https://miragejs.com/quickstarts/react/develop-a-component/)에 소개된 대로 makeServer를 만들어 creatServer를 래핑한 후 export 해 주었습니다.

```js
export function makeServer({ environment = "test" }:TServerEnv = {}) {
  return createServer({
    ...
  })
}
```

그 후 index.ts 에서 호출합니다.

테스트를 위해 간단하게 데이터를 표시하는 컴포넌트도 만들어 줍니다.

```js
// index.ts
if (process.env.NODE_ENV === "development") {
  makeServer({ environment: "development" });
}

ReactDOM.render(
  ...
);

// components/CurrencyList
  useEffect(() => {
    apiClient
      .get<{ currencies: TCurrency[] }>("/api/currency", {
        params: {
          effective_date: "2022-01-02"
        }
      })
      .then(res => {
        console.log(res.data.currencies);
        setCurrencyData(res.data.currencies || []);
      });
  }, []);
```

성공적으로 api가 호출되었습니다.

![result image](https://imgur.com/gsByMYW)
