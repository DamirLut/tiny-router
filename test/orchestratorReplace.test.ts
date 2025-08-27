import { describe, it, expect } from "bun:test";
import { TransitionOrchestrator } from "../src/lib/internal/transitionOrchestrator";

const routes = [
  { path: "/", element: "home" },
  { path: "/a", element: "A" },
];

describe("TransitionOrchestrator replace edge", () => {
  it("does not set animFrom on replace when fromElement exists", () => {
    const animFrom: any[] = [];
    const orch = new TransitionOrchestrator({
      routes,
      resolveRendered: (r) => r.element,
      setTransition: () => {},
      setAnimFrom: (v) => animFrom.push(v),
      durationMs: 1,
    });
    orch.run("/", "/a", "replace");
    expect(animFrom.length).toBe(0);
  });
});
