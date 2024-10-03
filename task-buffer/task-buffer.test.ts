import { run, sleep, spawn, type Task } from "effection";
import { describe, it } from "bdd";
import { expect } from "expect";
import { useTaskBuffer } from "./task-buffer.ts";

describe("TaskBuffer", () => {
  it("queues up tasks when the buffer fills up", async () => {
    await run(function* () {
      let buffer = yield* useTaskBuffer(2);

      yield* buffer.spawn(() => sleep(10));
      yield* buffer.spawn(() => sleep(10));

      let third: Task<void> | undefined = undefined;
      yield* spawn(function* () {
        third = yield* buffer.spawn(() => sleep(10));
      });

      yield* sleep(5);
      // right now the third spawn is queued up, but not spawned.
      expect(third).toBeUndefined();

      yield* sleep(10);

      // the other tasks finished and so the third task is active.
      expect(third).toBeDefined();
    });
  });

  it("allows to wait until buffer is drained", async () => {
    let finished = 0;
    await run(function* () {
      let buffer = yield* useTaskBuffer(5);
      for (let i = 0; i < 3; i++) {
        yield* buffer.spawn(function* () {
          yield* sleep(10);
          finished++;
        });
      }
      expect(finished).toEqual(0);

      yield* buffer;

      expect(finished).toEqual(3);
    });
  });
});
