import { run, sleep, spawn, type Task, withResolvers } from "effection";
import { describe, it } from "bdd";
import { expect } from "expect";
import { useTaskBuffer } from "./task-buffer.ts";

describe("TaskBuffer", () => {
  it("queues up tasks when the buffer fills up", async () => {
    await run(function* () {
      let buffer = yield* useTaskBuffer({ maxConcurrency: 2 });

      yield* buffer.enqueue(() => sleep(10));
      yield* buffer.enqueue(() => sleep(10));

      let third: Task<void> | undefined;
      yield* spawn(function* () {
        third = yield* yield* buffer.enqueue(() => sleep(10));
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
      let buffer = yield* useTaskBuffer({ maxConcurrency: 5 });
      for (let i = 0; i < 3; i++) {
        yield* buffer.enqueue(function* () {
          yield* sleep(10);
          finished++;
        });
      }

      expect(finished).toEqual(0);

      yield* buffer;

      expect(finished).toEqual(3);
    });
  });
  it("opens and closes according to a valve definition", async () => {
    await run(function* () {
      let opened = 0;
      let closed = 0;
      let buffer = yield* useTaskBuffer({
        maxConcurrency: 2,
        valve: {
          closeAt: 3,
          openAt: 1,
          *open() {
            opened++;
          },
          *close() {
            closed++;
          },
        },
      });
      let ops = Array(9).fill(null).map(() => withResolvers<void>());
      for (let i = 0; i <= 4; i++) {
        yield* buffer.enqueue(() => ops[i].operation);
        yield* sleep(0);
      }

      expect(closed).toEqual(0);
      yield* buffer.enqueue(() => ops[5].operation);

      expect(closed).toEqual(1);

      ops[0].resolve();
      ops[1].resolve();
      ops[2].resolve();

      yield* sleep(0);

      expect(opened).toEqual(1);

      yield* buffer.enqueue(() => ops[6].operation);
      yield* buffer.enqueue(() => ops[7].operation);
      yield* buffer.enqueue(() => ops[8].operation);

      expect(closed).toEqual(2);
    });
  });

  it("can be explicitly closed and flushed", async () => {
    await run(function* () {
      let buffer = yield* useTaskBuffer({ maxConcurrency: 2 });

      let ops = Array(9).fill(null).map(() => withResolvers<void>());

      for (let op of ops) {
        yield* buffer.enqueue(() => op.operation);
        yield* sleep(0);
      }

      let done = false;

      yield* spawn(function* () {
        yield* buffer.close();
        done = true;
      });

      expect(done).toEqual(false);

      ops[0].resolve();
      expect(done).toEqual(false);

      ops[1].resolve();
      yield* sleep(0);

      expect(done).toEqual(true);
    });
  });
});
