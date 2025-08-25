import { useContext } from "react";

import { RouterContext } from "./context";
import type { RouterContextType, RouterViewTransition } from "./types";

export function useViewTransition(): RouterViewTransition | null {
  const ctx = useContext(RouterContext);
  if (!ctx)
    throw new Error("useViewTransition must be used within RouterProvider");
  return ctx.transition;
}
export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}
