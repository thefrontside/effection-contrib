import { assert } from "https://deno.land/std@0.158.0/testing/asserts.ts";
import {
  createQueue,
  createSignal,
  each,
  main,
  on,
  once,
  type Operation,
  resource,
  scoped,
  spawn,
  type Stream,
} from "npm:effection@4.0.0-alpha.4";

export interface WorkerResource<TSend, TRecv, TReturn, TData = unknown>
  extends Operation<TReturn> {
  send(data: TSend): Operation<TRecv>;
}

export interface WorkerMessages<TSend, TRecv> {
  forEach(fn: (message: TSend) => Operation<TRecv>): Operation<void>;
}

export interface WorkerMainOptions<TSend, TRecv, TData> {
  messages: WorkerMessages<TSend, TRecv>;
  data: TData;
}

export type WorkerControl<TSend, TData> = {
  type: "init";
  data: TData;
} | {
  type: "send";
  value: TSend;
  response: MessagePort;
};

export async function workerMain<TSend, TRecv, TReturn, TData>(
  body: (options: WorkerMainOptions<TSend, TRecv, TData>) => Operation<TReturn>,
): Promise<void> {
  await main(function* () {
    try {
      yield* scoped(function* () {
        let sent = createSignal<{ value: TSend; response: MessagePort }>();
        let subscription = yield* on(self, "message");

        self.postMessage({ type: "open" });

        let next = yield* subscription.next();
        while (true) {
          let control: WorkerControl<TSend, TData> = next.value.data;
          if (control.type === "init") {
            yield* spawn(function* () {
              yield* body({
                data: control.data,
                messages: {
                  *forEach(fn: (value: TSend) => Operation<TRecv>) {
                    for (let { value, response } of yield* each(sent)) {
                      yield* scoped(function* () {
                        let result = yield* fn(value);
                        response.postMessage(result);
                      });
                      yield* each.next();
                    }
                  },
                },
              });
            });
          } else if (control.type === "send") {
            let { value, response } = control;
            sent.send({ value, response });
          }
          next = yield* subscription.next();
        }
      });
    } catch (error) {
      //todo propagate errors upwards.
    }
  });
}

/**
 * Use on the main thread to create a well behaved web worker.
 *
 * ```ts
 * import { run } from "effection";
 * import { useWorker } from "@effection-contrib/worker"
 *
 * await run(function*() {
 *    const worker = yield* useWorker("script.js", { type: "module" })
 * });
 * ```
 *
 * @param url {URL} or {string} of script
 * @param options {WorkerOptions}
 * @typeparam {TSend} messages that can be sent to worker
 * @typeparam {TRecv} messages that can be received from worker
 * @returns {Operation<WorkerResource<TSend, TRecv>>}
 */
export function useWorker<TSend, TRecv, TData>(
  url: string | URL,
  options?: WorkerOptions & { data?: TData },
): Operation<WorkerResource<TSend, TRecv, TData>> {
  return resource(function* (provide) {
    let worker = new Worker(url, options);

    let subscription = yield* on(worker, "message");

    let first = yield* subscription.next();

    assert(first.value.data.type === "open", `expected first message to arrive from worker to be of type "open", but was: ${first.value.data.type}`);
    
    try {
      worker.postMessage({ type: "init", data: options?.data });

      yield* provide({
        *send(value) {
          let channel = yield* useMessageChannel();
          worker.postMessage({
            type: "send",
            value,
            response: channel.port2,
          }, [channel.port2]);
	  channel.port1.start();
          let event = yield* once(channel.port1, "message");
          return event.data;
        },
        *[Symbol.iterator]() {
          throw new Error("not implemented yet");
        },
      });
    } finally {
      worker.terminate();
    }
  });
}

function useMessageChannel(): Operation<MessageChannel> {
  return resource(function*(provide) {
    let channel = new MessageChannel();
    try {
      yield* provide(channel)
    } finally {
      channel.port1.close();
      channel.port2.close();
    }
  })
}
