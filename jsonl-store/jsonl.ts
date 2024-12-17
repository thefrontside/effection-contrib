import { JSONLinesParseStream } from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";
import { emptyDir, exists, walk } from "jsr:@std/fs@1.0.4";
import {
  basename,
  dirname,
  globToRegExp,
  join,
  toFileUrl,
} from "jsr:@std/path@1.0.6";
import {
  call,
  createQueue,
  each,
  type Operation,
  resource,
  spawn,
  type Stream,
  stream,
} from "npm:effection@4.0.0-alpha.3";
import type { Store, StoreConstructorOptions } from "./types.ts";

import fs from "node:fs";
import { promisify } from "node:util";

function* mkdir(
  path: fs.PathLike,
  options: fs.MakeDirectoryOptions & {
    recursive: true;
  },
): Operation<string | undefined> {
  return yield* call(() => promisify(fs.mkdir)(path, options));
}

export class JSONLStore implements Store {
  constructor(public location: URL) {}

  /**
   * Creates a store with a location that has a trailing slash.
   * The trailing slash is important to ensure that the store content
   * is written to the store directory and not the directory above which
   * can be very annoying. The location has to be absolute.
   * ```ts
   * const store = JSONLStore.from({ location: 'file:///Users/foo/.store/' })
   * ```
   *
   * @param options StoreConstructorOptions
   * @returns
   */
  static from(options: StoreConstructorOptions): JSONLStore {
    return new JSONLStore(
      toFileUrl(`${options.location}`.replace(/\/?$/, "/")),
    );
  }

  /**
   * Returns true when key is present
   * ```ts
   * import { useStore } from "jsr:@effection-contrib/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * if (yield* store.has("test")) {
   *  console.log("store exists");
   * }
   * ```
   *
   * @param key string
   * @returns boolean
   */
  *has(key: string): Operation<boolean> {
    const location = new URL(`./${key}.jsonl`, this.location);

    return yield* call(async () => {
      try {
        return await exists(location);
      } catch {
        return false;
      }
    });
  }

  /**
   * Returns content of a file as a stream
   *
   * ```ts
   * import { each } from "npm:effection@4.0.0-alpha.3";
   * import { useStore } from "jsr:@effection-contrib/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * for (const item of yield* each(store.read<number>("test"))) {
   *   console.log(item)
   *   yield* each.next();
   * }
   * ```
   *
   * @param key string
   * @returns Stream<T>
   */
  read<T>(key: string): Stream<T, void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    return resource(function* (provide) {
      const file = yield* call(() => Deno.open(location, { read: true }));

      const lines = file
        .readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new JSONLinesParseStream());

      yield* provide(yield* stream(lines as ReadableStream<T>));
    });
  }

  /**
   * Write data to a file, creates the file and necessary directory structure as it goes along.
   *
   * ```ts
   * import { useStore } from "jsr:@effection-contrib/jsonl-store";
   *
   * const store = yield* useStore();
   * yield* store.write("hello", "world");
   * ```
   * @param key string
   * @param data unknown
   */
  *write(key: string, data: unknown): Operation<void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    yield* mkdir(dirname(location.pathname), { recursive: true });

    const file = yield* call(() =>
      Deno.open(location, {
        create: true,
        write: true,
      })
    );

    try {
      yield* call(() =>
        file.write(new TextEncoder().encode(`${JSON.stringify(data)}\n`))
      );
    } finally {
      file.close();
    }
  }

  /**
   * Add data to an existing file.
   *
   * ```ts
   * import { useStore } from "jsr:@effection-contrib/jsonl-store";
   *
   * const store = yield* useStore();
   * yield* store.write("hello", "world");
   * yield* store.append("hello", "from bob");
   * ```
   * @param key string
   * @param data
   */
  *append(key: string, data: unknown): Operation<void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    const file = yield* call(() =>
      Deno.open(location, {
        append: true,
      })
    );

    try {
      yield* call(() =>
        file.write(new TextEncoder().encode(`${JSON.stringify(data)}\n`))
      );
    } finally {
      file.close();
    }
  }

  /**
   * Returns a stream of content from all files matching a glob
   *
   * ```ts
   * import { each } from "npm:effection@4.0.0-alpha.3";
   * import { useStore } from "jsr:@effection-contrib/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * for (const item of yield* each(store.find<number>("subdir/*"))) {
   *   console.log(item);
   *    yield* each.next();
   * }
   * ```
   *
   * @param glob string
   * @returns Stream<T, void>
   */
  find<T>(glob: string): Stream<T, void> {
    const { pathname } = this.location;

    const reg = globToRegExp(`${pathname}/${glob}`, {
      globstar: true,
    });

    const files = walk(this.location, {
      includeDirs: false,
      includeFiles: true,
      match: [
        reg,
      ],
    });

    const read = this.read.bind(this);

    return resource(function* (provide) {
      const queue = createQueue<T, void>();

      yield* spawn(function* () {
        for (const file of yield* each(stream(files))) {
          const key = join(
            dirname(file.path.replace(pathname, "")),
            basename(file.name, ".jsonl"),
          );

          for (const item of yield* each(read<T>(key))) {
            queue.add(item);
            yield* each.next();
          }

          yield* each.next();
        }

        queue.close();
      });

      yield* provide(queue);
    });
  }

  *clear(): Operation<void> {
    yield* call(() => emptyDir(this.location));
  }
}
