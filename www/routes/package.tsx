import { type JSXHandler, useParams } from "revolution";
import { usePackage } from "../hooks/use-package.tsx";
import { useAppHtml } from "./app.html.tsx";
import type { Package } from "../hooks/use-package.tsx";

export function packageRoute(): JSXHandler {
  return function* () {
    const params = yield* useParams<{ packageName: string }>();

    let pkg: Package;
    try {
      pkg = yield* usePackage(params.packageName);
    } catch (e) {
      const AppHTML = yield* useAppHtml({
        title: `${params.packageName}`,
        description: `Not found`,
        pageTitle: `${params.packageName} not found`,
      });
      return (
        <AppHTML>
          <p>
            {params.packageName} not found
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
        <>
          <h1>{pkg.packageName}</h1>
          <p>{<pkg.MDXDescription />}</p>
        </>
      </AppHTML>
    );
  };
}
