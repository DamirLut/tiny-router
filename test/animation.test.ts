import { describe, it, expect } from "bun:test";
import { getAnimClass } from "../src/lib/internal/animation";

const baseTransition = (action: any) => ({
  from: "/a",
  to: "/b",
  action,
  fromElement: "A",
  toElement: "B",
});

describe("getAnimClass edge branches", () => {
  it("returns empty for no transition", () => {
    expect(
      getAnimClass({
        page: { key: "k", node: null, state: "active" },
        transition: null,
        animFrom: null,
      }),
    ).toBe("");
  });

  it("maps override none to empty", () => {
    expect(
      getAnimClass({
        page: { key: "k", node: null, state: "active" },
        transition: {
          ...baseTransition("push"),
          customTransition: "none",
        } as any,
        animFrom: null,
      }),
    ).toBe("");
  });

  it("maps override slideIn for outgoing page", () => {
    const c = getAnimClass({
      page: { key: "k", node: null, state: "out" },
      transition: {
        ...baseTransition("push"),
        customTransition: "slideIn",
      } as any,
      animFrom: { key: "k", node: null, action: "push" },
    });
    expect(c).toBe("tiny-router-slideOutLeft");
  });

  it("maps push/back outgoing direction via animFrom action", () => {
    const pushOut = getAnimClass({
      page: { key: "old", node: null, state: "out" },
      transition: baseTransition("push"),
      animFrom: { key: "old", node: null, action: "push" },
    });
    const backOut = getAnimClass({
      page: { key: "old", node: null, state: "out" },
      transition: baseTransition("back"),
      animFrom: { key: "old", node: null, action: "back" },
    });
    expect(pushOut).toBe("tiny-router-slideOutLeft");
    expect(backOut).toBe("tiny-router-slideOutRight");
  });

  it("maps slideBackIn override for active and outgoing", () => {
    const active = getAnimClass({
      page: { key: "k", node: null, state: "active" },
      transition: {
        ...baseTransition("push"),
        customTransition: "slideBackIn",
      } as any,
      animFrom: null,
    });
    const outgoing = getAnimClass({
      page: { key: "k", node: null, state: "out" },
      transition: {
        ...baseTransition("push"),
        customTransition: "slideBackIn",
      } as any,
      animFrom: { key: "k", node: null, action: "push" },
    });
    expect(active).toBe("tiny-router-slideBackIn");
    expect(outgoing).toBe("tiny-router-slideOutRight");
  });

  it("final fallback return path (state out, no animFrom)", () => {
    const cls = getAnimClass({
      page: { key: "k", node: null, state: "out" },
      transition: baseTransition("replace"),
      animFrom: null,
    });
    expect(cls).toBe("");
  });
});
