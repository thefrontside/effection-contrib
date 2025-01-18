import {
  on,
  type Operation,
  resource,
  type Stream,
} from "npm:effection@4.0.0-alpha.4";

export interface WorkerResource<TSend, TRecv> {
  errors: Stream<ErrorEvent, never>;
  messageerrors: Stream<MessageEvent, never>;
  messages: Stream<MessageEvent<TRecv>, never>;
  postMessage(message: TSend): Operation<void>;
}

/**
 * Use Web Workers are a simple means for web content to run scripts in background threads in your Effection program.
 * @param url
 * @returns
 */
export function useWorker<TSend, TRecv>(
  url: string,
  options?: WorkerOptions
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
