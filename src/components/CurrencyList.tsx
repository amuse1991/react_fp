import { useEffect, useState } from "react";
import { TCurrency } from "../types/currency.type";
import { apiClient } from "../utils/apiClient";
import { nanoid } from "@reduxjs/toolkit";

export default function CurrencyList() {
  const [currencyData, setCurrencyData] = useState<TCurrency[]>([]);

  function fetchCurrency() {
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
  }

  return (
    <div>
      <button onClick={fetchCurrency}>환율 정보 받아오기</button>
      <ul data-test-id={"data-cy-currency-ul"}>
        {currencyData.map(currency => (
          <li
            key={nanoid()}
          >{`${currency.currency_code} : ${currency.exchange_rate}`}</li>
        ))}
      </ul>
    </div>
  );
}
