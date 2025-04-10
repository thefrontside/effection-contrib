# tinyexec

Effection compatible wrapper around
[tinyexec](https://www.npmjs.com/package/tinyexec) package.

---

To run a process, use the `x` function:

```ts
import { x } from "@effectionx/tinyexec";
import { each, main } from "effection";

await main(function* () {
  let proc = yield* x("echo", ["Hello, World"]);

  for (let line of yield* each(proc.lines)) {
    console.log(line);
    yield* each.next();
  }
});
// => prints "Hello, World"
```

The process will be automatically destroyed whenever it passes out of scope. For
example, the following shows the output of the `top` command for five seconds
before exiting.

```ts
import { x } from "@effectionx/tinyexec";
import { each, main, sleep, spawn } from "effection";

await main(function* () {
  yield* spawn(function* () {
    let proc = yield* x("top");

    for (let line of yield* each(proc.lines)) {
      console.log(line);
      yield* each.next();
    }
  });

  yield* sleep(5000);
});
```
