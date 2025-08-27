import { describe, it, expect } from "bun:test";
import { ScrollManager } from "../src/lib/internal/scroll";

// Mock requestAnimationFrame immediate
// override RAF to be synchronous for deterministic tests
// @ts-ignore
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(0);
  return 1;
};

describe("ScrollManager", () => {
  it("records and restores saved position", async () => {
    let pos = 120;
    const sm = new ScrollManager(() => pos);
    sm.record("/a");
    pos = 30;
    let called: Array<[number, number]> = [];
    const orig = window.scrollTo;
    // @ts-expect-error spy
    window.scrollTo = (x: number, y: number) => {
      called.push([x, y]);
    };
    sm.restore("/a");
    await Promise.resolve();
    expect(called.some(([, y]) => y === 120)).toBe(true);
    window.scrollTo = orig;
  });

  it("restores top when no saved position", async () => {
    const sm = new ScrollManager(() => 0);
    let called: Array<[number, number]> = [];
    const orig = window.scrollTo;
    // @ts-expect-error spy
    window.scrollTo = (x: number, y: number) => called.push([x, y]);
    sm.restore("/none");
    await Promise.resolve();
    expect(called.some(([, y]) => y === 0)).toBe(true);
    window.scrollTo = orig;
  });
});
