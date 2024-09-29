import type { JSXElement } from "revolution";
import type { Package } from "../hooks/use-package.tsx";

interface DescriptionProps {
  pkg: Package
}

export function API({ pkg }: DescriptionProps): JSXElement {
    return (
      <>
        {Object.keys(pkg.docs).flatMap((exportName) => {
          const nodes = pkg.docs[exportName];
          return nodes.map(node => {
            const { MDXDoc = () => <></> } = node 
            return (
              <>
                <h3 id={node.id}>{node.name}</h3>
                <MDXDoc />
              </>
            )
          })
        })}
      </>
    );
}