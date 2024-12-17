import {
  createContext,
  type Context as ContextType,
  type Operation,
  race,
  sleep,
} from "npm:effection@4.0.0-alpha.3";
import prettyMilliseconds from "npm:pretty-ms@7.0.1";

interface UseRetryBackoffOptions {
  timeout?: number;
}

export interface RetryWithContextDefaults {
  timeout: number;
}

const RetryWithBackoffContext = createContext<RetryWithContextDefaults>(
  "retry-with-context",
  {
    timeout: 30_000,
  }
);

export function* useRetryWithBackoff<T> (
  fn: () => Operation<T>,
  options?: UseRetryBackoffOptions,
) {
  const defaults = yield* RetryWithBackoffContext.expect();
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

export function* initRetryWithBackoff(
  defaults: RetryWithContextDefaults,
) {
  // deno-lint-ignore require-yield
  function* init(): Operation<RetryWithContextDefaults> {
    return defaults;
  }

  return yield* ensureContext(
    RetryWithBackoffContext,
    init(),
  );
}

export function* ensureContext<T>(Context: ContextType<T>, init: Operation<T>) {
  if (!(yield* Context.get())) {
    yield* Context.set(yield* init);
  }
  return yield* Context.expect();
}
