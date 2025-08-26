import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { PageStack } from "./internal/animation";
import type { RouterRuntime } from "./internal/hooks";
import {
  useHashListener,
  useImmediateNavigation,
  useOutgoingCleanup,
  useScrollRestore,
} from "./internal/hooks";
import { applyHistoryMutation, recordScroll } from "./internal/nav";
import { RouterContext } from "./context";
import { matchRoute } from "./match";
import type {
  NavigationOptions,
  RouteConfig,
  RouterContextType,
  RouterHistoryAction,
  RouterViewTransition,
} from "./types";
import { parseHash } from "./utils";

import "./global.css";

// runtime builder hook
function useRouterRuntime(
  base: Pick<
    RouterRuntime,
    | "routes"
    | "notFound"
    | "resolveRendered"
    | "skipNextHashRef"
    | "currentPathRef"
    | "historyRef"
    | "actionRef"
    | "setCurrentPath"
    | "scrollPositionsRef"
    | "customAnimRef"
    | "setTransition"
    | "setAnimFrom"
  >,
): RouterRuntime {
  return {
    ...base,
    recordScroll,
    applyHistoryMutation,
  } as RouterRuntime;
}

interface RouterProviderProps {
  routes: RouteConfig[];
  notFound?: React.ReactNode;
  lazySpinner?: React.ReactNode; // Element shown globally while any lazy route first-loads.
  children?: React.ReactNode;
}

export const RouterProvider: React.FC<RouterProviderProps> = ({
  routes,
  notFound,
  lazySpinner,
  children,
}: RouterProviderProps) => {
  const [currentPath, setCurrentPath] = useState(parseHash());
  const currentPathRef = useRef(currentPath);
  const [transition, setTransition] = useState<RouterViewTransition | null>(
    null,
  );
  const [resolvedLazy, setResolvedLazy] = useState<
    Record<string, React.ReactNode>
  >({});
  const pendingLazyRef = useRef<Set<string>>(new Set());
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const historyRef = useRef<string[]>([parseHash()]);
  const actionRef = useRef<RouterHistoryAction>("push");
  const skipNextHashRef = useRef(false);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const [animFrom, setAnimFrom] = useState<{
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null>(null);

  const resolveRendered = useCallback(
    (r: RouteConfig): React.ReactNode => resolvedLazy[r.path] ?? r.element,
    [resolvedLazy],
  );
  // Per-navigation custom animation override (consumed once at transition creation)
  const customAnimRef = useRef<NavigationOptions["transition"] | undefined>(
    undefined,
  );

  // Wire hashchange listener via hook
  const runtime = useRouterRuntime({
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
  });
  useHashListener(runtime);

  // Scroll restoration
  useScrollRestore(currentPath, scrollPositionsRef);

  // Imperative navigation API
  const { push, replace, back } = useImmediateNavigation({
    ...runtime,
    currentPath,
  });

  const [route, params] = matchRoute(currentPath, routes);

  useLazyResolver({
    route,
    resolvedLazy,
    setResolvedLazy,
    pendingLazyRef,
    setIsLazyLoading,
  });

  const ctx: RouterContextType = {
    routes,
    currentPath,
    params,
    push,
    replace,
    back,
    transition,
    lastPath: transition?.from,
    isLazyLoading,
  };

  const activeElement = route ? resolveRendered(route) : notFound;

  const pages = useMemo(() => {
    const arr: Array<{
      key: string;
      node: React.ReactNode;
      state: "active" | "out";
    }> = [];
    if (animFrom)
      arr.push({
        key: `__out_${animFrom.key}`,
        node: animFrom.node,
        state: "out",
      });
    if (activeElement)
      arr.push({ key: currentPath, node: activeElement, state: "active" });
    return arr;
  }, [animFrom, activeElement, currentPath]);

  useOutgoingCleanup(animFrom, setAnimFrom);

  return (
    <RouterContext.Provider value={ctx}>
      {children}
      {isLazyLoading && lazySpinner}
      <PageStack pages={pages} transition={transition} animFrom={animFrom} />
    </RouterContext.Provider>
  );
};

function useLazyResolver(args: {
  route: RouteConfig | undefined;
  resolvedLazy: Record<string, React.ReactNode>;
  setResolvedLazy: React.Dispatch<
    React.SetStateAction<Record<string, React.ReactNode>>
  >;
  pendingLazyRef: React.RefObject<Set<string>>;
  setIsLazyLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    route,
    resolvedLazy,
    setResolvedLazy,
    pendingLazyRef,
    setIsLazyLoading,
  } = args;
  useEffect(() => {
    if (route && route.lazy && !resolvedLazy[route.path]) {
      if (!pendingLazyRef.current.has(route.path)) {
        pendingLazyRef.current.add(route.path);
        setIsLazyLoading(true);
        void route
          .lazy()
          .then((m: { default: React.ComponentType }) => {
            setResolvedLazy((prev) => ({
              ...prev,
              [route.path]: React.createElement(m.default),
            }));
          })
          .finally(() => {
            pendingLazyRef.current.delete(route.path);
            if (pendingLazyRef.current.size === 0) setIsLazyLoading(false);
          });
      }
    } else if (!route) {
      if (pendingLazyRef.current.size === 0) setIsLazyLoading(false);
    }
  }, [route, resolvedLazy, pendingLazyRef, setResolvedLazy, setIsLazyLoading]);
}

export default RouterProvider;
