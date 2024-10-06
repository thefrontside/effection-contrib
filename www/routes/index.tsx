import type { SitemapRoute } from "effection-www/plugins/sitemap.ts";
import type { JSXElement } from "revolution";
import { usePackages } from "../hooks/use-packages.ts";
import { useAppHtml } from "./app.html.tsx";
import { Package } from "../hooks/use-package.tsx";

export function indexRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap() {
      return [{
        pathname: "/",
      }];
    },
    *handler() {
      const AppHTML = yield* useAppHtml({
        title: "Contribs | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
        pageTitle: "Contribs | Effection",
      });

      let packages: Package[] = [];
      try {
        packages = yield* usePackages();
      } catch (e) {
        console.log("Could not read packages", e);
      }

      return (
        <AppHTML>
          <article class="prose">
            <h1>Effection Contribs</h1>
            <p>
              Here are a list of community contributed modules that represent
              emerging consensus on how to do common JavaScript tasks with
              Effection.
            </p>
            <ul class="list-none px-0">
              {packages.map((pkg) => (
                <li class="px-0">
                  <h3>
                    <a href={pkg.workspace}>{pkg.workspace}</a>
                  </h3>
                  <p>
                    <pkg.MDXDescription />
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </AppHTML>
      );
    },
  };
}
