import { type JSXElement, useParams } from "revolution";
import {
  initPackageContext,
  readPackageConfig,
} from "../hooks/use-package.tsx";
import { useAppHtml } from "./app.html.tsx";
import type { RoutePath, SitemapRoute } from "effection-www/plugins/sitemap.ts";
import { API } from "../components/api.tsx";
import { useMarkdown } from "../hooks/use-markdown.tsx";
import { PackageHeader } from "../components/package/header.tsx";
import { PackageExports } from "../components/package/exports.tsx";
import { readPackages } from "../hooks/read-packages.ts";
import { ScoreCard } from "../components/score-card.tsx";

export function packageRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap(pathname) {
      let paths: RoutePath[] = [];
      let configs = yield* readPackages({
        excludePrivate: true,
      });
      for (let pkg of configs) {
        paths.push({
          pathname: pathname({ workspace: pkg.workspace.replace(/^\.\//, "") }),
        });
      }
      return paths;
    },
    *handler() {
      const params = yield* useParams<{ workspace: string }>();

      try {
        let config = yield* readPackageConfig(params.workspace);
        let pkg = yield* initPackageContext(config);

        const AppHTML = yield* useAppHtml({
          title: `${pkg.packageName}`,
          description: yield* pkg.MDXDescription(),
          pageTitle: `${pkg.packageName} | Effection Contrib`,
        });

        return (
          <AppHTML>
            <>
              <div class="grid grid-cols-1 lg:grid-cols-10 gap-8 lg:gap-12">
                <article class="min-w-0 lg:col-span-7 lg:row-start-1">
                  {yield* PackageHeader()()}
                  <div class="prose">
                    <div class="mb-5">
                      {yield* PackageExports()()}
                    </div>
                    {yield* useMarkdown(pkg.readme)}
                    <h2 class="mb-0">API</h2>
                    {yield* API()()}
                  </div>
                </article>
                <aside class="lg:col-[span_3/_-1] lg:top-0 lg:sticky lg:max-h-screen flex flex-col box-border gap-y-4 -mt-4 pt-4">
                  {yield* ScoreCard()()}
                </aside>
              </div>
            </>
          </AppHTML>
        );
      } catch (e) {
        console.error(e);
        const AppHTML = yield* useAppHtml({
          title: `${params.workspace}`,
          description: `Failed to load ${params.workspace} due to error.`,
          pageTitle: `${params.workspace} not found`,
        });
        return (
          <AppHTML>
            <p>
              Failed to load {params.workspace} due to error.
            </p>
          </AppHTML>
        );
      }
    },
  };
}
