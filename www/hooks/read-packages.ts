import { call, type Operation } from "effection";
import { PackageConfig, readPackageConfig } from "./use-package.tsx";

export function* readPackages(
  { excludePrivate }: { excludePrivate: boolean },
): Operation<PackageConfig[]> {
  const root = yield* call(async () => {
    try {
      const denoJson = await import("../../deno.json", {
        with: { type: "json" },
      });
      return denoJson;
    } catch (e) {
      console.error(e);
    }
  });

  console.log(`Found ${JSON.stringify(root?.default.workspace)}`);

  const configs: PackageConfig[] = [];
  for (let workspace of root?.default?.workspace ?? []) {
    const config = yield* readPackageConfig(workspace);
    if (excludePrivate) {
      if (!config.private) {
        configs.push(config);
      }
    } else {
      configs.push(config);
    }
  }

  return configs;
}
