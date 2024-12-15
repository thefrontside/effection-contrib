import { type JSXElement, useParams } from "revolution";
import { usePackage } from "../hooks/use-package.tsx";
import { useAppHtml } from "./app.html.tsx";
import type { Package } from "../hooks/use-package.tsx";
import type { RoutePath, SitemapRoute } from "effection-www/plugins/sitemap.ts";
import { usePackages } from "../hooks/use-packages.ts";
import { Exports } from "../components/exports.tsx";
import { API } from "../components/api.tsx";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { IconGithub } from "effection-www/components/icons/github.tsx";
import { REPOSITORY_NAME } from "../config.ts";
import { IconExternal } from "effection-www/components/icons/external.tsx";
import { jsx } from "revolution/jsx-runtime";

export function packageRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let paths: RoutePath[] = [];
      let packages = yield* usePackages();
      for (let pkg of packages) {
        paths.push({
          pathname: pathname({ workspace: pkg.workspace }),
        });
      }
      return paths;
    },
    *handler() {
      const params = yield* useParams<{ workspace: string }>();

      let pkg: Package | undefined;
      try {
        pkg = yield* usePackage(params.workspace);
      } catch (e) {
        console.error(e);
      }

      if (!pkg) {
        const AppHTML = yield* useAppHtml({
          title: `${params.workspace}`,
          description: `Not found`,
          pageTitle: `${params.workspace} not found`,
        });
        return (
          <AppHTML>
            <p>
              {params.workspace} not found
            </p>
          </AppHTML>
        );
      }

      const AppHTML = yield* useAppHtml({
        title: `${pkg.packageName}`,
        description: `${pkg.MDXDescription()}`,
        pageTitle: `${pkg.packageName} | Effection Contribs`,
      });

      const score = yield* pkg.jsrScore();

      return (
        <AppHTML>
          <>
            <header class="space-y-3 mb-5">
              <div class="[&>*]:inline-block">
                <span class="text-3xl font-bold align-middle">
                  @{pkg.scope}
                  <span>/</span>
                  {pkg.name}
                </span>
                <span class="text-3xl mx-2 align-middle">v{pkg.version}</span>
                <a
                  href={pkg.source.toString()}
                  class="[&>*]:inline-block rounded-full bg-gray-200 px-2 py-1"
                >
                  <IconGithub />
                  <span class="px-1">{REPOSITORY_NAME}</span>
                  <IconExternal />
                </a>
              </div>
              <div class="space-x-1">
                <a href={`${pkg.jsr}`} class="inline-block align-middle">
                  <img src={`${pkg.jsrBadge}`} alt="JSR Badge" />
                </a>
                <a href={`${pkg.npm}`} class="inline-block align-middle">
                  <img
                    src={`${pkg.npmVersionBadge}`}
                    alt="NPM Badge with published version"
                  />
                </a>
                <a
                  href={`${pkg.bundlephobia}`}
                  class="inline-block align-middle"
                >
                  <img src={`${pkg.bundleSizeBadge}`} alt="Bundle size badge" />
                </a>
                <img
                  src={`${pkg.dependencyCountBadge}`}
                  class="inline-block"
                  alt="Dependency count badge"
                />
                <img
                  src={`${pkg.treeShakingSupportBadge}`}
                  class="inline-block"
                  alt="Tree shaking support badge"
                />
              </div>
              <div class="py-3">
                <Exports pkg={pkg} />
              </div>
            </header>
            <div class="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
              <article class="prose min-w-0 lg:col-span-7 lg:row-start-1">
                <>
                  {yield* useMarkdown(pkg.readme)}
                </>
                <h2 class="mb-0">API</h2>
                {yield* API({ pkg })}
              </article>
              <aside class="max-lg:row-start-1 lg:col-[span_3/_-1] lg:top-0 lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4 -mt-4 pt-4">
              </aside>
            </div>
          </>
        </AppHTML>
      );
    },
  };
}
