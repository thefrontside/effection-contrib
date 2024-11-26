import { call, each, main } from "effection";
import { usePackages } from "../hooks/use-packages.ts";
import { DenoJson } from "../hooks/use-package.tsx";
import { x } from "../../tinyexec/mod.ts";

await main(function* () {
  let packages = yield* usePackages();

  let include: Record<string, unknown>[] = [];

  for (let pkgmeta of packages) {
    let mod = yield* call(() =>
      import(`${pkgmeta.path}/deno.json`, { with: { type: "json" } })
    );
    let pkg = DenoJson.parse(mod.default);

    let tagname = `${pkg.name.split("/")[1]}-v${pkg.version}`;

    let git = yield* x(`git`, [`tag`, `--list`, tagname]);

    let output = [];

    for (let line of yield* each(git.lines)) {
      output.push(line);
      yield* each.next();
    }

    // if output of `git tag --list ${{tagname}}` is empty, tag does not exists
    // ergo we publish
    if (output.join("").trim() === "") {
      include.push({
        workspace: pkgmeta.workspace,
        tagname,
        name: pkg.name,
        version: pkg.version,
      });
    }
  }

  let outputValue = `matrix=${JSON.stringify({ include })}`;

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
