import { call, type Operation } from "effection";
import type { JSXElement } from "revolution";
import type { Package, RenderableDocNode } from "../hooks/use-package.tsx";
import type {
  InterfaceDef,
  ParamDef,
  TsTypeDef,
  TsTypeRefDef,
  VariableDef,
} from "https://deno.land/x/deno_doc@0.125.0/types.d.ts";
import {
  Builtin,
  ClassName,
  Keyword,
  Operator,
  Optional,
  Punctuation,
} from "./tokens.tsx";
import { useMDX } from "../hooks/use-mdx.tsx";

interface DescriptionProps {
  pkg: Package;
}

export function* API({ pkg }: DescriptionProps): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  for (const exportName of Object.keys(pkg.docs)) {
    const nodes = pkg.docs[exportName];
    for (const node of nodes) {
      const { MDXDoc = () => <></> } = node;

      elements.push(
        (
          <div class="my-5" id={node.id}>
            {yield* Type({ node })}
            <MDXDoc />
          </div>
        ),
      );
    }
  }
  return <>{elements}</>;
}

interface TypeProps {
  node: RenderableDocNode;
}

function* Type({ node }: TypeProps): Operation<JSXElement> {
  switch (node.kind) {
    case "function":
      return (
        <h3>
          <span class="language-ts code-highlight">
            <Keyword>{node.kind}</Keyword>{" "}
            <span class="token function">{node.name}</span>
            <Punctuation>(</Punctuation>
            <>
              {node.functionDef.params.map((param) => (
                <TSParam
                  param={param}
                />
              ))}
            </>
            <Punctuation>)</Punctuation>: {node.functionDef.returnType
              ? <TypeDef typeDef={node.functionDef.returnType} />
              : <></>}
          </span>
        </h3>
      );
    case "interface":
      return (
        <>
          <h3 class="inline">
            <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
          </h3>
          <Punctuation classes="text-lg">{" {"}</Punctuation>
          {yield* TSInterfaceDef({ interfaceDef: node.interfaceDef })}
          <Punctuation classes="text-lg">{"}"}</Punctuation>
        </>
      );
    case "variable":
      return (
        <h3>
          <TSVariableDef variableDef={node.variableDef} name={node.name} />
        </h3>
      );
    default:
      return (
        <h3>
          <Keyword>{node.kind}</Keyword> {node.name}
        </h3>
      );
  }
}

function TSVariableDef(
  { variableDef, name }: { variableDef: VariableDef; name: string },
) {
  return (
    <>
      <Keyword>{variableDef.kind}</Keyword> {name}
      <Operator>:</Operator>{" "}
      {variableDef.tsType ? <TypeDef typeDef={variableDef.tsType} /> : <></>}
    </>
  );
}

function* TSInterfaceDef(
  { interfaceDef }: { interfaceDef: InterfaceDef },
): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  for (const property of interfaceDef.properties) {
    elements.push(
      <li class="my-0 border-l-2 first:-mt-5">
        <div class="-mb-5">
          {yield* call(function* (): Operation<JSXElement> {
            if (property.jsDoc?.doc) {
              const mod = yield* useMDX(property.jsDoc?.doc);
              return mod.default();
            }
            return <></>;
          })}
        </div>
        {property.name}
        <Optional optional={property.optional} />
        <Operator>{": "}</Operator>
        {property.tsType ? <TypeDef typeDef={property.tsType} /> : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }
  return (
    <ul class="my-0 list-none pl-1">
      {elements}
    </ul>
  );
}

function TSParam({ param }: {
  param: ParamDef;
}) {
  if (param.kind === "identifier") {
    switch (param.tsType?.kind) {
      case "keyword":
        return (
          <>
            {param.name}
            <Optional optional={param.optional} />
            <Operator>{": "}</Operator>
            <Builtin>{param.tsType?.repr}</Builtin>
          </>
        );
    }
  }
  return <></>;
}

function TypeDef({ typeDef }: {
  typeDef: TsTypeDef;
}) {
  switch (typeDef.kind) {
    case "keyword":
      if (["number", "string", "boolean", "bigint"].includes(typeDef.keyword)) {
        return <Builtin>{typeDef.keyword}</Builtin>;
      } else {
        return <Keyword>{typeDef.keyword}</Keyword>;
      }
    case "typeRef":
      return <TypeRef typeRef={typeDef.typeRef} />;
    case "union":
      return <TypeDefUnion union={typeDef.union} />;
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

function TypeDefUnion({ union }: { union: TsTypeDef[] }) {
  return (
    <>
      {union.flatMap((typeDef, index) => (
        <>
          <TypeDef typeDef={typeDef} />
          {(index + 1) < union.length ? <Operator>{" | "}</Operator> : <></>}
        </>
      ))}
    </>
  );
}

function TypeRef({ typeRef }: {
  typeRef: TsTypeRefDef;
}) {
  return (
    <>
      {typeRef.typeName}
      {typeRef.typeParams
        ? (
          <>
            <Operator>{"<"}</Operator>
            <>
              {typeRef.typeParams.map((tp) => <TypeDef typeDef={tp} />)}
            </>
            <Operator>{">"}</Operator>
          </>
        )
        : <></>}
    </>
  );
}
