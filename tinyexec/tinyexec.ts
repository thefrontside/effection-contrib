import {
  call,
  type Operation,
  resource,
  type Stream,
  stream,
  useAbortSignal,
} from "effection";
import { type KillSignal, type Options, type Output, x as $x } from "tinyexec";

export interface TinyProcess extends Operation<Output> {
  lines: Stream<string, void>;

  kill(signal?: KillSignal): Operation<void>;
}

export function x(
  cmd: string,
  args: string[] = [],
  options?: Partial<Options>,
): Operation<TinyProcess> {
  return resource(function* (provide) {
    let signal = yield* useAbortSignal();

    let tinyexec = $x(cmd, args, { ...options, signal });

    let promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

    let output = call(() => promise);

    let tinyproc: TinyProcess = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(tinyexec),
      *kill(signal) {
        tinyexec.kill(signal);
        yield* output;
      },
    };

    try {
      yield* provide(tinyproc);
    } finally {
      yield* tinyproc.kill();
    }
  });
}
