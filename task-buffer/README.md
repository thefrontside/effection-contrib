# Task Buffer

Spawn operations, but only allow a certain number to be active at a given time.
Once the `TaskBuffer` becomes full, it will queue up spawn operations until room
becomes available.
