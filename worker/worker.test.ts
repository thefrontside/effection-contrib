import { describe, it } from "bdd";
import { expect } from "expect";
import { run } from "npm:effection@4.0.0-alpha.4";

import { useWorker } from "./worker.ts";

describe("worker", () => {
  it("sends and receive messages in synchrony", async () => {
    await run(function* () {
      let worker = yield* useWorker(
        import.meta.resolve("./test-assets/echo-worker.ts"),
        { type: "module" },
      );

      let result = yield* worker.send("hello world");
      expect(result).toEqual("hello world");
    });
  });
  it("will raise an exception if an exception happens on the remote side", async () => {
    let task = run(function* () {
      let worker = yield* useWorker<void, unknown, unknown, unknown>(
        import.meta.resolve("./test-assets/boom-worker.ts"),
        { type: "module" },
      );

      yield* worker.send();
    });
    await expect(task).rejects.toMatchObject({ message: "boom!" });
  });
  it("produces its return value", async () => {
    await run(function* () {
      let worker = yield* useWorker(
        import.meta.resolve("./test-assets/result-worker.ts"),
        { type: "module", data: "this is the worker result" },
      );

      expect(yield* worker).toEqual("this is the worker result");
      expect(yield* worker).toEqual("this is the worker result");
    });
  });
  it("raises an exception if the worker raises one", async () => {
    let task = run(function* () {
      let worker = yield* useWorker(
        import.meta.resolve("./test-assets/boom-result-worker.ts"),
        { type: "module", data: "boom!" },
      );

      let result = yield* worker;
      expect(result).toEqual("hello world");
    });
    await expect(task).rejects.toMatchObject({ message: "boom!" });
  });
  it.skip("shuts down gratefully", async () => {
  });

  it.skip("becomes halted if you try and await its value out of scope", () => {
  });

  it.skip("crashes if there is an uncaught error in the worker", async () => {
    let crash = import.meta.resolve("./test-assets/crash-worker.ts");
    let task = run(function* () {
      let worker = yield* useWorker(crash, { name: "crash", type: "module" });
      yield* worker;
    });
    await expect(task).rejects.toMatchObject({ message: "boom!" });
  });
  it.skip("crashes if the worker module cannot be found", async () => {
    let crash = import.meta.resolve("./test-assets/non-existent-worker.ts");
    let task = run(function* () {
      let worker = yield* useWorker(crash, { name: "crash", type: "module" });
      yield* worker;
    });
    await expect(task).rejects.toMatchObject({ message: "boom!" });
  });
  it.skip("crashes if there is a message error from the main thread", async () => {
    // don't know how to reproduce this
  });

  it.skip("crashes if there is a message error from the worker thread", async () => {
    // don't know how to trigger
  });
});
