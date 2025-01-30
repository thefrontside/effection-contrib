import { workerMain } from "../worker.ts";

await workerMain(function* ({ messages }) {
  yield* messages.forEach(function* (message) {
    return message;
  });
});
