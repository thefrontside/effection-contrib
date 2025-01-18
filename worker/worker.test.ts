import {
  assert,
  assertStrictEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1";
import { each, run, sleep, spawn } from "npm:effection@4.0.0-alpha.4";

import { useWorker } from "./worker.ts";

Deno.test("worker", async () => {
  await run(function* () {
    let lastMessage: string | undefined;
    let lastError: string | undefined;

    let worker = yield* useWorker<string, string>(
      new URL("./test-assets/ping-pong.ts", import.meta.url),
      { type: "module", name: "ping-pong" },
    );

    yield* spawn(function* () {
      for (const message of yield* each(worker.messages)) {
        lastMessage = message.data;
        yield* each.next();
      }
    });

    yield* spawn(function* () {
      for (const error of yield* each(worker.errors)) {
        error.preventDefault();
        lastError = error.message;
        yield* each.next();
      }
    });

    assertStrictEquals(lastMessage, undefined);

    yield* worker.postMessage("ping");
    // todo(taras): find a way to do this without explicit sleep
    yield* sleep(10);

    assertStrictEquals(lastError, undefined);

    assertStrictEquals(lastMessage, "pong");

    yield* worker.postMessage("pong");
    yield* sleep(10);

    assertStrictEquals(lastError, undefined);

    assertStrictEquals(lastMessage, "ping");

    yield* worker.postMessage("boo");

    yield* sleep(10);

    assert(typeof lastError === "string", "lastError is defined");

    assertStringIncludes(lastError, "boo is neither ping nor pong");

    assertStrictEquals(lastMessage, "ping");
  });
});
