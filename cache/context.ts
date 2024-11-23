import {
  createContext,
  type Operation,
} from "npm:effection@4.0.0-alpha.3";

export const CacheContext = createContext<Cache>("cache");

export function* useCache(): Operation<Cache> {
  return yield* CacheContext.expect();
}