## Effection Community Contributions

This repository is a kitchen sink of Effection operations published in
`@effection/contrib` package. The goal of this repository is to make it easier
for members of the community to share useful operations, encourage
experimentation and accelerage learning of Effection. We welcome any Effection
operation that it's been used more than 3 times, regardless how trivial you
might think it is. We intentionally set the bar relatively low to make
contribution easier. The only requirements are that you include a few tests to
make it easier for others to see how the operation is meant to be used, pass the
lint requirements to make it easier to maintain it and provide an explanation of
how you use it.

### Writing tests

We use the Deno and Node test runners to execute our tests. We'll eventually
provide some helpers for testing Effection operations. In the mean time, take a
look at [./task-buffer/task-buffer.test.ts] for examples of how to write tests.

### Versioning

All of the operations are versioned together. Use the following criteria to
figure out how to bump the version.

- When changing types of an existing operation -> major bump
- When adding a new operation -> minor bump
- When fixing a bug without breaking changes -> patch bump