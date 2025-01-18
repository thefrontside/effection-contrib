# Web Worker

Provides a resource for using a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) in Effection programs. The worker resource 
automatically handles gracefully shutting down the Worker when the operation that created
the worker goes out of scope. The worker resource provides a separate stream for `errors`, `messageerrors` and `messages`.

```ts
import { run } from "effection";
import { useWorker } from "@effection-contrib/worker"

await run(function*() {
  const worker = yield* useWorker("./script.js");

  yield* spawn(function* () {
    for (let event of yield* each(worker.errors)) {
      // throw here will interrupt the program
      throw event.error;
      // usually you'd have a `yield* each.next()` here
      // but here would never happen because of the throw
    }
  });

  yield* spawn(function* () {
    for (let event of yield* each(worker.messages)) {
      // do something with incoming message
      yield* each.next();
    }
  });

  try {
    // send a message into the worker
    yield* worker.postMessage(options);
  } finally {
    // send a message into worker to tell is to close
    // in case there some clean up that needs to happen inside 
    // of the worker
    yield* worker.postMessage({ type: "close", result: Ok() });
  }
});

```