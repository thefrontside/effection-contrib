import { createContext, type Operation } from "effection";

export interface DenoDeploy {
  /**
   * True when running in Deno Deploy
   */
  isDenoDeploy: boolean;
  /**
   * ID of the current Deno Deploy environment
   * @see https://docs.deno.com/deploy/manual/environment-variables/#deployment-environment-variables
   */
  deploymentId: string | undefined;
  /**
   * It holds the region code of the region in which the deployment is running. 
   * You can use this variable to serve region-specific content.
   * 
   * You can refer to the region code from the [regions page](https://docs.deno.com/deploy/manual/regions/).
   */
  region: string | undefined;
}

export const DenoDeployContext = createContext<DenoDeploy>("deno-deploy", {
  isDenoDeploy: false,
  deploymentId: undefined,
  region: undefined
});

/**
 * Use to read the values of Deno Deploy Context.
 * 
 * ```ts
 * import { useDenoDeploy } from "@effection-contrib/deno-deploy";
 * 
 * function* () {
 *  const { isDenoDeploy } = yield* useDenoDeploy();
 * }
 * ```
 */
export function* useDenoDeploy(): Operation<DenoDeploy> {
  return yield* DenoDeployContext;
}

/**
 * Use at the root of your application to setup Deno Deploy context.
 * 
 * ```ts
 * import { main } from "effection";
 * import { initDenoDeploy } from "@effection-contrib/deno-deploy";
 * 
 * await main(function*() {
 *  yield* initDenoDeploy();
 * });
 * ```
 */
export function* initDenoDeploy() {
  const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID");
  const region = Deno.env.get("DENO_REGION");
  const isDenoDeploy = deploymentId !== undefined;

  yield* DenoDeployContext.set({
    isDenoDeploy,
    deploymentId,
    region,
  });
}
