import { main, suspend } from "effection";
import { config } from "effection-www/tailwind.config.ts";
import { createRevolution, route } from "revolution";
import { twindPlugin } from "effection-www/plugins/twind.ts";
import { etagPlugin } from "effection-www/plugins/etag.ts";
import { rebasePlugin } from "effection-www/plugins/rebase.ts";
import { indexRoute } from "./routes/index.tsx";
import { moduleRoute } from "./routes/module.tsx";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/:moduleName", moduleRoute()),
      ],
      plugins: [twindPlugin({ config }), etagPlugin(), rebasePlugin()],
    });

    let server = yield* revolution.start();
    console.log(`www -> http://${server.hostname}:${server.port}`);

    yield* suspend();
  });
}
