import {
  type Operation,
  race,
  sleep,
} from "effection";
import prettyMilliseconds from "npm:pretty-ms@7.0.1";

interface UseRetryBackoffOptions {
  timeout: number;
  operationName: string | undefined | null;
}

export function* useRetryWithBackoff<T> (
  fn: () => Operation<T>,
  options: UseRetryBackoffOptions,
) {
  let attempt = -1;

  function* body() {
    while (true) {
      try {
        const result = yield* fn();
        if (attempt !== -1) {
          console.log(`Operation[${options.operationName}] succeeded after ${attempt + 2} retry.`);
        }
        return result;
      } catch {
        // https://aws.amazon.com/ru/blogs/architecture/exponential-backoff-and-jitter/
        const backoff = Math.pow(2, attempt) * 1000;
        const delayMs = Math.round((backoff * (1 + Math.random())) / 2);
        console.log(`Operation[${options.operationName}] failed, will retry in ${prettyMilliseconds(delayMs)}.`);
        yield* sleep(delayMs);
        attempt++;
      }
    }
  }

  function* timeout() {
    yield* sleep(options.timeout);
    console.log(`Operation[${options.operationName}] timedout after ${attempt + 2}`);
  }

  yield* race([
    body(),
    timeout(),
  ])
}
