import { call, suspend } from "npm:effection@4.0.0-alpha.4";
import { workerMain } from "../worker.ts";

export interface ShutdownWorkerParams {
  startFile: string;
  endFile: string;
  endText: string;
}

await workerMain(function* ({ data }) {
  let params = data as ShutdownWorkerParams;
  let { startFile, endFile, endText } = params;
  try {
    yield* call(() => Deno.writeTextFile(startFile, "started"));
    yield* suspend();
  } finally {
    yield* call(() => Deno.writeTextFile(endFile, endText));
  }
});
