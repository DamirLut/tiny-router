import { describe, it, expect } from "bun:test";
import { TransitionOrchestrator } from "../src/lib/internal/transitionOrchestrator";
import type { OrchestratorDeps } from "../src/lib/internal/transitionOrchestrator";
import type { RouterHistoryAction } from "../src/lib/types";

const routes = [
  { path: "/", element: "home" },
  { path: "/a", element: "A" },
];

function make(deps?: Partial<OrchestratorDeps>) {
  const transitions: any[] = [];
  const animFrom: any[] = [];
  const base: OrchestratorDeps = {
    routes,
    resolveRendered: (r) => r.element,
    setTransition: (t) => transitions.push(t),
    setAnimFrom: (v) => animFrom.push(v),
    durationMs: 5,
  };
  const orch = new TransitionOrchestrator({
    ...(base as OrchestratorDeps),
    ...(deps as object),
  });
  return { orch, transitions, animFrom };
}

describe("TransitionOrchestrator", () => {
  it("builds transition and sets outgoing frame for push", () => {
    const { orch, transitions, animFrom } = make();
    orch.run("/", "/a", "push" as RouterHistoryAction);
    expect(transitions[0].from).toBe("/");
    expect(transitions[0].to).toBe("/a");
    expect(animFrom[0]?.key).toBe("/");
  });

  it("applies custom animation override once", () => {
    const { orch, transitions } = make();
    orch.setCustom("slideBackIn");
    orch.run("/", "/a", "push" as RouterHistoryAction);
    expect(transitions[0].customTransition).toBe("slideBackIn");
    // second transition should not reuse custom
    orch.run("/a", "/", "back" as RouterHistoryAction);
    expect(transitions[1].customTransition).toBeUndefined();
  });

  it("does not set outgoing frame for replace", () => {
    const { orch, animFrom } = make();
    orch.run("/", "/a", "replace" as RouterHistoryAction);
    expect(animFrom[0]).toBeUndefined();
  });

  it("cleans up animFrom after timeout", async () => {
    const transitions: any[] = [];
    const animFrom: any[] = [];
    const orch = new TransitionOrchestrator({
      routes,
      resolveRendered: (r) => r.element,
      setTransition: (t) => transitions.push(t),
      setAnimFrom: (v) =>
        animFrom.push(typeof v === "function" ? v(animFrom.at(-1) ?? null) : v),
      durationMs: 0,
    });
    orch.run("/", "/a", "push");
    expect(animFrom[0]?.key).toBe("/");
    await new Promise((r) => setTimeout(r, 1));
    // last entry should be null after cleanup
    expect(animFrom.at(-1)).toBeNull();
  });
});
