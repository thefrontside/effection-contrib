import { workerMain } from "../worker.ts";

await workerMain(function* ({ messages }) {
  yield* messages.forEach(function* () {
    throw new Error("boom!");
  });
});
