import type React from "react";

import type {
  RouteConfig,
  RouterHistoryAction,
  RouterViewTransition,
} from "../types";

import { buildTransition } from "./transition";

export interface AnimFrame {
  key: string;
  node: React.ReactNode;
  action: RouterHistoryAction;
}

export interface OrchestratorDeps {
  routes: RouteConfig[];
  notFound?: React.ReactNode;
  resolveRendered: (r: RouteConfig) => React.ReactNode;
  setTransition: (t: RouterViewTransition | null) => void;
  setAnimFrom: (
    v: AnimFrame | null | ((c: AnimFrame | null) => AnimFrame | null),
  ) => void;
  durationMs?: number;
}

export class TransitionOrchestrator {
  private deps: OrchestratorDeps;
  private customAnim?: string;

  constructor(deps: OrchestratorDeps) {
    this.deps = deps;
  }

  setCustom(anim?: string) {
    this.customAnim = anim;
  }

  run(oldPath: string, newPath: string, action: RouterHistoryAction) {
    const {
      routes,
      notFound,
      resolveRendered,
      setTransition,
      setAnimFrom,
      durationMs = 320,
    } = this.deps;
    const tr = buildTransition({
      routes,
      fromPath: oldPath,
      toPath: newPath,
      action,
      resolveRendered,
      notFound,
    });
    if (this.customAnim) {
      // @ts-expect-error customTransition narrow
      tr.customTransition = this.customAnim;
      this.customAnim = undefined;
    }
    if (action !== "replace" && tr.fromElement) {
      setAnimFrom({ key: oldPath, node: tr.fromElement, action });
      setTimeout(() => {
        setAnimFrom((cur) => (cur && cur.key === oldPath ? null : cur));
      }, durationMs);
    }
    setTransition(tr);
    return tr;
  }
}
