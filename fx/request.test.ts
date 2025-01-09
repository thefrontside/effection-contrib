import { describe, it } from "bdd";
import { expect } from "expect";
import { run } from "npm:effection@3.0.3";

import { json, request } from "./request.ts";

// Ensure to run tests with --allow-net permission
const test = describe("request() and json()");

it(test, "should fetch a URL and return a response", async () => {
  const result = await run(function* () {
    const response = yield* request(
      "https://jsonplaceholder.typicode.com/todos/1",
    );
    return response;
  });

  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
});

it(test, "should parse JSON from a response", async () => {
  const result = await run(function* () {
    const response = yield* request(
      "https://jsonplaceholder.typicode.com/todos/1",
    );
    const data = yield* json(response);
    return data;
  });

  expect(result).toHaveProperty("id", 1);
  expect(result).toHaveProperty("title");
});
