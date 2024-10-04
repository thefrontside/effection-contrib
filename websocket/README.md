# WebSocket

Use the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
API as an Effection resource. Instead of a fragile, spring-loaded confederation
of 'open', 'close', 'error', and 'message' event handlers, `useWebSocket()`
organizes them for you so that you can consume all events from the server as a
plain stream that has state-readiness and proper error handling baked in.
