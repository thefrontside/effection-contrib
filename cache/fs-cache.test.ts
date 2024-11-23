import { run, each } from "npm:effection@4.0.0-alpha.3";
import { describe, beforeEach, it } from "jsr:@std/testing@1.0.5/bdd";
import { createFSCache } from "./fs-cache.ts";
import type { Cache } from './types.ts';
import { expect } from "jsr:@std/expect@1.0.8";
import { join, dirname } from "jsr:@std/path@1.0.8";
// using promisify there because Deno's ensure doesn't work
// correctly in Node. We should run these tests in Node
// to make sure that it'll work in Node too.
import { mkdir } from "node:fs";
import { promisify } from "node:util";

describe("FSCache", () => {
  let cache: Cache;
  let tmpDir: string;

  async function readTmpFile(fileName: string) {
    return await Deno.readTextFile(`${tmpDir}/${fileName}`);
  }

  async function writeTmpFile(fileName: string, data: string) {
    await promisify(mkdir)(join(tmpDir, dirname(fileName)), { recursive: true })
    await Deno.writeTextFile(join(tmpDir, fileName), data);
  }

  async function appendTmpFile(fileName: string, data: string) {
    const destination = join(tmpDir, fileName);
    const file = await Deno.open(destination, { append: true });
    await file.write(new TextEncoder().encode(data));
    file.close();
  }

  beforeEach(async () => {
    tmpDir = await Deno.makeTempDir();
    cache = createFSCache({ location: tmpDir });
  });

  it("writes to a file", async () => {
    await run(function*() {
      yield* cache.write("hello", "world");
    });
    expect(await readTmpFile("hello.jsonl")).toBe('"world"\n')
  });

  it("appends to a file", async () => {
    await run(function*() {
      yield* cache.write("hello", "1");
      yield* cache.append("hello", "2");
    });
    expect(await readTmpFile("hello.jsonl")).toBe('"1"\n"2"\n');
  });

  describe("clearing cache", () => {
    beforeEach(async () => {
      await writeTmpFile("hello.jsonl", "world\n");
    });
    it("clears cache when called clear", async () => {
      await run(function*() {
        yield* cache.clear();
      });
      const entries = [];
      for await (const dirEntry of Deno.readDir(tmpDir)) {
        entries.push(dirEntry);
      }
      expect(entries).toHaveLength(0);
    });
  });

  describe("reading content of a file", () => {
    beforeEach(async () => {
       await Deno.writeTextFile(join(tmpDir, 'test.jsonl'), `1\n2\n3\n`);
    });
    it("streams multiple items", async () => {
      const items: number[] = [];
      await run(function*() {
        for (const item of yield* each(yield* cache.read<number>('test'))) {
          items.push(item);
          yield* each.next();
        }
      });
      expect(items).toEqual([1, 2, 3]);
    });
  });

  describe('finds cached files using glob', () => {
    beforeEach(async () => {
      await writeTmpFile("subdir/1.jsonl", "1\n");
      await writeTmpFile("subdir/2.jsonl", "2\n");
      await writeTmpFile("subdir/3.jsonl", "3\n");      
    });
    it("streams multiple items", async () => {
      const items: number[] = [];
      await run(function*() {
        for (const item of yield* each(cache.find<number>('subdir/*'))) {
          items.push(item);
          yield* each.next();
        }
      });
      expect(items.sort()).toEqual([1, 2, 3]);
    });
    describe("multiple values in a single file", () => {
      beforeEach(async () => {
        await appendTmpFile("subdir/2.jsonl", "2.1\n");
      });
      it("streams all lines from globbed files", async () => {
        const items: number[] = [];
        await run(function*() {
          for (const item of yield* each(cache.find<number>('subdir/*'))) {
            items.push(item);
            yield* each.next();
          }
        });
        expect(items.sort()).toEqual([1, 2, 2.1, 3]);
      })
    })
  });
})