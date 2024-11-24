import {
  type Context,
  createContext,
  type Operation,
} from "npm:effection@4.0.0-alpha.3";
import { join } from "jsr:@std/path@1.0.8";
import type { Cache } from "./types.ts";
import { JSONLCache } from "./jsonl.ts";

const DEFAULT_CACHE: Cache = JSONLCache.from({
  location: join(import.meta.dirname ?? Deno.cwd(), ".cache"),
});

export const CacheContext: Context<Cache> = createContext<Cache>(
  "cache",
  DEFAULT_CACHE,
);

export function* useCache(): Operation<Cache> {
  return yield* CacheContext.expect();
}
