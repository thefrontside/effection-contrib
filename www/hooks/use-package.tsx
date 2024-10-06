import { all, call, type Operation } from "effection";
import { join, resolve } from "jsr:@std/path@1.0.6";
import type { VFile } from "npm:vfile@6.0.3";
import { z } from "npm:zod@3.23.8";
import type { JSXElement } from "revolution";

import { PrivatePackageError } from "../errors.ts";
import { type DocNode, useDenoDoc } from "./use-deno-doc.tsx";
import { useMDX } from "./use-mdx.tsx";
import { useRemarkParse } from "./use-remark-parse.tsx";

export interface Package {
  path: string;
  workspace: string;
  packageName: string;
  readme: string;
  exports: Record<string, string>;
  docs: Record<string, Array<RenderableDocNode>>;
  MDXContent: () => JSX.Element;
  MDXDescription: () => JSX.Element;
}

export type RenderableDocNode = DocNode & {
  id: string;
  MDXDoc?: () => JSXElement;
};

const DenoJson = z.object({
  name: z.string(),
  version: z.optional(z.string()),
  exports: z.union([z.record(z.string()), z.string()]),
  private: z.union([z.undefined(), z.literal(true)]),
});

export const DEFAULT_MODULE_KEY = ".";

export function* usePackage(workspace: string): Operation<Package> {
  const workspacePath = resolve(Deno.cwd(), workspace);

  const config: { private?: boolean } = yield* call(
    async () =>
      JSON.parse(await Deno.readTextFile(`${workspacePath}/deno.json`)),
  );

  if (config.private === true) {
    throw new PrivatePackageError(workspace);
  }

  const denoJson = DenoJson.parse(config);

  const readme = yield* call(async () => {
    try {
      return await Deno.readTextFile(join(workspacePath, "README.md"));
    } catch {
      return "Could not find a README.md file";
    }
  });

  let mod = yield* useMDX(readme);

  const content = mod.default({});

  let file: VFile = yield* useRemarkParse(readme);

  const exports = typeof denoJson.exports === "string"
    ? {
      [DEFAULT_MODULE_KEY]: denoJson.exports,
    }
    : denoJson.exports;

  const entrypoints: Record<string, URL> = {};
  for (const key of Object.keys(exports)) {
    entrypoints[key] = new URL(join(workspacePath, exports[key]), "file://");
  }

  let docs: Package["docs"] = {};
  for (const key of Object.keys(entrypoints)) {
    const docNodes = yield* useDenoDoc(String(entrypoints[key]));
    docs[key] = yield* all(docNodes.map(function* (node) {
      if (node.jsDoc && node.jsDoc.doc) {
        try {
          const mod = yield* useMDX(node.jsDoc.doc);
          return {
            id: exportHash(key, node),
            ...node,
            MDXDoc: () => mod.default({}),
          };
        } catch (e) {
          console.error(
            `Could not parse doc string for ${node.name} at ${node.location}`,
            e,
          );
        }
      }
      return {
        id: exportHash(key, node),
        ...node,
      };
    }));
  }

  return {
    workspace: workspace.replace("./", ""),
    path: workspacePath,
    packageName: denoJson.name,
    exports,
    readme,
    docs,
    MDXContent: () => content,
    MDXDescription: () => <>{file.data?.meta?.description}</>,
  };
}

function exportHash(exportName: string, doc: DocNode): string {
  if (exportName === DEFAULT_MODULE_KEY) {
    return doc.name;
  } else {
    return `${exportName}__${doc.name}`;
  }
}
