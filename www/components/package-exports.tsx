import type { JSXElement } from "revolution/jsx-runtime";
import type { Package } from "../hooks/use-package.tsx";
import type { DocNode } from "../hooks/use-deno-doc.tsx";
import { join } from "@std/path";

export function PackageExports({ pkg }: { pkg: Package }): JSXElement {
  if (isDocArray(pkg.docs)) {
    if (typeof pkg.exports === "string") {
      return (
        <PackageExport
          packageName={pkg.packageName}
          exportName={pkg.exports}
          doc={pkg.docs}
        />
      );
    }
  } else {
    const doc = pkg.docs;
    return (
      <>
        {Object.keys(pkg.docs).map((exportName) => (
          <PackageExport
            packageName={pkg.packageName}
            exportName={exportName}
            doc={doc[exportName]}
          />
        ))}
      </>
    );
  }
}

interface PackageExportOptions {
  packageName: string;
  exportName: string;
  doc: Array<DocNode>;
}

function PackageExport({ packageName, exportName, doc }: PackageExportOptions) {
  const exports = doc.flatMap((doc) => {
    if (doc.declarationKind === "export") {
      return [doc.name];
    } else {
      return [];
    }
  });
  return (
    <span>
      import &#123; {exports.join(", ")}{" "}
      &#125; from "{join(packageName, exportName)}"
    </span>
  );
}

function isDocArray(
  doc: Array<DocNode> | Record<string, Array<DocNode>>,
): doc is Array<DocNode> {
  return Array.isArray(doc);
}
