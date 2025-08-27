import { describe, it, expect } from "bun:test";
import { HistoryManager } from "../src/lib/internal/history";

// Unit tests for HistoryManager (SRP: stack + action tracking)
describe("HistoryManager", () => {
  it("initializes with initial path", () => {
    const hm = new HistoryManager("/a");
    expect(hm.getCurrent()).toBe("/a");
    expect(hm.getStack()).toEqual(["/a"]);
  });

  it("push action mutates stack, sets skip flag, then resets action to pop", () => {
    const hm = new HistoryManager("/a");
    hm.setAction("push");
    hm.navigateMutate("/b");
    expect(hm.getCurrent()).toBe("/b");
    expect(hm.getStack()).toEqual(["/a", "/b"]);
    // skip flag consumed once
    expect(hm.consumeSkipFlag()).toBe(true);
    expect(hm.consumeSkipFlag()).toBe(false);
    // action becomes pop after mutation
    expect(hm.getAction()).toBe("pop");
  });

  it("replace action replaces last entry", () => {
    const hm = new HistoryManager("/a");
    hm.setAction("push");
    hm.navigateMutate("/b");
    hm.setAction("replace");
    hm.navigateMutate("/c");
    expect(hm.getStack()).toEqual(["/a", "/c"]);
    expect(hm.getCurrent()).toBe("/c");
  });

  it("back action pops last entry without setting skip flag", () => {
    const hm = new HistoryManager("/a");
    hm.setAction("push");
    hm.navigateMutate("/b");
    // simulate hashchange listener consuming skip flag produced by push
    hm.consumeSkipFlag();
    hm.setAction("back");
    hm.navigateMutate("/ignored"); // pop executes, arg ignored logically
    expect(hm.getCurrent()).toBe("/a");
    // back should NOT mark skip
    expect(hm.consumeSkipFlag()).toBe(false);
  });
});
