import {
  createContext,
  type Operation,
  race,
  sleep,
} from "npm:effection@4.0.0-alpha.3";
import prettyMilliseconds from "npm:pretty-ms@7.0.1";

interface UseRetryBackoffOptions {
  timeout?: number;
}

interface RetryWithContextDefaults {
  timeout: number;
}

export const RetryBackoffContext = createContext<RetryWithContextDefaults>(
  "retry-with-context",
  {
    timeout: 30_000,
  }
);

/**
 * Retry an operation with incremental cooldown until it exceeds
 * the configured timeout value. The default timeout is 30 seconds.
 *
 * ```js
 * import { main } from "effection";
 * import { useRetryWithBackoff } from "@effection-contrib/retry-backoff";
 * 
 * await main(function* () {
 *   yield* useRetryWithBackoff(function* () {
 *     yield* call(() => fetch("https://foo.bar/"));
 *   }, { timeout: 45_000 });
 * });
 * ```
 *
 * @param {Object} [options] - The options object
 * @param {number} [options.timeout] - Timeout value in milliseconds
 */
export function* useRetryWithBackoff<T> (
  fn: () => Operation<T>,
  options?: UseRetryBackoffOptions,
) {
  const defaults = yield* RetryBackoffContext.expect();
  const _options = {
    ...defaults,
    ...options,
  };

  let attempt = -1;
  let name = fn.name || "unknown";

  function* body() {
    while (true) {
      try {
        const result = yield* fn();
        if (attempt !== -1) {
          console.log(`Operation[${name}] succeeded after ${attempt + 2} retry.`);
        }
        return result;
      } catch {
        // https://aws.amazon.com/ru/blogs/architecture/exponential-backoff-and-jitter/
        const backoff = Math.pow(2, attempt) * 1000;
        const delayMs = Math.round((backoff * (1 + Math.random())) / 2);
        console.log(`Operation[${name}] failed, will retry in ${prettyMilliseconds(delayMs)}.`);
        yield* sleep(delayMs);
        attempt++;
      }
    }
  }

  function* timeout() {
    yield* sleep(_options.timeout);
    console.log(`Operation[${name}] timedout after ${attempt + 2}`);
  }

  yield* race([
    body(),
    timeout(),
  ]);
}
