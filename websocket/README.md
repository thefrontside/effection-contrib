# WebSocket

A streamlined [WebSocket][websocket] client for Effection programs that
transforms the event-based WebSocket API into a clean, resource-oriented stream.

## Why Use this API?

Traditional WebSocket API require managing multiple event handlers (`open`,
`close`, `error`, `message`) which can become complex and error-prone.

This package simplifies WebSocket usage by:

- Providing a clean stream-based interface
- Handling connection state management automatically
- Implementing proper error handling
- Ensuring resource cleanup

## Basic Usage

```typescript
import { each, main } from "effection";
import { useWebSocket } from "@effection-contrib/websocket";

await main(function* () {
  // Connection is guaranteed to be open when this returns
  let socket = yield* useWebSocket("ws://websocket.example.org");

  // Send messages to the server
  socket.send("Hello World");

  // Receive messages using a simple iterator
  for (let message of yield* each(socket)) {
    console.log("Message from server", message);
    yield* each.next();
  }
});
```

## Features

- **Ready-to-use Connections**: `useWebSocket()` returns only after the
  connection is established
- **Automatic Error Handling**: Socket errors are properly propagated to your
  error boundary
- **Stream-based API**: Messages are delivered through a simple stream interface
- **Clean Resource Management**: Connections are properly cleaned up when the
  operation completes

## Advanced Usage

### Custom WebSocket Implementations

For environments without native WebSocket support (like Node.js < 21), you can
provide your own WebSocket implementation:

```typescript
import { createWebSocket } from "my-websocket-client";
import { each, main } from "effection";
import { useWebSocket } from "@effection-contrib/websocket";

await main(function* () {
  let socket = yield* useWebSocket(() =>
    createWebSocket("ws://websocket.example.org")
  );

  for (let message of yield* each(socket)) {
    console.log("Message from server", message);
    yield* each.next();
  }
});
```

[websocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
