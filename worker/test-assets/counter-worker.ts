import { workerMain } from "../worker.ts";

await workerMain<number, number, void, number>(
  function* ({ messages, data: initial }) {
    let counter = initial;

    yield* messages.forEach(function* (message) {
      counter += message;
      return counter;
    });
  },
);
