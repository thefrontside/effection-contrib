import type { Operation, Stream } from "npm:effection@4.0.0-alpha.3";

export interface Cache {
  location: URL;
  write(key: string, data: unknown): Operation<void>;
  append(key: string, data: unknown): Operation<void>;
  read<T>(key: string): Operation<Stream<T, unknown>>;
  has(key: string): Operation<boolean>;
  find<T>(glob: string): Stream<T, void>;
  clear(): Operation<void>;
}

export interface CacheConstructorOptions {
  location: URL | string;
}
