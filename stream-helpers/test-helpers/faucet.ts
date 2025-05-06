import {
  createSignal,
  type Operation,
  race,
  resource,
  type Stream,
} from "effection";
import { createBoolean, is } from "../signals.ts";

/**
 * Interface of the stream returned by `createFaucet`.
 */
export interface Faucet<T> extends Stream<T, never> {
  /**
   * Pour items to the stream synchronously.
   * @param items - The items to pour to the stream.
   */
  pour(items: T[]): Operation<void>;
  /**
   * Pour items to the stream using an operation that can be asynchronous.
   * @param op - The generator function to pour items to the stream.
   */
  pour(
    op: (send: (item: T) => void) => Operation<void>,
  ): Operation<void>;
  /**
   * Open the stream to allow items to be sent to the stream.
   */
  open(): void;
  /**
   * Close the stream to prevent items from being sent to the stream.
   */
  close(): void;
}

/**
 * Options for the faucet.
 */
export interface FaucetOptions {
  /**
   * Whether the faucet is open when created.
   */
  open?: boolean;
}

/**
 * Creates a stream that can be used to test the behavior of streams that use backpressure.
 * It's useful in tests where it can be used as a source stream. This function is used to create
 * the stream.
 *
 * The returned stream has `pour` method that can be used to send items to the stream.
 * It can accept an array of items or a generator function that will be called with a function
 * to send items to the stream.
 *
 * ```typescript
 * import { createFaucet } from "@effectionx/stream-helpers/test-helpers";
 * import { run, each, spawn } from "effection";
 *
 * await run(function* () {
 *   const faucet = yield* createFaucet({ open: true });
 *
 *   // Remember to spawn the stream subscription before sending items to the stream
 *   yield* spawn(function* () {
 *     for (let i of yield* each(faucet)) {
 *       console.log(i);
 *       yield* each.next();
 *     }
 *   });
 *
 *   // Pass an array of items to send items to the stream one at a time synchronously
 *   yield* faucet.pour([1, 2, 3]);
 *
 *   // Pass an operation to control the rate at which items are sent to the stream
 *   yield* faucet.pour(function* (send) {
 *     yield* sleep(10);
 *     send(5);
 *     yield* sleep(30);
 *     send(6);
 *     yield* sleep(10);
 *     send(7);
 *   });
 * });
 *
 * ```
 * @param options - The options for the faucet.
 * @param options.open - Whether the faucet is open.
 * @returns stream of items coming from the faucet
 */
export function createFaucet<T>(options: FaucetOptions): Operation<Faucet<T>> {
  return resource(function* (provide) {
    let signal = createSignal<T, never>();
    let open = yield* createBoolean(options.open);

    yield* provide({
      [Symbol.iterator]: signal[Symbol.iterator],
      *pour(items) {
        if (Array.isArray(items)) {
          for (let i of items) {
            yield* is(open, (open) => open === true);
            signal.send(i);
          }
        } else {
          while (true) {
            yield* is(open, (open) => open === true);
            yield* race([
              items(signal.send),
              is(open, (open) => open === false),
            ]);
          }
        }
      },
      close() {
        open.set(false);
      },
      open() {
        open.set(true);
      },
    });
  });
}
