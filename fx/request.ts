import { call, type Operation, useAbortSignal } from "npm:effection@3.0.3";

export function* request(
  url: string | URL | Request,
  opts?: RequestInit,
): Operation<Response> {
  const signal = yield* useAbortSignal();
  const response = yield* call(() => fetch(url, { signal, ...opts }));
  return response;
}

// deno-lint-ignore no-explicit-any
export function* json(response: Response): Operation<any> {
  return yield* call(() => response.json());
}
