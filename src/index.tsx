import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { makeServer } from "./mirage/server";
import { createServer, Response } from "miragejs";
// import * as R from "ramda";

if (process.env.NODE_ENV === "development") {
  makeServer({ environment: "development" });
}

if (window.Cypress) {
  // If your app makes requests to domains other than / (the current domain), add them
  // here so that they are also proxied from your app to the handleFromCypress function.
  // For example: let otherDomains = ["https://my-backend.herokuapp.com/"]
  let otherDomains: string[] = [];
  let methods = ["get", "put", "patch", "post", "delete"];

  createServer({
    environment: "test",
    routes() {
      for (const domain of ["/", ...otherDomains]) {
        this.get(`${domain}*`, async (schema, request) => {
          let [status, headers, body] = await window.handleFromCypress(request);
          return new Response(status, headers, body);
        });
        // const { get, put, patch, post } = this;
        // for (const method of methods) {
        //   this[method](`${domain}*`, async (schema, request) => {
        //     let [status, headers, body] = await window.handleFromCypress(
        //       request
        //     );
        //     return new Response(status, headers, body);
        //   });
        // }
      }

      // If your central server has any calls to passthrough(), you'll need to duplicate them here
      // this.passthrough('https://analytics.google.com')
    }
  });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
