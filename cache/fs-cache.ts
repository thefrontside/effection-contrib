import { JSONLinesParseStream } from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";
import { emptyDir, exists, walk } from "jsr:@std/fs@1.0.4";
import { basename, dirname, globToRegExp, join, toFileUrl } from "jsr:@std/path@1.0.6";
import {
  call,
  createQueue,
  each,
  type Operation,
  spawn,
  stream,
  type Stream,
} from "npm:effection@4.0.0-alpha.3";
import type { Cache, InitCacheContextOptions } from "./types.ts";

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

function* writeFile(
  file: fs.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions,
): Operation<void> {
  return yield* call(() => promisify(fs.writeFile)(file, data, options));
}

function* stat(
  path: fs.PathLike,
  options?: fs.StatOptions,
): Operation<fs.Stats | fs.BigIntStats> {
  return yield* call(() => promisify(fs.stat)(path, options));
}

export class FSCache implements Cache {
  location: URL;

  constructor(location: URL | string) {
    this.location = toFileUrl(`${location}`.replace(/\/?$/, '/'));
  }

  *has(key: string) {
    const location = new URL(`./${key}.jsonl`, this.location);

    return yield* call(async () => {
      try {
        return await exists(location);
      } catch {
        return false;
      }
    });
  }

  *read<T>(key: string) {
    const location = new URL(`./${key}.jsonl`, this.location);
    const file = yield* call(() => Deno.open(location, { read: true }));

    const lines = file
      .readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());

    return stream(lines as ReadableStream<T>);
  }

  *write(key: string, data: unknown) {
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

  *append(key: string, data: unknown) {
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

  *find<T>(glob: string): Stream<T, void> {
    const queue = createQueue<T, void>();
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

    yield* spawn(function* () {
      for (const file of yield* each(stream(files))) {
        const key = join(
          dirname(file.path.replace(pathname, "")),
          basename(file.name, ".jsonl"),
        );

        const items = yield* read<T>(key);
        for (const item of yield* each(items)) {
          queue.add(item);
          yield* each.next();
        }

        yield* each.next();
      }

      queue.close();
    });

    return queue;
  }

  *clear() {
    yield* call(() => emptyDir(this.location));
  }
}

export function createFSCache(options: InitCacheContextOptions): Cache {
  return new FSCache(options.location);
}