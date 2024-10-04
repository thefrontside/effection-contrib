import {
  action,
  Err,
  Ok,
  type Operation,
  type Result,
  suspend,
} from "npm:effection@3.0.3";

export interface WithResolvers<T> {
  operation: Operation<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

export function withResolvers<T>(): WithResolvers<T> {
  let subscribers: Set<Resolver<T>> = new Set();
  let settlement: Result<T> | undefined = undefined;
  let operation = action<T>(function* (resolve, reject) {
    let resolver = { resolve, reject };
    if (settlement) {
      notify(settlement, resolver);
    } else {
      try {
        subscribers.add(resolver);
        yield* suspend();
      } finally {
        subscribers.delete(resolver);
      }
    }
  });

  let settle = (result: Result<T>) => {
    if (!settlement) {
      settlement = result;
      settle = () => {};
    }
    for (let subscriber of subscribers) {
      subscribers.delete(subscriber);
      notify(settlement, subscriber);
    }
  };

  let resolve = (value: T) => {
    settle(Ok(value));
  };
  let reject = (error: Error) => {
    settle(Err(error));
  };

  return { operation, resolve, reject };
}

interface Resolver<T> {
  resolve(value: T): void;
  reject(error: Error): void;
}

function notify<T>(result: Result<T>, resolver: Resolver<T>): void {
  if (result.ok) {
    resolver.resolve(result.value);
  } else {
    resolver.reject(result.error);
  }
}
