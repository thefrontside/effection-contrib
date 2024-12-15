import { call, createContext, type Operation } from "effection";
import { z } from "npm:zod@3.23.8";

interface GetPackageDetailsParams {
  scope: string;
  package: string;
}

const PackageScore = z.object({
  hasReadme: z.boolean(),
  hasReadmeExamples: z.boolean(),
  allEntrypointsDocs: z.boolean(),
  percentageDocumentedSymbols: z.number().min(0).max(1),
  allFastCheck: z.boolean(),
  hasProvenance: z.boolean(),
  hasDescription: z.boolean(),
  atLeastOneRuntimeCompatible: z.boolean(),
  multipleRuntimesCompatible: z.boolean(),
  total: z.number().min(0).max(1),
});

const PackageDetails = z.object({
  scope: z.string(),
  name: z.string(),
  description: z.string(),
  runtimeCompat: z.object({
    browser: z.boolean(),
    deno: z.boolean(),
    node: z.boolean(),
    workerd: z.boolean(),
    bun: z.boolean(),
  }),
  createdAt: z.string().datetime({ precision: 3 }),
  updatedAt: z.string().datetime({ precision: 3 }),
  githubRepository: z.object({
    owner: z.string(),
    name: z.string(),
  }),
  score: z.number().min(0).max(1),
});

export type PackageScoreType = z.infer<typeof PackageScore>;
export type PackageDetailsType = z.infer<typeof PackageDetails>;

export interface JSRClient {
  getPackageScore: (
    params: GetPackageDetailsParams,
  ) => Operation<PackageScoreType>;
  getPackageDetails: (
    params: GetPackageDetailsParams,
  ) => Operation<PackageDetailsType>;
}

const JSRClientContext = createContext<JSRClient>("jsr-client");

export function* initJSRClient({ token }: { token: string }) {
  let client: JSRClient | undefined;
  if (token === "example") {
    console.info(
      `JSR Client Context is using the example token; will return example data`,
    );
    client = createExampleJSRClient();
  } else {
    client = createJSRClient(token);
  }

  return yield* JSRClientContext.set(client);
}

export function* useJSRClient(): Operation<JSRClient> {
  return yield* JSRClientContext;
}

function createJSRClient(token: string): JSRClient {
  return {
    *getPackageScore(params) {
      const response = yield* call(() =>
        fetch(
          `https://api.jsr.io/scopes/${params.scope}/packages/${params.package}/score`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      );

      if (response.ok) {
        return PackageScore.parse(yield* call(() => response.json()));
      }

      throw new Error(`${response.status}: ${response.statusText}`);
    },
    *getPackageDetails(params) {
      const response = yield* call(() =>
        fetch(
          `https://api.jsr.io/scopes/${params.scope}/packages/${params.package}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      );

      if (response.ok) {
        return PackageDetails.parse(yield* call(() => response.json()));
      }

      throw new Error(`${response.status}: ${response.statusText}`);
    },
  };
}

function createExampleJSRClient(): JSRClient {
  return {
    *getPackageScore() {
      return {
        hasReadme: true,
        hasReadmeExamples: true,
        allEntrypointsDocs: true,
        percentageDocumentedSymbols: 1,
        allFastCheck: true,
        hasProvenance: true,
        hasDescription: true,
        atLeastOneRuntimeCompatible: true,
        multipleRuntimesCompatible: true,
        total: 1,
      };
    },
    *getPackageDetails() {
      return {
        scope: "effection-contrib",
        name: "websocket",
        description: "Use the WebSocket API as an Effection resource.",
        runtimeCompat: {
          browser: true,
          deno: true,
          node: true,
          workerd: true,
          bun: true,
        },
        createdAt: "2024-12-15T02:18:26.624Z",
        updatedAt: "2024-12-15T02:18:26.624Z",
        githubRepository: {
          owner: "thefrontside",
          name: "effection-contribs",
        },
        score: 1,
      };
    },
  };
}
