// Scroll position storage & restoration (SRP)
export class ScrollManager {
  private positions: Record<string, number> = {};
  private getPos: () => number;

  constructor(getPos: () => number) {
    this.getPos = getPos;
  }

  record(path: string) {
    try {
      this.positions[path] = this.getPos();
    } catch {
      /* ignore */
    }
  }

  restore(path: string) {
    const saved = this.positions[path];
    requestAnimationFrame(() => {
      window.scrollTo(0, typeof saved === "number" ? saved : 0);
    });
  }
}
