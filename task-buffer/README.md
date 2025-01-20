# Task Buffer

Manages concurrent task execution by enforcing a maximum limit on simultaneously
active operations.

---

When this limit is reached, the `TaskBuffer` automatically
queues additional spawn requests and processes them in order as capacity becomes
available. This prevents resource overload while ensuring all tasks are
eventually executed.

```ts
import { run, sleep } from "effection";
import { useTaskBuffer } from "@effection-contrib/task-buffer";

await run(function* () {
  // Create a task buffer with a maximum of 2 concurrent tasks
  const buffer = yield* useTaskBuffer(2);

  // These tasks will execute immediately since they're within the limit
  yield* buffer.spawn(() => sleep(10));
  yield* buffer.spawn(() => sleep(10));

  // This task will be queued until one of the running tasks completes
  yield* buffer.spawn(() => sleep(10));

  // Wait for this specific task to complete
  yield* yield* buffer.spawn(() => sleep(10));

  // Wait for all spawned tasks to complete
  yield* buffer;
});
```
