import { describe, it } from "bdd";
import { expect } from "expect";
import { run } from "npm:effection@4.0.0-alpha.4";

import { useWorker } from "./worker.ts";

describe("worker", () => {
  it("sends and receive messages in synchrony", async () => {
    await run(function* () {
      let worker = yield* useWorker(
        import.meta.resolve("./test-assets/echo-worker.ts"),
	{ type: "module"}
      );

      let result = yield* worker.send("hello world");
      expect(result).toEqual("hello world")
    });
  });
  it("will raise an exception if an exception happens on the remote side", async () => {});
  it("produces its return value", async () => {});
  it("raises an exception if the worker raises one", async () => {});
  it("crashes if there is an uncaught error", async () => {});
  it("crashes if there is a message error from the main thread", async () => {});
  it("crashes if there is a messag error from the worker thread", async () => {});
  it("shuts down gratefully", async () => {});
  it("passes arguments to the workerMain() function of the worker", async () => {});
});
