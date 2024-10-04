import { join } from "jsr:@std/path@1.0.6";
import type { JSXElement } from "revolution/jsx-runtime";

import type { Package, RenderableDocNode } from "../hooks/use-package.tsx";
import { Keyword, Punctuation } from "./tokens.tsx";

export function Exports({ pkg }: { pkg: Package }): JSXElement {
  return (
    <>
      <h2>Exports</h2>{" "}
      <p class="text-slate-800">
        Click an export to jump to it's documentation.
      </p>
      <>
        {Object.keys(pkg.docs).map((exportName) => (
          <PackageExport
            packageName={pkg.packageName}
            exportName={exportName}
            doc={pkg.docs[exportName]}
          />
        ))}
      </>
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
          class="no-underline text-slate-300 hover:underline underline-offset-4"
          href={`#${doc.id}`}
        >
          {["enum", "typeAlias", "namespace", "interface"].includes(doc.kind)
            ? <Keyword>{"type "}</Keyword>
            : ""}
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
        <Keyword>import</Keyword>
        <Punctuation>{" { "}</Punctuation>
        <ul class="my-0 list-none pl-4">{chunk(exports).map(chunk => <li class="my-1 pl-0">{chunk}</li>)}</ul>
        <Punctuation>{"} "}</Punctuation>
        <Keyword>{"from "}</Keyword>
        <span class="token string">"{join(packageName, exportName)}"</span>
      </code>
    </pre>
  );
}

function chunk<T>(array: T[], chunkSize = 2): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
