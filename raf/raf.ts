import {
  createSignal,
  resource,
  type Stream,
} from "jsr:@effection/effection@4.0.0-alpha.7";
/**
 * Consume RAF's as a Stream.
 */
export const raf: Stream<number, never> = resource(
  function* (provide) {
    let signal = createSignal<number, never>();
    let id = 0;
    let callback: FrameRequestCallback = (timestamp) => {
      signal.send(timestamp);
      id = requestAnimationFrame(callback);
    };
    id = requestAnimationFrame(callback);
    try {
      yield* provide(yield* signal);
    } finally {
      cancelAnimationFrame(id);
    }
  },
);
