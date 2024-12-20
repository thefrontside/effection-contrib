import { all, call, createContext, type Operation } from "effection";
import { join, resolve } from "jsr:@std/path@1.0.6";
import type { VFile } from "npm:vfile@6.0.3";
import { z } from "npm:zod@3.23.8";
import type { JSXElement } from "revolution";

import { type DocNode, useDenoDoc } from "./use-deno-doc.tsx";
import { useMDX } from "./use-mdx.tsx";
import { useDescriptionParse } from "./use-description-parse.tsx";
import { REPOSITORY_DEFAULT_BRANCH_URL } from "../config.ts";
import {
  PackageDetailsResult,
  PackageScoreResult,
  useJSRClient,
} from "./use-jsr-client.ts";

export interface Package {
  /**
   * Location of the package on the file system
   */
  path: string;
  /**
   * Name of the directory on the file system
   */
  workspace: string;
  /**
   * Name of the scope (without @) - should be effection-contrib
   */
  scope: string;
  /**
   * Name of the package without the scope
   */
  name: string;
  /**
   * Full package name from deno.json#name
   */
  packageName: string;
  /**
   * Package version in the repository
   */
  version: string;
  /**
   * Source code URL
   */
  source: URL;
  /**
   * URL of the package on JSR
   */
  jsr: URL;
  /**
   * URL of the package on JSR
   */
  jsrBadge: URL;
  /**
   * URL of package on npm
   */
  npm: URL;
  /**
   * URL of badge for version published on npm
   */
  npmVersionBadge: URL;
  /**
   * Contents of the README.md file
   */
  readme: string;
  /**
   * Normalized exports from deno.json file
   */
  exports: Record<string, string>;
  /**
   * Bundle size badge from bundlephobia
   */
  bundleSizeBadge: URL;
  /**
   * Bundlephobia URL
   */
  bundlephobia: URL;
  /**
   * Dependency Count Badge
   */
  dependencyCountBadge: URL;
  /**
   * Tree Shaking Support Badge URL
   */
  treeShakingSupportBadge: URL;
  /**
   * JSR Score
   */
  jsrPackageDetails: () => Operation<
    [
      z.SafeParseReturnType<unknown, PackageDetailsResult>,
      z.SafeParseReturnType<unknown, PackageScoreResult>,
    ]
  >;
  /**
   * Generated docs
   */
  docs: Record<string, Array<RenderableDocNode>>;
  MDXContent: () => JSX.Element;
  MDXDescription: () => JSX.Element;
}

export type RenderableDocNode = DocNode & {
  id: string;
  MDXDoc?: () => JSXElement;
};

export const DenoJson = z.object({
  name: z.string(),
  version: z.string(),
  exports: z.union([z.record(z.string()), z.string()]),
  private: z.union([z.undefined(), z.literal(true)]),
  license: z.string(),
});

export type PackageConfig = {
  readme: string;
  workspace: string;
  workspacePath: string;
} & z.infer<typeof DenoJson>;

export const DEFAULT_MODULE_KEY = ".";

const PackageContext = createContext<Package>("package");

export function* initPackageContext(config: PackageConfig) {
  const pkg = yield* createPackage(config);
  return yield* PackageContext.set(pkg);
}

export function* usePackage(): Operation<Package> {
  return yield* PackageContext;
}

export function* readPackageConfig(
  workspace: string,
): Operation<PackageConfig> {
  const workspacePath = resolve(Deno.cwd(), workspace);

  const config: { private?: boolean } = yield* call(
    async () =>
      JSON.parse(await Deno.readTextFile(`${workspacePath}/deno.json`)),
  );

  const readme = yield* call(async () => {
    try {
      return await Deno.readTextFile(join(workspacePath, "README.md"));
    } catch {
      return "Could not find a README.md file";
    }
  });

  const denoJson = DenoJson.parse(config);

  return {
    ...denoJson,
    workspace,
    workspacePath,
    readme,
  };
}

function* createPackage(config: PackageConfig) {
  let mod = yield* useMDX(config.readme);

  const content = mod.default({});

  let file: VFile = yield* useDescriptionParse(config.readme);

  const exports = typeof config.exports === "string"
    ? {
      [DEFAULT_MODULE_KEY]: config.exports,
    }
    : config.exports;

  const [, scope, name] = config.name.match(/@(.*)\/(.*)/) ?? [];

  if (!scope) throw new Error(`Expected a scope but got ${scope}`);
  if (!name) throw new Error(`Expected a package name but got ${name}`);

  const entrypoints: Record<string, URL> = {};
  for (const key of Object.keys(exports)) {
    entrypoints[key] = new URL(
      join(config.workspacePath, exports[key]),
      "file://",
    );
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
    workspace: config.workspace.replace("./", ""),
    jsr: new URL(`./${config.name}/`, "https://jsr.io/"),
    jsrBadge: new URL(`./${config.name}`, "https://jsr.io/badges/"),
    npm: new URL(`./${config.name}`, "https://www.npmjs.com/package/"),
    bundleSizeBadge: new URL(
      `./${config.name}/${config.version}`,
      "https://img.shields.io/bundlephobia/minzip/",
    ),
    npmVersionBadge: new URL(
      `./${config.name}`,
      "https://img.shields.io/npm/v/",
    ),
    bundlephobia: new URL(
      `./${config.name}/${config.version}`,
      "https://bundlephobia.com/package/",
    ),
    dependencyCountBadge: new URL(
      `./${config.name}`,
      "https://badgen.net/bundlephobia/dependency-count/",
    ),
    treeShakingSupportBadge: new URL(
      `./${config.name}`,
      "https://badgen.net/bundlephobia/tree-shaking/",
    ),
    path: config.workspacePath,
    packageName: config.name,
    scope,
    source: new URL(config.workspace, REPOSITORY_DEFAULT_BRANCH_URL),
    name,
    exports,
    readme: config.readme,
    docs,
    version: config.version,
    *jsrPackageDetails(): Operation<[
      z.SafeParseReturnType<unknown, PackageDetailsResult>,
      z.SafeParseReturnType<unknown, PackageScoreResult>,
    ]> {
      const client = yield* useJSRClient();
      const [details, score] = yield* all([
        client.getPackageDetails({ scope, package: name }),
        client.getPackageScore({ scope, package: name }),
      ]);

      if (!details.success) {
        console.info(
          `JSR package details response failed validation`,
          details.error.format(),
        );
      }

      if (!score.success) {
        console.info(
          `JSR score response failed validation`,
          score.error.format(),
        );
      }

      return [details, score];
    },
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
