// eslint-disable-next-line simple-import-sort/imports
import type {
  NavigationOptions,
  RouteConfig,
  RouterHistoryAction,
  RouterViewTransition,
} from "../types";
import { parseHash } from "../utils";
import { HistoryManager } from "./history";
import { ScrollManager } from "./scroll";
import {
  TransitionOrchestrator,
  type AnimFrame,
} from "./transitionOrchestrator";
import type React from "react";

interface ControllerDeps {
  routes: RouteConfig[];
  notFound?: React.ReactNode;
  resolveRendered: (r: RouteConfig) => React.ReactNode;
  setCurrentPath: React.Dispatch<React.SetStateAction<string>>;
  setTransition: (t: RouterViewTransition | null) => void;
  setAnimFrom: (
    v: AnimFrame | null | ((c: AnimFrame | null) => AnimFrame | null),
  ) => void;
  getScrollPos: () => number;
  transitionDuration?: number;
}

export class RouterController {
  private routes: RouteConfig[];
  private notFound?: React.ReactNode;
  private resolveRendered: (r: RouteConfig) => React.ReactNode;
  private setCurrentPath: (v: string | ((s: string) => string)) => void;
  private history: HistoryManager;
  private scroll: ScrollManager;
  private orchestrator: TransitionOrchestrator;
  private customAnim?: NavigationOptions["transition"];
  private detachFn?: () => void;

  constructor(deps: ControllerDeps, initialPath: string) {
    this.routes = deps.routes;
    this.notFound = deps.notFound;
    this.resolveRendered = deps.resolveRendered;
    this.setCurrentPath = deps.setCurrentPath;
    this.history = new HistoryManager(initialPath);
    this.scroll = new ScrollManager(deps.getScrollPos);
    this.orchestrator = new TransitionOrchestrator({
      routes: this.routes,
      notFound: this.notFound,
      resolveRendered: (r) => this.resolveRendered(r),
      setTransition: deps.setTransition,
      setAnimFrom: deps.setAnimFrom,
      durationMs: deps.transitionDuration ?? 320,
    });
  }

  setResolveRendered(fn: (r: RouteConfig) => React.ReactNode) {
    this.resolveRendered = fn;
  }

  attach() {
    const handler = () => this.handleHashChange();
    window.addEventListener("hashchange", handler);
    this.detachFn = () => window.removeEventListener("hashchange", handler);
  }

  detach() {
    this.detachFn?.();
  }

  getCurrentPath() {
    return this.history.getCurrent();
  }

  private recordScroll(path: string) {
    this.scroll.record(path);
  }

  private applyHistoryMutation(newPath: string) {
    this.history.navigateMutate(newPath);
  }

  private buildAndApplyTransition(
    oldPath: string,
    newPath: string,
    action: RouterHistoryAction,
  ) {
    if (this.customAnim) this.orchestrator.setCustom(this.customAnim);
    this.orchestrator.run(oldPath, newPath, action);
    this.customAnim = undefined;
  }

  private finalizeNavigation(newPath: string) {
    this.setCurrentPath(newPath);
    this.applyHistoryMutation(newPath);
    this.scroll.restore(newPath);
  }

  private handleHashChange() {
    if (this.history.consumeSkipFlag()) return;
    const newPath = parseHash();
    if (newPath === this.history.getCurrent()) return;
    const oldPath = this.history.getCurrent();
    this.recordScroll(oldPath);
    this.buildAndApplyTransition(oldPath, newPath, this.history.getAction());
    this.finalizeNavigation(newPath);
  }

  navigate(
    path: string,
    action: RouterHistoryAction,
    transitionOverride?: NavigationOptions["transition"],
  ) {
    this.history.setAction(action);
    this.customAnim = transitionOverride;
    const oldPath = this.history.getCurrent();
    if (path === oldPath && action === "push") return;
    this.recordScroll(oldPath);
    this.buildAndApplyTransition(oldPath, path, this.history.getAction());
    this.finalizeNavigation(path);
  }

  push(path: string, options?: NavigationOptions) {
    this.navigate(path, "push", options?.transition);
    window.location.hash = path;
  }

  replace(path: string, options?: NavigationOptions) {
    this.navigate(path, "replace", options?.transition);
    window.location.replace(`#${path}`);
  }

  back() {
    this.history.setAction("back");
    window.history.back();
  }
}
