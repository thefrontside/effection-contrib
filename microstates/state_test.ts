import { run } from 'effection';
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { boolean } from "./boolean.ts";
import { state } from "./state.ts";

describe("state", () => {
  it("initializes provided values", async () => {
    await run(function*() {
      const s = yield* state({
        isOpen: boolean(),
        isFlying: boolean(),
      }, { isOpen: true, isFlying: true });

      expect(s).toMatchObject({
        isOpen: {
          value: true,
        },
        isFlying: {
          value: true
        }
      })
    });
  });
  it("streams composed value", async () => {
    await run(function*() {
      const s = yield* state({
        isOpen: boolean(false),
        isFlying: boolean(true),
      });

      const subscription = yield* s;

      expect(yield* s.isFlying.toggle()).toBe(false)

      let next = yield* subscription.next();

      expect(next.value).toMatchObject({
        isFlying: false,
        isOpen: false
      });

      expect(yield* s.isOpen.toggle()).toBe(true);

      next = yield* subscription.next();

      expect(next.value).toMatchObject({
        isFlying: false,
        isOpen: true
      });
    });
  });
  it("has a value", async () => {
    await run(function*() {
      const s = yield* state({
        isOpen: boolean(false),
        isFlying: boolean(true),
      });

      const subscription = yield* s;

      expect(yield* s.isOpen.toggle()).toBe(true);

      let next = yield* subscription.next();
      expect(next.value).toEqual({
        isOpen: true,
        isFlying: true
      })
    });
  });
  it("updates both leaf and root", async () => {
    await run(function*() {
      const s = yield* state({
        isOpen: boolean(),
        isFlying: boolean(),
      });

      const isOpenSubscription = yield* s.isOpen;
      const stateSubscription = yield* s;

      expect(yield* s.isOpen.toggle()).toBe(true);

      expect((yield* stateSubscription.next()).value).toEqual({ isOpen: true, isFlying: false });
      expect((yield* isOpenSubscription.next()).value).toEqual(true);
    });
  });
  describe("nested states", () => {
    const states = state({
      car: state({
        isOn: boolean(true)
      }),
      person: state({
        isSleeping: boolean()
      })
    });
    it("allows initializing deeply nested types", async () => {
      await run(function*() {
        const s = yield* states;
  
        const subscription = yield* s;

        expect(yield* s.person.isSleeping.toggle()).toBe(true);

        expect((yield* subscription.next()).value).toEqual({
          car: {
            isOn: true
          },
          person: {
            isSleeping: true
          }
        })
      });
    });
  })
});