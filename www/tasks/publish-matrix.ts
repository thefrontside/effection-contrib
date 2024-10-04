import { call, main } from "effection";
import { usePackages } from "../hooks/use-packages.ts";

await main(function* () {
  const packages = yield* usePackages();

  const includeStatement = {
    include: packages.map((pkg) => ({ workspace: pkg.workspace })),
  };

  const outputValue = `matrix=${JSON.stringify(includeStatement)}`;

  if (Deno.env.has("GITHUB_OUTPUT")) {
    const githubOutput = Deno.env.get("GITHUB_OUTPUT") as string;
    yield* call(() =>
      Deno.writeTextFile(githubOutput, outputValue, {
        append: true,
      })
    );
  } else {
    // for local dev
    console.log(outputValue);
  }
});
