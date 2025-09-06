export type RouteParams = Record<string, string | undefined>;

export interface RouteConfig {
  /** Path pattern (supports :param segments). */
  path: string;
  /** Element to render when matched (or initial placeholder if lazy provided). */
  element: React.ReactNode;
  /** Optional lazy loader; resolved component replaces element after first match. */
  lazy?: () => Promise<{
    default: React.ComponentType<Record<string, unknown>>;
  }>;
}

export type RouterHistoryAction = "push" | "replace" | "back" | "pop";
export type TransitionType = "slideIn" | "slideBackIn" | "none";

export interface RouterViewTransition {
  from: string;
  to: string;
  action: RouterHistoryAction;
  fromElement?: React.ReactNode;
  toElement?: React.ReactNode;
  /** Optional per-navigation transition override name. */
  customTransition?: TransitionType;
}

export interface RouterContextType {
  routes: RouteConfig[];
  currentPath: string;
  params: RouteParams;
  push: (path: string, options?: NavigationOptions) => void;
  replace: (path: string, options?: NavigationOptions) => void;
  back: () => void;
  transition: RouterViewTransition | null;
  lastPath?: string;
  isLazyLoading?: boolean;
  /** Navigation history */
  history: string[];
}

export interface NavigationOptions {
  /** Custom transition override. Use core names: 'slideIn', 'slideBackIn', or 'none' to disable. */
  transition?: TransitionType;
}
