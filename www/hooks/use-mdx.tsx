import { call, type Operation } from "effection";
import { evaluate } from "npm:@mdx-js/mdx@3.0.1";
import type { MDXModule } from "npm:@types/mdx@2.0.13";
import rehypePrismPlus from "npm:rehype-prism-plus@2.0.0";
import remarkGfm from "npm:remark-gfm@4.0.0";
import { Fragment, jsx, jsxs } from "revolution/jsx-runtime";

export function* useMDX(markdown: string): Operation<MDXModule> {
  return yield* call(() =>
    evaluate(markdown, {
      // @ts-expect-error Type 'unknown' is not assignable to type 'JSXComponent'.
      jsx,
      // @ts-expect-error Type '{ (component: JSXComponent, props: JSXComponentProps): JSXElement; (element: string, props: JSXElementProps): JSXElement; }' is not assignable to type 'Jsx'.
      jsxs,
      // @ts-expect-error Type 'unknown' is not assignable to type 'JSXComponent'.
      jsxDEV: jsx,
      Fragment,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrismPlus, { showLineNumbers: true }]],
    })
  );
}
