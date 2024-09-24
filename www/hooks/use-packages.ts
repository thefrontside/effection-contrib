import { call, type Operation } from "effection";
import { type Package, PrivatePackageError, usePackage } from "./use-package.ts";

export function* usePackages(): Operation<Package[]> {
  const root = yield* call(() =>
    import("../../deno.json", { with: { type: "json" } })
  );

  const workspaces: Package[] = [];
  for (let workspace of root.default.workspace) {
    try {
      const pkg = yield* usePackage(workspace);
      workspaces.push(pkg);
    } catch (e) {
      if (!(e instanceof PrivatePackageError)) {
        console.error(e)
      }
    }
  }

  return workspaces;
}
