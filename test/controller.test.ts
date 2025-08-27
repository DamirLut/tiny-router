import { describe, it, expect } from "bun:test";
import { RouterController } from "../src/lib/internal/controller";
import type { RouteConfig } from "../src/lib/types";

const routes: RouteConfig[] = [
  { path: "/a", element: "A" },
  { path: "/b", element: "B" },
];

function make(initial = "/a") {
  let current = initial;
  const transitions: any[] = [];
  const animFrom: any[] = [];
  const controller = new RouterController(
    {
      routes,
      resolveRendered: (r) => r.element,
      setCurrentPath: (p) =>
        (current = typeof p === "function" ? p(current) : p),
      setTransition: (t) => transitions.push(t),
      setAnimFrom: (v) => animFrom.push(v),
      getScrollPos: () => 0,
      transitionDuration: 1,
    },
    initial,
  );
  return {
    controller,
    transitions,
    animFrom,
    get current() {
      return current;
    },
  };
}

describe("RouterController edge cases", () => {
  it("early returns on push to same path", () => {
    const { controller, transitions } = make("/a");
    controller.push("/a");
    // Should not create a new transition for noop push
    expect(transitions.length).toBe(0);
  });

  it("attach/detach and hashchange same-path early return", () => {
    const { controller, transitions } = make("/a");
    controller.attach();
    // dispatch hashchange with same path -> no transition
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    controller.detach();
    expect(transitions.length).toBe(0);
  });
});
