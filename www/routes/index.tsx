import type { JSXHandler } from "revolution";
import { useAppHtml } from "./app.html.tsx";
import { usePackages } from "../hooks/use-packages.ts";

export function indexRoute(): JSXHandler {
  return function* () {
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
                  <a href={pkg.dirname}>{pkg.dirname}</a>
                </h3>
                <p><pkg.MDXDescription /></p>
              </li>
            ))}
          </ul>
        </>
      </AppHTML>
    );
  };
}
