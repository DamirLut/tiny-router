import { useCallback, useEffect } from "react";

import type {
  NavigationOptions,
  RouteConfig,
  RouterHistoryAction,
  RouterViewTransition,
} from "../types";
import { parseHash } from "../utils";

import { buildTransition } from "./transition";

export function useScrollRestore(
  currentPath: string,
  scrollPositionsRef: React.RefObject<Record<string, number>>,
) {
  useEffect(() => {
    const pos = scrollPositionsRef.current[currentPath];
    requestAnimationFrame(() => {
      window.scrollTo(0, typeof pos === "number" ? pos : 0);
    });
  }, [currentPath, scrollPositionsRef]);
}

export function useOutgoingCleanup<T extends { key: string }>(
  animFrom: T | null,
  setAnimFrom: React.Dispatch<React.SetStateAction<T | null>>,
  duration = 320,
) {
  useEffect(() => {
    if (!animFrom) return;
    const t = setTimeout(
      () => setAnimFrom((c) => (c === animFrom ? null : c)),
      duration,
    );
    return () => clearTimeout(t);
  }, [animFrom, setAnimFrom, duration]);
}

export interface RouterRuntime {
  routes: RouteConfig[];
  notFound?: React.ReactNode;
  resolveRendered: (r: RouteConfig) => React.ReactNode;
  skipNextHashRef: React.RefObject<boolean>;
  currentPathRef: React.RefObject<string>;
  historyRef: React.RefObject<string[]>;
  actionRef: React.RefObject<RouterHistoryAction>;
  setCurrentPath: React.Dispatch<React.SetStateAction<string>>;
  scrollPositionsRef: React.RefObject<Record<string, number>>;
  customAnimRef: React.RefObject<NavigationOptions["transition"] | undefined>;
  setTransition: React.Dispatch<
    React.SetStateAction<RouterViewTransition | null>
  >;
  setAnimFrom: React.Dispatch<
    React.SetStateAction<{
      key: string;
      node: React.ReactNode;
      action: RouterHistoryAction;
    } | null>
  >;
  recordScroll: (
    store: React.RefObject<Record<string, number>>,
    path: string,
  ) => void;
  applyHistoryMutation: (
    historyRef: React.RefObject<string[]>,
    actionRef: React.RefObject<RouterHistoryAction>,
    newPath: string,
  ) => void;
}

export function useHashListener(rt: RouterRuntime) {
  const {
    routes,
    notFound,
    resolveRendered,
    skipNextHashRef,
    currentPathRef,
    historyRef,
    actionRef,
    setCurrentPath,
    scrollPositionsRef,
    customAnimRef,
    setTransition,
    setAnimFrom,
    recordScroll,
    applyHistoryMutation,
  } = rt;
  useEffect(() => {
    const onHashChange = () => {
      if (skipNextHashRef.current) {
        skipNextHashRef.current = false;
        return;
      }
      const newPath = parseHash();
      if (newPath === currentPathRef.current) return;
      const oldPath = historyRef.current.at(-1) || "";
      recordScroll(scrollPositionsRef, oldPath);
      setCurrentPath(newPath);
      currentPathRef.current = newPath;
      const tr = buildTransition({
        routes,
        fromPath: oldPath,
        toPath: newPath,
        action: actionRef.current,
        resolveRendered,
        notFound,
      });
      if (customAnimRef.current) {
        tr.customTransition = customAnimRef.current;
        customAnimRef.current = undefined;
      }
      setTransition(tr);
      if (actionRef.current !== "replace" && tr.fromElement) {
        setAnimFrom({
          key: oldPath,
          node: tr.fromElement,
          action: actionRef.current,
        });
      }
      applyHistoryMutation(historyRef, actionRef, newPath);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [
    routes,
    notFound,
    resolveRendered,
    skipNextHashRef,
    currentPathRef,
    historyRef,
    actionRef,
    setCurrentPath,
    scrollPositionsRef,
    customAnimRef,
    setTransition,
    setAnimFrom,
    recordScroll,
    applyHistoryMutation,
  ]);
}

export function useImmediateNavigation(
  rt: RouterRuntime & { currentPath: string },
) {
  const {
    routes,
    notFound,
    currentPath,
    setCurrentPath,
    historyRef,
    actionRef,
    customAnimRef,
    scrollPositionsRef,
    resolveRendered,
    setAnimFrom,
    setTransition,
    currentPathRef,
    skipNextHashRef,
    recordScroll,
    applyHistoryMutation,
  } = rt;

  const applyImmediateNavigation = useCallback(
    (
      path: string,
      action: RouterHistoryAction,
      transitionOverride?: NavigationOptions["transition"],
    ) => {
      actionRef.current = action;
      customAnimRef.current = transitionOverride;
      const oldPath = historyRef.current.at(-1) || currentPath;
      recordScroll(scrollPositionsRef, oldPath);
      const tr = buildTransition({
        routes,
        fromPath: oldPath,
        toPath: path,
        action: actionRef.current,
        resolveRendered,
        notFound,
      });
      if (customAnimRef.current) {
        tr.customTransition = customAnimRef.current;
        customAnimRef.current = undefined;
      }
      if (action !== "replace" && tr.fromElement) {
        setAnimFrom({
          key: oldPath,
          node: tr.fromElement,
          action: actionRef.current,
        });
      }
      setTransition(tr);
      setCurrentPath(path);
      currentPathRef.current = path;
      applyHistoryMutation(historyRef, actionRef, path);
      skipNextHashRef.current = true;
    },
    [
      routes,
      notFound,
      historyRef,
      actionRef,
      customAnimRef,
      scrollPositionsRef,
      currentPath,
      resolveRendered,
      setAnimFrom,
      setTransition,
      setCurrentPath,
      currentPathRef,
      skipNextHashRef,
      recordScroll,
      applyHistoryMutation,
    ],
  );

  const push = useCallback(
    (path: string, options?: NavigationOptions) => {
      if (path === currentPath) return;
      applyImmediateNavigation(path, "push", options?.transition);
      window.location.hash = path;
    },
    [applyImmediateNavigation, currentPath],
  );

  const replace = useCallback(
    (path: string, options?: NavigationOptions) => {
      applyImmediateNavigation(path, "replace", options?.transition);
      window.location.replace(`#${path}`);
    },
    [applyImmediateNavigation],
  );

  const back = useCallback(() => {
    actionRef.current = "back";
    window.history.back();
  }, [actionRef]);

  return { push, replace, back };
}
