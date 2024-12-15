import { Exports } from "../../components/exports.tsx";
import { IconGithub } from "effection-www/components/icons/github.tsx";
import { REPOSITORY_NAME } from "../../config.ts";
import { IconExternal } from "effection-www/components/icons/external.tsx";

import { usePackage } from "../../hooks/use-package.tsx";

export function PackageHeader() {
  return function* () {
    const pkg = yield* usePackage();

    return (
      <header class="space-y-3 mb-5">
        <div class="[&>*]:inline-block">
          <span class="text-3xl font-bold align-middle">
            @{pkg.scope}
            <span>/</span>
            {pkg.name}
          </span>
          <span class="text-3xl mx-2 align-middle">v{pkg.version}</span>
          <a
            href={pkg.source.toString()}
            class="[&>*]:inline-block rounded-full bg-gray-200 px-2 py-1"
          >
            <IconGithub />
            <span class="px-1">{REPOSITORY_NAME}</span>
            <IconExternal />
          </a>
        </div>
        <div class="space-x-1">
          <a href={`${pkg.jsr}`} class="inline-block align-middle">
            <img src={`${pkg.jsrBadge}`} alt="JSR Badge" />
          </a>
          <a href={`${pkg.npm}`} class="inline-block align-middle">
            <img
              src={`${pkg.npmVersionBadge}`}
              alt="NPM Badge with published version"
            />
          </a>
          <a
            href={`${pkg.bundlephobia}`}
            class="inline-block align-middle"
          >
            <img src={`${pkg.bundleSizeBadge}`} alt="Bundle size badge" />
          </a>
          <img
            src={`${pkg.dependencyCountBadge}`}
            class="inline-block"
            alt="Dependency count badge"
          />
          <img
            src={`${pkg.treeShakingSupportBadge}`}
            class="inline-block"
            alt="Tree shaking support badge"
          />
        </div>
        <div class="py-3">
          <Exports pkg={pkg} />
        </div>
      </header>
    );
  };
}
