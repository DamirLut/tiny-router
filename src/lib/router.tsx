import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { PageStack } from "./internal/animation";
import { RouterController } from "./internal/controller";
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

interface RouterProviderProps {
  routes: RouteConfig[];
  notFound?: React.FC;
  lazySpinner?: React.ReactNode;
  children?: React.ReactNode;
}

export const RouterProvider: React.FC<RouterProviderProps> = ({
  routes,
  notFound: NotFound,
  lazySpinner,
  children,
}: RouterProviderProps) => {
  const [currentPath, setCurrentPath] = useState(parseHash());
  const [transition, setTransition] = useState<RouterViewTransition | null>(
    null,
  );
  const [resolvedLazy, setResolvedLazy] = useState<
    Record<string, React.ReactNode>
  >({});
  const pendingLazyRef = useRef<Set<string>>(new Set());
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [animFrom, setAnimFrom] = useState<{
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const controllerRef = useRef<RouterController | null>(null);
  const resolveRendered = useCallback(
    (r: RouteConfig): React.ReactNode => resolvedLazy[r.path] ?? r.element,
    [resolvedLazy],
  );

  useEffect(() => {
    const ctrl = new RouterController(
      {
        routes,
        notFound: NotFound ? <NotFound /> : undefined,
        resolveRendered,
        setCurrentPath,
        setTransition,
        setAnimFrom,
        getScrollPos: () =>
          window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0,
        notifyHistoryChange: () => setHistory(ctrl.getHistory()),
      },
      currentPath,
    );
    controllerRef.current = ctrl;
    setHistory(ctrl.getHistory());
    ctrl.attach();
    return () => ctrl.detach();
  }, [routes, NotFound]);

  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const updateHistory = () => setHistory(ctrl.getHistory());
    window.addEventListener("hashchange", updateHistory);
    return () => window.removeEventListener("hashchange", updateHistory);
  }, []);

  const push = useCallback(
    (path: string, options?: NavigationOptions) =>
      controllerRef.current?.push(path, options),
    [],
  );
  const replace = useCallback(
    (path: string, options?: NavigationOptions) =>
      controllerRef.current?.replace(path, options),
    [],
  );
  const back = useCallback(() => controllerRef.current?.back(), []);

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
    history,
  };

  const activeElement = route ? (
    resolveRendered(route)
  ) : NotFound ? (
    <NotFound />
  ) : null;

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

  // outgoing cleanup handled by controller internal timeout

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
