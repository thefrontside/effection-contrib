import {
  createQueue,
  each,
  on,
  type Operation,
  resource,
  spawn,
  type Stream,
} from "npm:effection@4.0.0-alpha.4";

export interface WorkerResource<TSend, TRecv> {
  errors: Stream<ErrorEvent, never>;
  messageerrors: Stream<MessageEvent, never>;
  messages: Stream<MessageEvent<TRecv>, never>;
  postMessage(message: TSend): Operation<void>;
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
export function useWorker<TSend, TRecv>(
  url: string | URL,
  options?: WorkerOptions,
): Operation<WorkerResource<TSend, TRecv>> {
  return resource(function* (provide) {
    let worker = new Worker(url, options);
    try {
      yield* provide({
        errors: on(worker, "error"),
        messageerrors: on(worker, "messageerror"),
        messages: on(worker, "message"),
        *postMessage(value) {
          worker.postMessage(value);
        },
      });
    } finally {
      worker.terminate();
    }
  });
}

/**
 * Use inside of the worker thread to receive messages from the main thread.
 *
 * ```ts
 * import { run, each, suspend } from "effection";
 *
 * type IncomingMessages = { type: "close" } | { type: "value", value: unknown };
 *
 * const incoming = messages<IncomingMessages>();
 *
 * await run(function*() {
 *    yield* spawn(function*() {
 *      for (const message of yield* each(incoming)) {
 *        if (message.type === "close") {
 *          throw new Error("closed");
 *        }
 *        console.log(message.value);
 *        yield* each.next();
 *      }
 *    });
 *
 *    yield* suspend();
 * });
 * ```
 *
 * @typeparam {T} messages sent to worker
 * @returns {Stream<T, never>}
 */
export function messages<T>(): Stream<T, never> {
  return resource(function* (provide) {
    let queue = createQueue<T, never>();

    yield* spawn(function* () {
      for (let event of yield* each(on(self, "message"))) {
        queue.add(event.data);
        yield* each.next();
      }
    });

    yield* provide(queue);
  });
}
