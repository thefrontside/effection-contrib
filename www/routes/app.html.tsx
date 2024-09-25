import type { Operation } from "effection";
import type { JSXChild } from "revolution";

import { useAbsoluteUrl } from "effection-www/plugins/rebase.ts";

export interface Options {
  title: string;
  description: string;
  pageTitle: string;
}

export interface AppHtmlProps {
  children: JSXChild;
}

export function* useAppHtml({
  title,
  description,
  pageTitle,
}: Options): Operation<({ children }: AppHtmlProps) => JSX.Element> {
  let homeURL = yield* useAbsoluteUrl("/");

  return ({ children }) => (
    <html lang="en-US" dir="ltr">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
        <meta property="og:image" content="/assets/images/meta-effection.png" />
        <meta
          property="og:title"
          content={pageTitle}
          data-rh="true"
        />
        <meta property="og:url" content={homeURL} />
        <meta property="og:description" content={description} />
        <meta
          name="description"
          content={description}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={homeURL} />
        <link rel="alternate" href={homeURL} hreflang="en" />
        <link rel="alternate" href={homeURL} hreflang="x-default" />
        <link
          href="/assets/prism-atom-one-dark.css"
          rel="preload"
          as="style"
          // @ts-expect-error
          onload="this.rel='stylesheet'"
        />
        <link
          href="https://use.typekit.net/ugs0ewy.css"
          rel="preload"
          as="style"
          // @ts-expect-error
          onload="this.rel='stylesheet'"
        />
        <noscript>
          <link rel="stylesheet" href="https://use.typekit.net/ugs0ewy.css" />
          <link rel="stylesheet" href="/assets/prism-atom-one-dark.css" />
        </noscript>
      </head>
      <body class="flex flex-col">
        <main class="container max-w-screen-2xl mx-auto mb-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
