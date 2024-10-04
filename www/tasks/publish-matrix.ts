import { main } from "effection";
import { usePackages } from "../hooks/use-packages.ts";

await main(function*() {

  const packages = yield* usePackages();
  
  const includeStatement = { include: packages.map(pkg => ({ workspace: pkg.workspace })) };

  console.log(`::set-output name=matrix::${JSON.stringify(includeStatement)}`);
});