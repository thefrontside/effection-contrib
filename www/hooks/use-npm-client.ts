import { createContext } from "effection";
import { Client } from "jsr:@yorganci/npm-registry-api@0.3.0";
import { call } from "effection";

const NPMClientContext = createContext("npm-client", new Client());

export function* isVersionPublished(name: string, versionOrTag = "latest") {
  const client = yield* NPMClientContext;

  try {
    yield* call(() => client.getPackageManifest(name, versionOrTag));
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}