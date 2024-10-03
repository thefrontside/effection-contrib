import { join } from "jsr:@std/path@1.0.6";
import type { JSXElement } from "revolution/jsx-runtime";

import type { Package, RenderableDocNode } from "../hooks/use-package.tsx";

export function Exports({ pkg }: { pkg: Package }): JSXElement {
  return (
    <>
      {Object.keys(pkg.docs).map((exportName) => (
        <PackageExport
          packageName={pkg.packageName}
          exportName={exportName}
          doc={pkg.docs[exportName]}
        />
      ))}
    </>
  );
}

interface PackageExportOptions {
  packageName: string;
  exportName: string;
  doc: Array<RenderableDocNode>;
}

function PackageExport({ packageName, exportName, doc }: PackageExportOptions) {
  const exports = doc.flatMap((doc) => {
    if (doc.declarationKind === "export") {
      return [
        <a
          class="underline text-slate-300 decoration-dotted hover:decoration-solid	"
          href={`#${doc.id}`}
        >
          {doc.name}
        </a>,
        ", ",
      ];
    } else {
      return [];
    }
  }).slice(0, -1);

  return (
    <pre class="language-ts">
      <code class="language-ts code-highlight">
        <span class="token keyword">import</span> <span class="token punctuation">&#123;{" "}</span><>{exports}</>{" "}<span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"{join(packageName, exportName)}"</span>
      </code>
    </pre>
  );
}
