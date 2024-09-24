export {
  Rehype as OriginalRehype,
  type RehypeOptions,
} from "effection-www/components/rehype.tsx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeAddClasses from "rehype-add-classes";
import rehypeInferDescriptionMeta from "rehype-infer-description-meta";

interface RehypeProps {
  children: () => JSX.Element;
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
          },
        ],
      ]}
    >
      {children}
    </OriginalRehype>
  );
}
