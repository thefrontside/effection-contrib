import { each, run, spawn, suspend } from "npm:effection@4.0.0-alpha.4";
import { messages } from "../worker.ts";

const incoming = messages<string>()

await run(function*() {
  yield* spawn(function*() {
    for (const message of yield* each(incoming)) {
      if (message === "ping") {
        self.postMessage("pong")
      } else if (message === "pong") {
        self.postMessage("ping");
      } else {
        throw new Error(`${message} is neither ping nor pong.`);
      }
      yield* each.next();
    }
  });

  yield* suspend();
});