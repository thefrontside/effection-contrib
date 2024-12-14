import { Rehype as OriginalRehype } from "effection-www/components/rehype.tsx";
import rehypeSlug from "npm:rehype-slug@6.0.0";
import rehypeAutolinkHeadings from "npm:rehype-autolink-headings@7.1.0";
import rehypeAddClasses from "npm:rehype-add-classes@1.0.0";
import rehypeInferDescriptionMeta from "npm:rehype-infer-description-meta@1.0.0";
import type { JSXElement } from "revolution/jsx-runtime";

interface RehypeProps {
  children: JSXElement;
}

export function Rehype({ children }: RehypeProps) {
  return (
    <OriginalRehype
      plugins={[
        rehypeSlug,
        rehypeInferDescriptionMeta,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: {
              className:
                "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5",
            },
          },
        ],
        [
          rehypeAddClasses,
          {
            "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]": "group",
            pre: "grid",
          }
        ],
      ]}
    >
      {children}
    </OriginalRehype>
  );
}
