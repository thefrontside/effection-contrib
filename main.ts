import { main, suspend } from "effection";
import { createRevolution } from "revolution";
import { initDenoDeploy } from "./deno-deploy/mod.ts";

import { config } from "effection-www/tailwind.config.ts";
import { route, sitemapPlugin } from "effection-www/plugins/sitemap.ts";
import { twindPlugin } from "effection-www/plugins/twind.ts";
import { etagPlugin } from "effection-www/plugins/etag.ts";
import { rebasePlugin } from "effection-www/plugins/rebase.ts";

import { assetsRoute } from "./www/routes/assets-route.ts";
import { indexRoute } from "./www/routes/index.tsx";
import { packageRoute } from "./www/routes/package.tsx";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function* () {
    yield* initDenoDeploy();

    let revolution = createRevolution({
      app: [
        route("/", indexRoute()),
        route("/assets(.*)", assetsRoute("assets")),
        route("/:workspace", packageRoute()),
      ],
      plugins: [
        twindPlugin({ config }),
        etagPlugin(),
        rebasePlugin(),
        sitemapPlugin(),
      ],
    });

    let server = yield* revolution.start();
    console.log(`www -> http://${server.hostname}:${server.port}`);

    yield* suspend();
  });
}
