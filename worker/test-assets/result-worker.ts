import { workerMain } from "../worker.ts";

await workerMain(function* ({ data }) {
  return data;
});
