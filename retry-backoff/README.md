# retry-backoff

Retry operations with incremental backoff.

---

There's a default timeout set to 30 seconds. If you'd like to set a different
timeout, you'll need to either pass in options to `useRetryWithBackoff`:

```ts
import { main } from "effection";
import { useRetryWithBackoff } from "@effection-contrib/retry-backoff";
import { myOperation } from "./myOperation";

await main(function* () {
  yield* useRetryWithBackoff(myOperation, { timeout: 45_000 });
});
```

Or initialize the context so that the same timeout can be applied to all of your
retry operations:

```ts
import { main } from "effection";
import {
  initRetryWithBackoff,
  useRetryWithBackoff,
} from "@effection-contrib/retry-backoff";
import { myOperation } from "./myOperation";

await main(function* () {
  yield* initRetryWithBackoff({ timeout: 45_000 });
  yield* retryWithBackoff(myOperation);
});
```
