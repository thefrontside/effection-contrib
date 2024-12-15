import { Package, usePackage } from "../hooks/use-package.tsx";
import {
  PackageDetailsResult,
  type PackageScoreResult,
} from "../hooks/use-jsr-client.ts";
import { Check, Cross } from "./package/icons.tsx";

export function ScoreCard() {
  return function* () {
    const pkg = yield* usePackage();
    const [details, score] = yield* pkg.jsrPackageDetails();

    return (
      <div class="flex flex-col items-center space-y-5 w-full border-2 border-cyan-100 rounded-lg p-8">
        {details.success && details.data ? (
          <>
            <a class="flex text-lg space-x-2 font-semibold" href={`${pkg.jsr}`}>
              <span>Available on</span>
              <img
                src="/assets/images/jsr-logo.svg"
                alt="JSR Logo"
                class="mr-2"
              />
            </a>
            <div class="flex flex-col md:flex-row gap-2 md:gap-8 items-between">
              <div class="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-1.5 text-sm font-bold">
                <div aria-hidden="true">Works with</div>
                <div class="min-w-content font-semibold select-none">
                  <div class="flex items-center *:mx-0.5 flex-row-reverse"></div>
                </div>
              </div>
              <a class="flex flex-row md:flex-col items-baseline md:items-end gap-2 md:gap-1.5 text-sm font-bold"
              href={`${new URL('./score/', pkg.jsr)}`}
              >
                <div>JSR Score</div>
                <div
                  class={`!leading-none md:text-xl ${getScoreTextColorClass(details.data.score)}`}
                >
                  {details.data.score}%
                </div>
              </a>
            </div>
            {score.success && score.data ? (
              <ScoreDescription score={score.data} pkg={pkg} />
            ) : (
              <></>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    );
  };
}

function ScoreDescription({
  score,
  pkg,
}: {
  score: PackageScoreResult;
  pkg: Package;
}) {
  const {
    percentageDocumentedSymbols: _percentageDocumentedSymbols,
    total: _total,
    ...flags
  } = score;

  const SCORE_MAP = {
    hasReadme: "Has a readme or module doc",
    hasReadmeExamples: "Has examples in the readme or module doc",
    allEntrypointsDocs: "Has module docs in all entrypoints",
    allFastCheck: (
      <>
        No{" "}
        <a class="underline" href="https://jsr.io/docs/about-slow-types">
          slow types
        </a>{" "}
        are used
      </>
    ),
    hasProvenance: "Has provenance",
    hasDescription: (
      <>
        Has a{" "}
        <a
          class="underline"
          href={`${new URL("./settings#description", pkg.jsr)}`}
        >
          description
        </a>
      </>
    ),
    atLeastOneRuntimeCompatible: "At least one runtime is marked as compatible",
    multipleRuntimesCompatible:
      "At least two runtimes are marked as compatible",
  };

  return (
    <details>
      <summary class="text-gray-500 text-sm">
        The JSR score is a measure of the overall quality of a package, expand
        for more detail.
      </summary>
      <ul class="flex flex-col divide-y-1 w-full pt-5 px-2">
        <>
          {Object.entries(flags).map(([key, value]) => (
            <li class="grid grid-cols-[auto_1fr_auto] gap-x-3 py-3 first:pt-0 items-start">
              {value ? <Check /> : <Cross />}
              <span>{SCORE_MAP[key as keyof typeof flags]}</span>
            </li>
          ))}
        </>
      </ul>
    </details>
  );
}

/** @src https://github.com/jsr-io/jsr/blob/34603e996f56eb38e811619f8aebc6e5c4ad9fa7/frontend/utils/score_ring_color.ts */
export function getScoreTextColorClass(score: number): string {
  if (score >= 90) {
    return "text-green-600";
  } else if (score >= 60) {
    return "text-yellow-700";
  }
  return "text-red-500";
}
