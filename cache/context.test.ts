import { run } from "npm:effection@4.0.0-alpha.3";
import { describe, it } from "jsr:@std/testing@1.0.5/bdd";
import { useCache } from "./mod.ts";
import { expect } from "expect/expect";

describe("CacheContext", () => {
  it("allows accessing context without initializing", async () => {
    let cache;
    await run(function*() {
      cache = yield* useCache();
    });
    expect(cache).toBeDefined();
  });
});