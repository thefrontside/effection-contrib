import { suspend } from "npm:effection@4.0.0-alpha.4";
import { workerMain } from "../worker.ts";

await workerMain(suspend);
