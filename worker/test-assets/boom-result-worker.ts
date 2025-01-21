import { workerMain } from "../worker.ts";

await workerMain(function* ({ data }) {
  throw new Error(String(data));
});
