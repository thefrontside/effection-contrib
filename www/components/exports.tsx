import { join } from "jsr:@std/path@1.0.6";
import type { JSXElement } from "revolution/jsx-runtime";

import type { DocNode } from "../hooks/use-deno-doc.tsx";
import { DEFAULT_MODULE_KEY, RenderableDocNode, type Package } from "../hooks/use-package.tsx";

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
        <a href={`#${doc.id}`}>{doc.name}</a>, ", "];
    } else {
      return [];
    }
  }).slice(0, -1);

  return (
    <pre>
      import &#123;{" "}<>{exports}</>{" "}&#125; from "{join(packageName, exportName)}"
    </pre>
  );
}