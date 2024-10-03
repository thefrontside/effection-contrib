import type { JSXElement } from "revolution";
import type { Package } from "../hooks/use-package.tsx";
import type {
  ParamDef,
  TsTypeDef,
  TsTypeRefDef,
  TsTypeTypeRefDef,
} from "https://deno.land/x/deno_doc@0.125.0/types.d.ts";

interface DescriptionProps {
  pkg: Package;
}

export function API({ pkg }: DescriptionProps): JSXElement {
  return (
    <>
      {Object.keys(pkg.docs).flatMap((exportName) => {
        const nodes = pkg.docs[exportName];
        return nodes.map((node) => {
          const { MDXDoc = () => <></> } = node;

          let title = <></>;
          switch (node.kind) {
            case "function":
              title = (
                <span class="language-ts code-highlight">
                  <span class="token keyword">function</span>{" "}
                  <span class="token function">{node.name}</span>
                  <span class="token punctuation">(</span>
                  <>
                    {node.functionDef.params.map((param) => (
                      <TSParam param={param} />
                    ))}
                  </>
                  <span class="token punctuation">)</span>:{" "}
                  {node.functionDef.returnType
                    ? <TypeDef typeDef={node.functionDef.returnType} />
                    : <></>}
                </span>
              );
              break;
            case "interface":
              title = (
                <>
                  <span class="token keyword">{node.kind}</span>{" "}
                  <span class="token class-name">{node.name}</span>
                </>
              );
              break;
            default:
              title = (
                <>
                  <span class="token keyword">{node.kind}</span> {node.name}
                </>
              );
          }

          return (
            <div class="my-5">
              <h3 class="text-lg" id={node.id}>
                {title}
              </h3>
              <MDXDoc />
            </div>
          );
        });
      })}
    </>
  );
}

interface TSParamProps {
  param: ParamDef;
}

function TSParam({ param }: TSParamProps) {
  if (param.kind === "identifier") {
    switch (param.tsType?.kind) {
      case "keyword":
        return (
          <>
            {param.name}
            {param.optional ? <span class="token operator">?</span> : ""}
            <span class="token operator">{": "}</span>
            <span class="token builtin">{param.tsType?.repr}</span>
          </>
        );
    }
  }
  return <></>;
}

interface TypeDefProps {
  typeDef: TsTypeDef;
}

function TypeDef({ typeDef }: TypeDefProps) {
  switch (typeDef.kind) {
    case "typeRef":
      return <TypeRef typeRef={typeDef.typeRef} />;
    case "array":
      return (
        <>
          <TypeDef typeDef={typeDef.array} />
          []
        </>
      );
  }
  return <></>;
}

interface TSTypeRefProps {
  typeRef: TsTypeRefDef;
}

function TypeRef({ typeRef }: TSTypeRefProps) {
  return (
    <>
      {typeRef.typeName}
      {typeRef.typeParams
        ? (
          <>
            <span class="token operator">{"<"}</span>
            <>
              {typeRef.typeParams.map((tp) => <TypeDef typeDef={tp} />)}
            </>
            <span class="token operator">{">"}</span>
          </>
        )
        : <></>}
    </>
  );
}
