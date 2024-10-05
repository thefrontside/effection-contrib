import { call, type Operation } from "effection";
import { type Package, usePackage } from "./use-package.tsx";
import { PrivatePackageError } from "../errors.ts";

export function* usePackages(): Operation<Package[]> {
  const root = yield* call(async () => {
    try {
      const denoJson = await import("../../deno.json", { with: { type: "json" } })
      return denoJson;
    } catch (e) {
      console.error(e);
    }
  });

  const workspaces: Package[] = [];
  for (let workspace of root?.default?.workspace ?? []) {
    try {
      const pkg = yield* usePackage(workspace);
      workspaces.push(pkg);
    } catch (e) {
      if (!(e instanceof PrivatePackageError)) {
        console.error(e);
      }
    }
  }

  return workspaces;
}
