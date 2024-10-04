import { call, type Operation } from "effection";
import type { JSXElement } from "revolution";
import type { Package, RenderableDocNode } from "../hooks/use-package.tsx";
import type {
  InterfaceDef,
  ParamDef,
  TsTypeDef,
  TsTypeParamDef,
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
          <section id={node.id}>
            <header>
              {yield* Type({ node })}
            </header>
            <div class="pl-2 -mt-5">
              <MDXDoc />
            </div>
          </section>
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
        <h3 class="inline-block" style="text-wrap: nowrap;">
          <span class="language-ts code-highlight">
            <Keyword>{node.kind}</Keyword>{" "}
            <span class="token function">{node.name}</span>
            <Punctuation>(</Punctuation>
            <FunctionParams params={node.functionDef.params} />
            <Punctuation>)</Punctuation>: {node.functionDef.returnType
              ? <TypeDef typeDef={node.functionDef.returnType} />
              : <></>}
          </span>
        </h3>
      );
    case "interface":
      return (
        <>
          {/** TODO(taras): figure out why text-nowrap is missing **/}
          <h3 class="inline" style="text-wrap: nowrap;">
            <Keyword>{node.kind}</Keyword> <ClassName>{node.name}</ClassName>
            {node.interfaceDef.typeParams.length > 0
              ? (
                <InterfaceTypeParams
                  typeParams={node.interfaceDef.typeParams}
                />
              )
              : <></>}
            {node.interfaceDef.extends
              ? (
                <>
                  <Keyword>{" extends "}</Keyword>
                  <>
                    {node.interfaceDef.extends.flatMap(
                      (typeDef) => [<TypeDef typeDef={typeDef} />, ", "],
                    ).slice(0, -1)}
                  </>
                </>
              )
              : <></>}
          </h3>
          <Punctuation classes="text-lg" style="text-wrap: nowrap;">
            {" {"}
          </Punctuation>
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
    const jsDoc = yield* call(function* (): Operation<JSXElement | undefined> {
      if (property.jsDoc?.doc) {
        const mod = yield* useMDX(property.jsDoc?.doc);
        return mod.default();
      }
    });
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc
          ? (
            <div class="-mb-5">
              {jsDoc}
            </div>
          )
          : <></>}
        {property.name}
        <Optional optional={property.optional} />
        <Operator>{": "}</Operator>
        {property.tsType ? <TypeDef typeDef={property.tsType} /> : <></>}
        <Punctuation>{";"}</Punctuation>
      </li>,
    );
  }

  for (const method of interfaceDef.methods) {
    const jsDoc = yield* call(function* (): Operation<JSXElement | undefined> {
      if (method.jsDoc?.doc) {
        const mod = yield* useMDX(method.jsDoc?.doc);
        return mod.default();
      }
    });
    elements.push(
      <li class={`${jsDoc ? "my-0 border-l-2 first:-mt-5" : "my-1"}`}>
        {jsDoc
          ? (
            <div class="-mb-5">
              {jsDoc}
            </div>
          )
          : <></>}
        {method.name}
        <Optional optional={method.optional} />
        <Punctuation>(</Punctuation>
        <FunctionParams params={method.params} />
        <Punctuation>)</Punctuation>
        <Operator>{": "}</Operator>
        {method.returnType ? <TypeDef typeDef={method.returnType} /> : <></>}
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

function FunctionParams({ params }: { params: ParamDef[] }) {
  return (
    <>
      {params.flatMap((param) => [
        <TSParam
          param={param}
        />,
        ", ",
      ]).slice(0, -1)}
    </>
  );
}

function TSParam({ param }: {
  param: ParamDef;
}) {
  if (param.kind === "identifier") {
    return (
      <>
        {param.name}
        <Optional optional={param.optional} />
        <Operator>{": "}</Operator>
        {param.tsType ? <TypeDef typeDef={param.tsType} /> : <></>}
      </>
    );
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
    case "fnOrConstructor":
      if (typeDef.fnOrConstructor.constructor) {
        // TODO(taras): implement
        return <></>
      } else {
        return (
          <>
            <Punctuation>(</Punctuation>
              <FunctionParams params={typeDef.fnOrConstructor.params} />
            <Punctuation>)</Punctuation>
            <Operator>{" => "}</Operator>
            <TypeDef typeDef={typeDef.fnOrConstructor.tsType} />
          </>
        )
      }
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
              {typeRef.typeParams.flatMap((
                tp,
              ) => [<TypeDef typeDef={tp} />, ", "]).slice(0, -1)}
            </>
            <Operator>{">"}</Operator>
          </>
        )
        : <></>}
    </>
  );
}

function InterfaceTypeParams(
  { typeParams }: { typeParams: TsTypeParamDef[] },
): JSXElement {
  return (
    <>
      <Operator>{"<"}</Operator>
      <>
        {typeParams.flatMap((param) => {
          return [
            <>
              {param.name}
              {param.constraint
                ? <TypeDef typeDef={param.constraint} />
                : <></>}
            </>,
            <>,</>,
          ];
        }).slice(0, -1)}
      </>
      <Operator>{">"}</Operator>
    </>
  );
}
