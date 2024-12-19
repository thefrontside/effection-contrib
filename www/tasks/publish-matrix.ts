import { call, each, main } from "effection";
import { readPackages } from "../hooks/read-packages.ts";
import { DenoJson } from "../hooks/use-package.tsx";
import { x } from "../../tinyexec/mod.ts";

await main(function* () {
  let packages = yield* readPackages({ excludePrivate: true });

  let include: Record<string, unknown>[] = [];

  for (let pkgmeta of packages) {
    let mod = yield* call(() =>
      import(`${pkgmeta.workspacePath}/deno.json`, { with: { type: "json" } })
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

  let exists = include.length > 0;

  if (!exists) {
    include.push({ workspace: "nothing" });
  }

  let outputValue = [
    `exists=${exists}`,
    `matrix=${JSON.stringify({ include })}`,
  ].join("\n");

  console.log(outputValue);

  if (Deno.env.has("GITHUB_OUTPUT")) {
    const githubOutput = Deno.env.get("GITHUB_OUTPUT") as string;
    yield* call(() =>
      Deno.writeTextFile(githubOutput, outputValue, {
        append: true,
      })
    );
  }
});
