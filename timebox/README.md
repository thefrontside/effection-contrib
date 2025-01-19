# @effection-contrib/timebox

Constrain any operation to complete within a certain time.

---

Very often you want to put a limit on how long an operation may run such as a
`fetch()` of an external resource, or handling a web request. To do this, you
can use the `timebox()` function. It will encapsulate the operation and either
return its result, or a otherwise a "timeout" object indicating that it did not
complete in the required time.

```ts
import { timebox } from "@effection-contrib/timebox";
import { handleRequest } from "./handle-request";

// a theoretical request handler
export function* handler(request) {
  // do not let the handler run for more than 10 seconds
  let result = yield* timebox(10000, () => handleRequest(request));
  if (result.timeout) {
    return new Response(504, "Gateway Timeout");
  } else {
    return result.value;
  }
}
```
