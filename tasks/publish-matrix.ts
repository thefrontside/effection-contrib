import { call, each, main, type Operation } from "effection";
import { x } from "../tinyexec/mod.ts";
import { z } from "npm:zod@3.23.8";
import { resolve } from "jsr:@std/path@^1.0.6";

export const DenoJson = z.object({
  name: z.string(),
  version: z.string(),
  exports: z.union([z.record(z.string()), z.string()]),
  license: z.string(),
});

type PackageConfig = {
  workspace: string;
  workspacePath: string;
} & z.infer<typeof DenoJson>;

await main(function* () {
  let packages = yield* readPackages();

  let include: Record<string, unknown>[] = [];

  for (let pkg of packages) {
    let tagname = `${pkg.name.split("/")[1]}-v${pkg.version}`;

    let git = yield* x(`git`, [`tag`, `--list`, tagname]);

    let { stdout } = yield* git;

    // if output of `git tag --list ${{tagname}}` is empty, tag does not exists
    // ergo we publish
    if (stdout.trim() === "") {
      include.push({
        workspace: pkg.workspace,
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

function* readPackages(): Operation<PackageConfig[]> {
  const root = yield* call(() =>
    import("../deno.json", {
      with: { type: "json" },
    })
  );

  console.log(`Found ${root.default.workspace.join(", ")}`);

  const configs: PackageConfig[] = [];
  for (let workspace of root.default.workspace) {
    const workspacePath = resolve(Deno.cwd(), workspace);

    const config = yield* call(() =>
      Deno.readTextFile(`${workspacePath}/deno.json`)
    );

    const denoJson = DenoJson.parse(JSON.parse(config));

    configs.push({
      ...denoJson,
      workspace: workspace.replace("./", ""),
      workspacePath,
    });
  }

  return configs;
}
