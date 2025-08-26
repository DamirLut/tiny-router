import React from "react";

import { matchRoute } from "../match";
import type {
  RouteConfig,
  RouterHistoryAction,
  RouterViewTransition,
} from "../types";

export interface BuildTransitionArgs {
  routes: RouteConfig[];
  fromPath: string;
  toPath: string;
  action: RouterHistoryAction;
  resolveRendered: (r: RouteConfig) => React.ReactNode;
  notFound?: React.ReactNode;
}

export function buildTransition({
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
