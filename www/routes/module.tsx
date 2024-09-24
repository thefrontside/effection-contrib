import { type JSXHandler, useParams } from "revolution";
import { usePackage } from "../hooks/use-package.ts";
import { useAppHtml } from "./app.html.tsx";
import { Package } from "../hooks/use-package.ts";

export function moduleRoute(): JSXHandler {
  return function* () {
    const params = yield* useParams<{ moduleName: string }>();

    let pkg: Package;
    try {
      pkg = yield* usePackage(params.moduleName);
    } catch (e) {
      const AppHTML = yield* useAppHtml({
        title: `${params.moduleName}`,
        description: `Not found`,
        pageTitle: `${params.moduleName} not found`,
      });
      return (
        <AppHTML>
          <p>
            {params.moduleName} not found
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
