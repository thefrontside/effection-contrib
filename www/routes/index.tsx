import type { JSXElement } from "revolution";
import { useAppHtml } from "./app.html.tsx";
import { usePackages } from "../hooks/use-packages.ts";
import type { SitemapRoute } from "effection-www/plugins/sitemap.ts";

export function indexRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap() {
      return [{
        pathname: '/'
      }]
    },
    *handler() {
      const AppHTML = yield* useAppHtml({
        title: "Contribs | Effection",
        description:
          "List of community contributed modules that represent emerging consensus on how to do common JavaScript tasks with Effection.",
        pageTitle: "Contribs | Effection",
      });
  
      const packages = yield* usePackages();
  
      return (
        <AppHTML>
          <>
            <h1>Contribs</h1>
            <ul>
              {packages.map((pkg) => (
                <li>
                  <h3>
                    <a href={pkg.workspace}>{pkg.workspace}</a>
                  </h3>
                  <p><pkg.MDXDescription /></p>
                </li>
              ))}
            </ul>
          </>
        </AppHTML>
      );
    }
  }
}
