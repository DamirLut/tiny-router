import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { RouterContext } from "./context";
import { matchRoute } from "./match";
import type {
  RouteConfig,
  RouterContextType,
  RouterHistoryAction,
  RouterViewTransition,
} from "./types";

import styles from "./router.module.css";

const parseHash = (): string => window.location.hash.replace(/^#/, "") || "/";

// --- helpers kept outside component to keep RouterProvider lean ---
function recordScroll(
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

function applyHistoryMutation(
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
  // Future user hash changes are considered a pop (browser back/forward)
  actionRef.current = "pop";
}

interface BuildTransitionArgs {
  routes: RouteConfig[];
  fromPath: string;
  toPath: string;
  action: RouterHistoryAction;
  resolveRendered: (r: RouteConfig) => React.ReactNode;
  notFound?: React.ReactNode;
}
function buildTransition({
  routes,
  fromPath,
  toPath,
  action,
  resolveRendered,
  notFound,
}: BuildTransitionArgs): RouterViewTransition {
  const [toRoute] = matchRoute(toPath, routes);
  const [fromRoute] = matchRoute(fromPath, routes);
  return {
    from: fromPath,
    to: toPath,
    action,
    fromElement: fromRoute ? resolveRendered(fromRoute) : notFound,
    toElement: toRoute ? resolveRendered(toRoute) : notFound,
  };
}

export const RouterProvider: React.FC<{
  routes: RouteConfig[];
  notFound?: React.ReactNode;
  /** Element shown globally while any lazy route first-loads. */
  lazySpinner?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ routes, notFound, lazySpinner, children }) => {
  const [currentPath, setCurrentPath] = useState(parseHash());
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

  // Core hashchange handler kept small by delegating to helpers
  useEffect(() => {
    const onHashChange = () => {
      const newPath = parseHash();
      const oldPath = historyRef.current.at(-1) || "";
      recordScroll(scrollPositionsRef, oldPath);
      setCurrentPath(newPath);
      const tr = buildTransition({
        routes,
        fromPath: oldPath,
        toPath: newPath,
        action: actionRef.current,
        resolveRendered,
        notFound,
      });
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
  }, [routes, notFound, resolveRendered]);

  // Scroll restoration
  useEffect(() => {
    const pos = scrollPositionsRef.current[currentPath];
    requestAnimationFrame(() => {
      window.scrollTo(0, typeof pos === "number" ? pos : 0);
    });
  }, [currentPath]);

  const push = (path: string) => {
    if (path === currentPath) return;
    actionRef.current = "push";
    window.location.hash = path;
  };
  const replace = (path: string) => {
    actionRef.current = "replace";
    window.location.replace(`#${path}`);
  };
  const back = () => {
    actionRef.current = "back";
    window.history.back();
  };

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

  useEffect(() => {
    if (!animFrom) return;
    const t = setTimeout(
      () => setAnimFrom((c) => (c === animFrom ? null : c)),
      320,
    );
    return () => clearTimeout(t);
  }, [animFrom]);

  return (
    <RouterContext.Provider value={ctx}>
      {children}
      {isLazyLoading && lazySpinner}
      <PageStack pages={pages} transition={transition} animFrom={animFrom} />
    </RouterContext.Provider>
  );
};

// Helper to determine animation class for a page wrapper
interface AnimClassArgs {
  page: { state: "active" | "out"; key: string; node: React.ReactNode };

  transition: RouterViewTransition | null;
  animFrom: {
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null;
}

function getAnimClass({ page, transition, animFrom }: AnimClassArgs): string {
  if (!transition) return "";
  const action = transition.action;
  if (page.state === "active") {
    if (action === "push") return styles.slideIn;
    if (action === "back") return styles.slideBackIn;
    return "";
  }
  if (page.state === "out" && animFrom) {
    if (animFrom.action === "push") return styles.slideOutLeft;
    if (animFrom.action === "back") return styles.slideOutRight;
  }
  return "";
}

function useLazyResolver(args: {
  route: RouteConfig | undefined;
  resolvedLazy: Record<string, React.ReactNode>;
  setResolvedLazy: React.Dispatch<
    React.SetStateAction<Record<string, React.ReactNode>>
  >;
  pendingLazyRef: React.MutableRefObject<Set<string>>;
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

const PageStack: React.FC<{
  pages: Array<{ key: string; node: React.ReactNode; state: "active" | "out" }>;
  transition: RouterViewTransition | null;
  animFrom: {
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null;
}> = ({ pages, transition, animFrom }) => (
  <div className={styles.container}>
    {pages.map((p) => {
      const animClass = getAnimClass({
        page: p,
        transition,
        animFrom,
      });
      const base =
        pages.length === 1 && p.state === "active"
          ? [styles.page, styles.pageActive]
          : [styles.page];
      return (
        <div
          key={p.key}
          className={[...base, animClass].filter(Boolean).join(" ")}
        >
          {p.node}
        </div>
      );
    })}
  </div>
);

export default RouterProvider;
