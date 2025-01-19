# Web Worker

A library for seamlessly integrating [Web Workers][web worker] with Effection
programs.

## Features

- Automatic Worker lifecycle management
- Graceful shutdown when operations go out of scope
- Separate streams for errors, message errors, and messages
- Type-safe message handling

## Usage

The `useWorker` function creates a Web Worker and returns a resource that
manages its lifecycle:

```ts
import { run } from "effection";
import { useWorker } from "@effection-contrib/worker";

await run(function* () {
  // Create and initialize the worker
  const worker = yield* useWorker("./worker-script.js");

  // Handle worker errors
  yield* spawn(function* () {
    for (const event of yield* each(worker.errors)) {
      // Throwing here will interrupt the program
      event.preventDefault();
      throw event.error;
    }
  });

  // Handle worker messages
  yield* spawn(function* () {
    for (const event of yield* each(worker.messages)) {
      console.log("Received message:", event);
      yield* each.next();
    }
  });

  try {
    // Send messages to the worker
    yield* worker.postMessage({ type: "process", data: "some data" });
  } finally {
    // Clean up: send close message to worker
    yield* worker.postMessage({
      type: "close",
      result: Ok(),
    });
  }
});
```

[web worker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
