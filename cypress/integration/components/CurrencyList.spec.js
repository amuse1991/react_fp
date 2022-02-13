/* eslint-disable */
import { makeServer } from "../../../src/mirage/server";
describe("CurrencyList 컴포넌트", () => {
  let server;

  beforeEach(() => {
    server = makeServer({ environment: "test" });
  });

  afterEach(() => {
    server.shutdown();
  });
  it("환율 정보 받아오기 버튼을 클릭하면, 환율 리스트를 표시한다.", () => {
    server.createList("currency", 10);
    cy.visit("/");
    cy.contains("환율 정보 받아오기").click();
    cy.get('[data-test-id="data-cy-currency-ul"] li').should("have.length", 10);
  });
});
