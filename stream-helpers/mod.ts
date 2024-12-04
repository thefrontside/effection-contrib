import type { Stream } from "npm:effection@4.0.0-alpha.3";

export function* first<T>(stream: Stream<T, unknown>): Operation<T | undefined> {
  let subscription = yield* stream;
  let next = yield* subscription.next();

  if (!next.done) {
    return next.value;
  }
}

export function filter<T, TDone>(stream: Stream<T, TDone>, pred: (value: T) => Operation<boolean>): Stream<T, TDone> {
  return {
    *[Symbol.iterator]() {
      let subscription = yield* stream;
      return {
	*next() {
	  while (true) {
	    let next = yield* subscription.next();
	    if (next.done) {
	      return next;
	    } else if (pred(next.value)) {
	      return next;
	    }
	  }	  
	}
      }
    }
  }
}

export function map<T, TDone>(stream: Stream<T, TDone>, fn: (value: T) => Operation<B>): Stream<B, TDone> {
  return {
    *[Symbol.iterator]() {
      let subscription = yield* stream;
      return {
	*next() {
	  let next = yield* subscription.next();
	  if (next.done) {
	    return next;
	  } else {
	    return { done: false, value: yield* fn(next.value) };
	  }	  
	}
      }
    }
  };
}

export function* reduce<T, TDone, TAcc>(stream: Stream<T, TDone>, fn: (acc: TAcc, value: T) => Operation<TAcc>, initial: TAcc): Operation<{ value: TAcc, done: TDone}> {
  let subscription = yield* stream;
  let value = initial;

  let next = yield* subscription.next();

  while (!next.done) {
    value = yield* fn(current, next.value);
    next = yield* subscription.next();
  }
  return { value, done: next.value };
}

export function tap<T, TDone>(stream: Stream<T, TDone>, fn: (value: T) => Operation<void>): Stream<T, TDone> {
  return {
    *[Symbol.iterator]() {
      let subscription = yield* stream;

      return {
	*next() {
	  let next = yield* subscription.next();
	  if (!next.done) {
	    yield* fn(next.value);
	  }
	  return next;
	}
      }
    }
  }
}

export function* forEach<T, TDone>(stream: Stream<T, TDone>, fn: (value: T) => Operation<void>): Operation<TDone> {
  let subscription = yield* stream;

  let next = yield* subscription.next();

  while (!next.done) {
    yield* fn(next.value);
    next = yield* subscription.next();
  }
  
  return next.value
}

export function drain<T, TDone>(stream: Stream<T, TDone>): Operation<TDone> {
  return forEach(stream, function*() {});
}
