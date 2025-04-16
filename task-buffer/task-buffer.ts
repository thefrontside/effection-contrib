import {
  createChannel,
  Err,
  Ok,
  type Operation,
  type Resolve,
  resource,
  type Result,
  spawn,
  type Stream,
  type Task,
  useScope,
  withResolvers,
} from "npm:effection@4.0.0-alpha.4";

/**
 * Spawn operations, but only allow a certain number to be active at a
 * given time. Once the `TaskBuffer` becomes full, it will queue up spawn
 * operations until room becomes available
 */
export interface TaskBuffer extends Operation<void> {
  /**
   * Spawn `op` in the task buffer when there is room available. If
   *  there is room, then this operation will complete immediately.
   * Otherwise, it will return once there is room in the buffer and
   * the task is successfully spawned.
   * `spawn()` operation will not return until the task has actually
   * been spawned.
   *
   * @param op - the operation to spawn in the buffer.
   * @returns the spawned task.
   */
  enqueue<T>(op: () => Operation<T>): Operation<Operation<Task<T>>>;

  /**
   * Stop accepting new items and return once all in flight items have been
   * processed. the {TaskBuffer}'s
   */
  close(): Operation<void>;
}

/**
 * Configure how this buffer will enqueue tasks and apply back pressure.
 */
export interface TaskBufferOptions {
  /**
   * The maximum number of concurrently executing tasks in this
   * buffer. Any operations enqueued while the buffer is at this
   * capacity will be added to the pending queued until such time as
   * there is available space in the buffer to run it.
   */
  maxConcurrency: number;

  /**
   * provide fine-grained control over the pending queue. When the
   * specificied thresholds are reached, the open and close operations
   * will be called to either stop or start the flow of items into the
   * buffer.
   */
  valve?: {
    /**
    * When the pending queue reaches this number, the `close()`
    * operation will be invoked.
    */
    closeAt: number;

    /**
     * When the task buffer's valve is closed, and the pending queue drops
     * to this value, it will be re-opened
     */
    openAt: number;

    /**
     * Invoked when the valve is re-opened and operations can resume
     * flowing
     */
    open(): Operation<void>;

    /**
     * Invoked when the valve is open, but the pending queue has
     * crossed the `closeAt` threshold.
     */
    close(): Operation<void>;
  };
}

/**
 * Create a new `TaskBuffer` attached to the current scope. It will
 * not allow its number of active tasks to exceed `max`.
 *
 * ```ts
 * import { run, sleep } from "effection";
 * import { useTaskBuffer } from "@effectionx/task-buffer";
 *
 * await run(function*() {
 *  const buffer = yield* useTaskBuffer(2);
 *
 *  yield* buffer.spawn(() => sleep(10));
 *  yield* buffer.spawn(() => sleep(10));
 *  // the next task won't execute until the above two tasks are completed
 *  yield* buffer.spawn(() => sleep(10));
 *
 *  // will wait for all tasks to be complete
 *  yield* buffer;
 * });
 * ```
 *
 * @param max - the maximum number of concurrent tasks.
 * @returns the new task buffer.
 */
export function useTaskBuffer(
  options: TaskBufferOptions,
): Operation<TaskBuffer> {
  let { maxConcurrency, valve } = options;
  return resource(function* (provide) {
    let input = createChannel<void, never>();

    let output = createChannel<Result<unknown>, never>();

    let buffer = new Set<Task<unknown>>();

    let scope = yield* useScope();

    let queue: SpawnRequest<unknown>[] = [];

    let opened = true;

    yield* spawn(function* () {
      while (true) {
        if (queue.length === 0) {
          yield* next(input);
        } else if (buffer.size < maxConcurrency) {
          let request = queue.pop()!;
          let task = yield* scope.spawn(request.operation);
          buffer.add(task);
          yield* spawn(function* () {
            try {
              let result = Ok(yield* task);
              buffer.delete(task);
              yield* output.send(result);
            } catch (error) {
              buffer.delete(task);
              yield* output.send(Err(error as Error));
            } finally {
              if (!opened && valve && queue.length <= valve.openAt) {
                yield* valve.open();
                opened = true;
              }
            }
          });
          request.resolve(task);
        } else {
          yield* next(output);
        }
      }
    });

    yield* provide({
      *[Symbol.iterator]() {
        let outputs = yield* output;
        while (buffer.size > 0 || queue.length > 0) {
          yield* outputs.next();
        }
      },
      *enqueue<T>(fn: () => Operation<T>) {
        let { operation, resolve } = withResolvers<Task<T>>();
        if (opened && valve && queue.length >= valve.closeAt) {
          yield* valve.close();
          opened = false;
        }
        queue.unshift({
          operation: fn,
          resolve: resolve as Resolve<unknown>,
        });

        yield* input.send();
        return operation;
      },
      *close() {
        if (opened && valve) {
          yield* valve.close();
        }
        queue.length = 0;
        let outputs = yield* output;
        while (buffer.size > 0 || queue.length > 0) {
          yield* outputs.next();
        }
      },
    });
  });
}

interface SpawnRequest<T> {
  operation(): Operation<T>;
  resolve: Resolve<Task<T>>;
}

function* next<T, TClose>(
  stream: Stream<T, TClose>,
): Operation<IteratorResult<T, TClose>> {
  let subscription = yield* stream;
  return yield* subscription.next();
}
