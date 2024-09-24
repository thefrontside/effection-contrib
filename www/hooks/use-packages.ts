import { evaluate } from "@mdx-js/mdx";
import { join, resolve } from "@std/path";
import { call, type Operation } from "effection";
import rehypePrismPlus from "rehype-prism-plus";
import remarkGfm from "remark-gfm";
import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";
import { unified } from "rehype";
import { z } from "zod";
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { toString } from "hast-util-to-string";

import remarkParse from 'remark-parse';

import rehypeInferDescriptionMeta from "rehype-infer-description-meta";

interface Package {
  path: string;
  dirname: string;
  packageName: string;
  readme: string;
  exports: string | Record<string, string>;
  MDXContent: () => JSX.Element;
  MDXDescription: () => JSX.Element;
}

const DenoJson = z.object({
  name: z.string(),
  version: z.optional(z.string()),
  exports: z.union([z.record(z.string()), z.string()]),
  private: z.union([z.undefined(), z.literal(true)]),
});

export function* usePackages(): Operation<Package[]> {
  const root = yield* call(() =>
    import("../../deno.json", { with: { type: "json" } })
  );

  const workspaces: Package[] = [];
  for (let workspace of root.default.workspace) {
    const workspacePath = resolve(
      import.meta.dirname ?? "",
      `../../${workspace}`,
    );

    const config: { default: unknown } = yield* call(
      () => import(`../../${workspace}/deno.json`, { with: { type: "json" } }),
    );

    const denoJson = DenoJson.parse(config.default);

    if (denoJson.private === true) {
      console.info(`Skipping ${workspace} because it's private`);
    } else {
      const readme = yield* call(() =>
        Deno.readTextFile(join(workspacePath, "README.md"))
      );

      let mod = yield* call(() =>
        evaluate(readme, {
          jsx,
          jsxs,
          jsxDEV: jsx,
          Fragment,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [[rehypePrismPlus, { showLineNumbers: true }]],
        })
      );

      const content = mod.default({});
      console.log( content )

      let file = yield* call(() =>
        unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeStringify)
          .use(rehypeInferDescriptionMeta, { inferDescriptionHast: true })
          .process(
            readme
          )
      );

      console.log(file)

      workspaces.push({
        dirname: workspace.replace("./", ""),
        path: workspacePath,
        packageName: denoJson.name,
        exports: denoJson.exports,
        readme,
        MDXContent: () => content,
        MDXDescription: () => file.data.meta.description
      });
    }
  }

  return workspaces;
}
