import React from "react";

import type { RouterHistoryAction, RouterViewTransition } from "../types";

interface AnimClassArgs {
  page: { state: "active" | "out"; key: string; node: React.ReactNode };
  transition: RouterViewTransition | null;
  animFrom: {
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null;
}

export function getAnimClass({
  page,
  transition,
  animFrom,
}: AnimClassArgs): string {
  if (!transition) return "";
  const override = transition.customTransition;
  const state = page.state;

  const mapOverride = (ov: string): string => {
    if (ov === "slideIn")
      return state === "active"
        ? "tiny-router-slideIn"
        : "tiny-router-slideOutLeft";
    if (ov === "slideBackIn")
      return state === "active"
        ? "tiny-router-slideBackIn"
        : "tiny-router-slideOutRight";
    return "";
  };

  if (override) {
    if (override === "none") return "";
    return mapOverride(override);
  }

  if (state === "active") {
    return transition.action === "push"
      ? "tiny-router-slideIn"
      : transition.action === "back"
        ? "tiny-router-slideBackIn"
        : "";
  }
  if (state === "out" && animFrom) {
    return animFrom.action === "push"
      ? "tiny-router-slideOutLeft"
      : animFrom.action === "back"
        ? "tiny-router-slideOutRight"
        : "";
  }
  return "";
}

export const PageStack: React.FC<{
  pages: Array<{ key: string; node: React.ReactNode; state: "active" | "out" }>;
  transition: RouterViewTransition | null;
  animFrom: {
    key: string;
    node: React.ReactNode;
    action: RouterHistoryAction;
  } | null;
}> = ({ pages, transition, animFrom }) => (
  <div className={"tiny-router-container"}>
    {pages.map((p) => {
      const animClass = getAnimClass({ page: p, transition, animFrom });
      const base =
        pages.length === 1 && p.state === "active"
          ? ["tiny-router-page", "tiny-router-pageActive"]
          : ["tiny-router-page"];
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
