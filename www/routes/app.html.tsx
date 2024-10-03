import type { Operation } from "effection";
import type { JSXChild } from "revolution";
import { useDenoDeploy } from "@effection-contrib/deno-deploy";

import { useAbsoluteUrl } from "effection-www/plugins/rebase.ts";
import { Header } from "effection-www/components/header.tsx";
import { Footer } from "effection-www/components/footer.tsx";
import { IconDiscord } from "effection-www/components/icons/discord.tsx";
import { IconGithub } from "effection-www/components/icons/github.tsx";
import { Navburger } from "effection-www/components/navburger.tsx";
import { ProjectSelect } from "effection-www/components/project-select.tsx";

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
  let { isDenoDeploy } = yield* useDenoDeploy();

  const navLinks: JSX.Element[] = [
    <a href="/docs/installation">Guides</a>,
    <a href="https://deno.land/x/effection/mod.ts">API</a>,
    <a
      class="flex flex-row"
      href={isDenoDeploy ? "/contribs" : "/"}
    >
      <span class="hidden md:inline-flex">
        Contribs
      </span>
    </a>,
  
    <a
      class="flex flex-row"
      href="https://github.com/thefrontside/effection"
    >
      <span class="pr-1 md:inline-flex">
        <IconGithub />
      </span>
      <span class="hidden md:inline-flex">
        Github
      </span>
    </a>,
    <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
      <span class="pr-1 md:inline-flex">
        <IconDiscord />
      </span>
      <span class="hidden md:inline-flex">Discord</span>
    </a>,
    <ProjectSelect classnames="sm:hidden shrink-0" />,
    <>
      <p class="flex flex-row invisible">
        <label class="cursor-pointer" for="nav-toggle">
          <Navburger />
        </label>
      </p>
      <style media="all">
        {`
  #nav-toggle:checked ~ aside#docbar {
  display: none;
  }
  `}
      </style>
    </>,
  ];

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
        <Header navLinks={navLinks} />
        <main class="container max-w-screen-2xl mx-auto mb-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
