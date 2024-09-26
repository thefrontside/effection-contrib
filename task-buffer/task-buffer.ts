import {
  action,
  createChannel,
  Err,
  Ok,
  type Operation,
  type Resolve,
  resource,
  type Result,
  sleep,
  spawn,
  type Task,
  useScope,
} from "effection";

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
  spawn<T>(op: () => Operation<T>): Operation<Task<T>>;
}

/**
 * Create a new `TaskBuffer` attached to the current scope. It will
 * not allow its number of active tasks to exceed `max`.
 * 
 * ```ts
 * import { run, sleep } from "effection";
 * import { useTaskBuffer } from "@effection-contrib/task-buffer";
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
export function useTaskBuffer(max: number): Operation<TaskBuffer> {
  return resource(function* (provide) {
    let input = createChannel<SpawnRequest<unknown>, never>();

    let output = createChannel<Result<unknown>, never>();

    let buffer = new Set<Task<unknown>>();

    let scope = yield* useScope();

    let requests = yield* input;

    yield* spawn(function* () {
      while (true) {
        if (buffer.size < max) {
          let { value: request } = yield* requests.next();
          // TODO: this is a bug in Effection.
          // when an error occurs, this is still running.
          yield* sleep(0);
          let task = scope.run(request.operation);
          buffer.add(task);
          yield* spawn(function* () {
            try {
              yield* output.send(Ok(yield* task));
            } catch (error) {
              yield* output.send(Err(error));
            } finally {
              buffer.delete(task);
            }
          });
          request.resolve(task);
        } else {
          yield* (yield* output).next();
        }
      }
    });

    yield* provide({
      *[Symbol.iterator]() {
        while (buffer.size > 0) {
          for (let task of buffer.values()) {
            yield* task;
          }
        }
      },
      spawn: (operation) =>
        action(function* (resolve) {
          yield* input.send({
            operation,
            resolve: resolve as Resolve<Task<unknown>>,
          });
        }),
    });
  });
}

interface SpawnRequest<T> {
  operation(): Operation<T>;
  resolve: Resolve<Task<T>>;
}
