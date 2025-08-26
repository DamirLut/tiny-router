export function recordScroll(
  store: React.MutableRefObject<Record<string, number>>,
  path: string,
) {
  try {
    const sc =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    store.current[path] = sc;
  } catch {
    /* ignore */
  }
}

import type { RouterHistoryAction } from "../types";

export function applyHistoryMutation(
  historyRef: React.MutableRefObject<string[]>,
  actionRef: React.MutableRefObject<RouterHistoryAction>,
  newPath: string,
) {
  switch (actionRef.current) {
    case "push":
      historyRef.current.push(newPath);
      break;
    case "replace":
      historyRef.current[historyRef.current.length - 1] = newPath;
      break;
    case "back":
      historyRef.current.pop();
      break;
  }
  actionRef.current = "pop";
}
