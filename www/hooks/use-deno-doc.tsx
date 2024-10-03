import { call, type Operation } from "effection";
import {
  doc,
  type DocOptions,
} from "https://deno.land/x/deno_doc@0.125.0/mod.ts";
import type { DocNode } from "https://deno.land/x/deno_doc@0.125.0/types.d.ts";

export function* useDenoDoc(
  specifier: string,
  docOptions: DocOptions = {},
): Operation<Array<DocNode>> {
  return yield* call(() => doc(specifier, docOptions));
}

export type { DocNode };
