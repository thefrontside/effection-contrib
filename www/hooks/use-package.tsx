import { call, type Operation } from "effection";
import { join, resolve } from "jsr:@std/path@1.0.6";
import type { VFile } from "npm:vfile@6.0.3";
import { z } from "npm:zod@3.23.8";

import { PrivatePackageError } from "../errors.ts";
import { type DocNode, useDenoDoc } from "./use-deno-doc.tsx";
import { useMDX } from "./use-mdx.tsx";
import { useRemarkParse } from "./use-remark-parse.tsx";

export interface Package {
  path: string;
  workspace: string;
  packageName: string;
  readme: string;
  exports: string | Record<string, string>;
  docs: Array<DocNode> | Record<string, Array<DocNode>>;
  MDXContent: () => JSX.Element;
  MDXDescription: () => JSX.Element;
}

const DenoJson = z.object({
  name: z.string(),
  version: z.optional(z.string()),
  exports: z.union([z.record(z.string()), z.string()]),
  private: z.union([z.undefined(), z.literal(true)]),
});

export function* usePackage(workspace: string): Operation<Package> {
  const workspacePath = resolve(
    import.meta.dirname ?? "",
    `../../${workspace}`,
  );

  const config: { default: unknown } = yield* call(
    () => import(`../../${workspace}/deno.json`, { with: { type: "json" } }),
  );

  const denoJson = DenoJson.parse(config.default);

  if (denoJson.private === true) {
    throw new PrivatePackageError(workspace);
  }

  const readme = yield* call(() =>
    Deno.readTextFile(join(workspacePath, "README.md"))
  );

  let mod = yield* useMDX(readme);

  const content = mod.default({});

  let file: VFile = yield* useRemarkParse(readme);

  let docs: Package["docs"];
  if (typeof denoJson.exports === "string") {
    docs = yield* useDenoDoc(
      `${new URL(join(workspacePath, denoJson.exports), "file://")}`,
    );
  } else {
    docs = {};
    for (const key of Object.keys(denoJson.exports)) {
      docs[key] = yield* useDenoDoc(
        `${new URL(join(workspacePath, denoJson.exports[key]), "file://")}`,
      );
    }
  }

  return {
    workspace: workspace.replace("./", ""),
    path: workspacePath,
    packageName: denoJson.name,
    exports: denoJson.exports,
    readme,
    docs,
    MDXContent: () => content,
    MDXDescription: () => <>{file.data?.meta?.description}</>,
  };
}
