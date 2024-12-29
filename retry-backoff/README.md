# retry-backoff

Retry operations with incremental backoff.

---

There's a default timeout set to 30 seconds. If you'd like to set a different
timeout, you'll need to either pass in options as a second argument to
`useRetryWithBackoff`:

```js
import { main } from "effection";
import { useRetryWithBackoff } from "@effection-contrib/retry-backoff";

await main(function* () {
  yield* useRetryWithBackoff(function* () {
    yield* call(() => fetch("https://foo.bar/"));
  }, { timeout: 45_000 });
});
```

Or set the timeout via the context so that the same timeout can be applied to all
of your retry operations:

```js
import { main } from "effection";
import {
  RetryBackoffContext,
  useRetryWithBackoff,
} from "@effection-contrib/retry-backoff";

await main(function* () {
  yield* RetryBackoffContext.set({ timeout: 45_000 });
  yield* retryWithBackoff(function* () {
    yield* call(() => fetch("https://foo.bar/"));
  });
});
```
