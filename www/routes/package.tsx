import { type JSXElement, useParams } from "revolution";
import { usePackage } from "../hooks/use-package.tsx";
import { useAppHtml } from "./app.html.tsx";
import type { Package } from "../hooks/use-package.tsx";
import type { RoutePath, SitemapRoute } from "effection-www/plugins/sitemap.ts";
import { usePackages } from "../hooks/use-packages.ts";
import { Exports } from "../components/exports.tsx";
import { API } from "../components/api.tsx";
import { useMarkdown } from "../hooks/use-markdown.tsx";

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

      return (
        <AppHTML>
          <article class="prose">
            <header>
              <>
                {yield* useMarkdown(pkg.readme)}
              </>
            </header>
            <Exports pkg={pkg} />
            <h2 class="mb-0">API</h2>
            {yield* API({ pkg })}
          </article>
        </AppHTML>
      );
    },
  };
}
