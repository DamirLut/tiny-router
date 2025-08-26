export function parseHash(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}
