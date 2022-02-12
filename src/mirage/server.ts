/* eslint-disable */

import { createServer, Factory, Model } from "miragejs";
import faker from "@faker-js/faker";

type TServerEnv = {
  environment?: "test" | "development";
};

export function makeServer({ environment = "test" }: TServerEnv = {}) {
  return createServer({
    environment,
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

    seeds(server) {
      server.createList("currency", 100);
    },

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
  });
}
