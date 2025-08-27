import type { RouterHistoryAction } from "../types";

// Manages navigation history list and action state (SRP)
export class HistoryManager {
  private history: string[];
  private action: RouterHistoryAction = "push";
  private skipNextHash = false;

  constructor(initialPath: string) {
    this.history = [initialPath];
  }

  getCurrent(): string {
    return this.history[this.history.length - 1];
  }

  getStack(): string[] {
    return [...this.history];
  }

  getAction(): RouterHistoryAction {
    return this.action;
  }

  navigateMutate(newPath: string) {
    switch (this.action) {
      case "push":
        this.history.push(newPath);
        break;
      case "replace":
        this.history[this.history.length - 1] = newPath;
        break;
      case "back":
        this.history.pop();
        break;
    }
    // After applying an action treat subsequent hash changes as pops
    const acted = this.action;
    this.action = "pop";
    if (acted !== "back") this.skipNextHash = true; // we caused the hash mutation ourselves
  }

  setAction(a: RouterHistoryAction) {
    this.action = a;
  }

  // Consume skip flag (used by hashchange listener)
  consumeSkipFlag(): boolean {
    if (this.skipNextHash) {
      this.skipNextHash = false;
      return true;
    }
    return false;
  }
}
