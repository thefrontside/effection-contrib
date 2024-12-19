import { IconExternal } from "effection-www/components/icons/external.tsx";
import { IconGithub } from "effection-www/components/icons/github.tsx";

import { REPOSITORY_NAME } from "../../config.ts";
import { usePackage } from "../../hooks/use-package.tsx";

export function PackageSourceLink() {
  return function* () {
    const pkg = yield* usePackage();

    return (
      <a
        href={pkg.source.toString()}
        class="[&>*]:inline-block rounded-full bg-gray-200 px-2 py-1"
      >
        <IconGithub />
        <span class="px-1">{REPOSITORY_NAME}</span>
        <IconExternal />
      </a>
    );
  };
}
