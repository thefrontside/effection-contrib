import { call, suspend } from "effection";
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
