import { run } from "npm:effection@4.0.0-alpha.3";
import { describe, it } from "bdd";
import { expect } from "expect";
import { useRetryWithBackoff } from "./retry-backoff.ts"

describe("RetryBackoff", () => {
  it("retries operation and returns output if operation finishes on time", async () => {
    await run(function* () {
      let attempts = 0;
      let result = 0;
      yield* useRetryWithBackoff(function* () {
        if (attempts < 2) {
          attempts++;
          throw new Error("operation failed");
        } else {
          result = 1;
        }
      }, { timeout: 2_000 });
      expect(attempts).toBe(2);
      expect(result).toBe(1);
    })
  });

  it("retries operation and handles timeout when operation exceeds limit", async () => {
    await run(function* () {
      let attempts = 0;
      let result = 0;
      yield* useRetryWithBackoff(function* () {
        if (attempts < 2) {
          attempts++;
          throw new Error("operation failed");
        } else {
          result = 1;
        }
      }, { timeout: 500 });
      expect(result).toBe(0);
    })
  });
});
