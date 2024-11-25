# Cache

Cache module provides an adapter interface for caching and reusing results of
computations. It includes a JSONL adapter for storing cache on the file system.

---

## Getting Started

You can use the default cache client which will write cache to
`join(import.meta.dirname ?? Deno.cwd(), ".cache")`.

```ts
import { run } from "npm:effection@4.0.0-alpha.3";
import { useCache } from "jsr:@effection-contrib/cache";

await run(function* () {
  const cache = yield* useCache();

  console.log(cache.location); // output cache location
});
```

## Custom location

You can create a custom cache location by using `JSONLCache.from` function. It
ensures that you do not forget to add a trailing forward slash to the path.

```ts
import { run } from "npm:effection@4.0.0-alpha.3";
import {
  CacheContext,
  JSONLCache,
  useCache,
} from "jsr:@effection-contrib/cache";

await run(function* () {
  const cache = JSONLCache.from({
    location: `file://absolute/path/to/the/location/`,
  });
  yield* CacheContext.set(cache);
});
```

## Writing and appending to cache

You can write to the cache at a given key and append to the same key.

```ts
import { run } from "npm:effection@4.0.0-alpha.3";
import { useCache } from "jsr:@effection-contrib/cache";

await run(function* () {
  const cache = yield* useCache();

  yield* cache.write("greeting", "hello world!");
  yield* cache.append("greeting", "another greeting!");
  yield* cache.append("greeting", "yet another!");
});
```

`greeting` is the key and `hello world!` is the value. The value will be
serialized to JSON on write - you do not need to worry about it. Appending
content to the same file makes it easy to collocate relevant entities.

## Reading

Reading values from a key produces a stream of all values from the given key.

```ts
import { run } from "npm:effection@4.0.0-alpha.3";
import { useCache } from "jsr:@effection-contrib/cache";

await run(function* () {
  const cache = yield* useCache();

  for (const item of yield* each(cache.read<number>("greeting"))) {
    console.log(item);
    yield* each.next();
  }
});
```
