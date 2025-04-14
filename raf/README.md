# RAF: Request Animation Frame

Subscribe to a stream of
[Request Animation Frame](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame)
updates.

---

```ts
import { each, main, suspend } from "effection";
import { raf } from "@effectionx/raf";

await main(function* () {
  for (const timestamp of yield* each(raf)) {
    // add your handler code here
    console.log(timestamp);
    yield* each.next();
  }
});
```
