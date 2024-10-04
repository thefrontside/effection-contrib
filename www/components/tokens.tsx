import type { JSXChild, JSXElement } from "revolution";

export function ClassName({ children }: { children: JSXChild }): JSXElement {
  return <span class="token class-name">{children}</span>;
}

export function Punctuation(
  { children, classes }: { children: JSXChild; classes?: string },
): JSXElement {
  return <span class={`token punctuation ${classes}`}>{children}</span>;
}

export function Operator({ children }: { children: JSXChild }): JSXElement {
  return <span class="token operator">{children}</span>;
}

export function Keyword({ children }: { children: JSXChild }): JSXElement {
  return <span class="token keyword">{children}</span>;
}

export function Builtin({ children }: { children: JSXChild }): JSXElement {
  return <span class="token builtin">{children}</span>;
}

export function Optional({ optional }: { optional: boolean }): JSXElement {
  if (optional) {
    return <Operator>?</Operator>;
  } else {
    return <></>;
  }
}