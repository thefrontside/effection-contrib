# Web Worker

A library for seamlessly integrating [Web Workers][web worker] with Effection
programs.

## Features

- Supports both stateless and stateful workers
- Automatic Worker lifecycle management
- Graceful shutdown of workers from the main thread
- Propagates errors from workers to the main thread
- Type-safe message handling

## Usage: Stateless Worker

A stateless worker runs an operation function in the worker and returns the
value to the main thread. You can pass data to the worker, which will be used as
an argument for the operation function.

### Main Thread

```ts
import { run } from "effection";
import { useWorker } from "@effection-contrib/worker";

await run(function* () {
  const worker = yield* useWorker<number, number, number, number>(
    "./fibonacci.ts",
    {
      type: "module",
      data: 5, // data is passed to the operation function (can be any serializable value)
    },
  );

  const result = yield* worker; // wait for the result to receive the result

  console.log(result); // Output: 5
});
```

### Worker thread

The worker thread uses `workerMain` to automatically connect to the main thread
and invoke the operation function when the main thread is ready to recieve the
result. The return value is sent back to the main thread.

```ts
import { workerMain } from "@effection-contrib/worker";

await workerMain<number, number, number, number>(
  function* ({ messages, data }) {
    return fibonacci(data);
  },
);

function fibonacci(n) {
  if (n <= 1) return n;

  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}
```

### Error handling

Errors thrown in the operation function of the worker can be captured in the
main thread by wrapping `yield* worker` in a `try`/`catch`;

```ts
try {
  const result = yield * worker;

  console.log(result);
} catch (e) {
  console.error(e); // error will be available here
}
```

## Usage: Stateful Worker

A stateful worker receives messages from the main thread, performs computations,
and returns the result. The main thread will wait for the worker to complete
processing each message before continuing. They are stateful because the worker
continues while idle and state within the worker is preserved in the closure
scope.

### Main Thread

This example is a counter worker that recieves a number, adds it to previously
computed value and returns the result.

```ts
import { run } from "effection";
import { useWorker } from "@effection-contrib/worker";

await run(function* () {
  const worker = yield* useWorker<number, number, number, number>(
    "./counter-worker.ts",
    {
      type: "module",
      data: 5, // initial value used by the stateful worker (can be any serializable value)
    },
  );

  console.log(yield* worker.send(5)); // Output 10

  console.log(yield* worker.send(10)); // Output: 20

  console.log(yield* worker.send(-5)); // Output: 15
});
```

### Worker Thread

```ts
import { workerMain } from "../worker.ts";

await workerMain<number, number, void, number>(
  function* ({ messages, data }) {
    let counter = data; // value persisted in-memory between computations

    yield* messages.forEach(function* (message) {
      counter += message; // updated the in-memory value
      return counter; // return the result
    });
  },
);
```

### Error Handling

You can catch error thrown while computing result for a message by wrapping
`yield* wrapper.send()` in a `try`/`catch`.

```ts
try {
  console.log(yield * worker.send(5)); // Output 10
} catch (e) {
  console.error(e); // error will be available here
}
```

[web worker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
