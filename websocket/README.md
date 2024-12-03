# WebSocket

Use the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
API as an Effection resource. Instead of a fragile, spring-loaded confederation
of 'open', 'close', 'error', and 'message' event handlers, `useWebSocket()`
organizes them for you so that you can consume all events from the server as a
plain stream that has state-readiness and proper error handling baked in.

To use a websocket import the `useWebSocket()` operation which behaves just like
the [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
constructor.

```ts
import { main, each } from "effection";
import { useWebSocket } from "


await main(function*() {
  let socket = yield* useWebSocket("ws://websocket.example.org");

  socket.send("Hello World");

  for (let message of yield* each(socket)) {
    console.log('Message from server', message);
    yield* each.next();
  }
});
```

The resource provides the following niceties:

- When `useWebSocket()` returns, it will have already received the `open` event.
- If the socket recieves an error event, that event's error will be thrown to
  the current error boundary.
- The socket is a stream whose items are each `MessageEvents`, the `CloseEvent`
  of the websocket will be the close event of that stream.

You can also instantiate a websocket separately and pass it along to
`useWebSocket()`. This is helpful for runtimes such as NodeJS prior to version
21 that do not have built in support for websocket.

```
import { createWebSocket } from "my-websocket-client";

await main(function*() {
  let socket = yield* useWebSocket(() => createWebSocket("ws://websocket.example.org"));

  for (let message of yield* each(socket)) {
    console.log('Message from server', message);
    yield* each.next();
  }
});
```
