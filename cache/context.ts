import { createContext, type Operation } from "npm:effection@4.0.0-alpha.3";
import { createJSONLCache } from "./jsonl.ts";
import { join } from "jsr:@std/path@1.0.8";
import type { Cache } from './types.ts';

const DEFAULT_CACHE = createJSONLCache({ location: join(import.meta.dirname ?? Deno.cwd(), '.cache') });

export const CacheContext = createContext<Cache>("cache", DEFAULT_CACHE);

export function* useCache(): Operation<Cache> {
  return yield* CacheContext.expect();
}
