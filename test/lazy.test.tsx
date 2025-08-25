import React from "react";

import "./utils/matchers";
import { render, screen, act } from "@testing-library/react";
import { RouterProvider } from "../src/lib/router";
import { useRouter } from "../src/lib/hooks";
import { describe, expect, it } from "bun:test";

describe("lazy route loading", () => {
  it("shows spinner while lazy component resolves then renders component", async () => {
    // Ensure starting hash
    window.location.hash = "#/";
    const LazyComp: React.FC = () => <div data-testid="lazy-loaded">Lazy</div>;
    const HomeWithNav: React.FC = () => {
      const { push } = useRouter();
      return (
        <div>
          <div data-testid="home">Home</div>
          <button type="button" data-testid="go" onClick={() => push("/lazy")}>
            Go
          </button>
        </div>
      );
    };
    const routes = [
      {
        path: "/",
        element: <HomeWithNav />,
      },
      {
        path: "/lazy",
        element: <div data-testid="lazy-placeholder">Placeholder</div>,
        lazy: () =>
          new Promise<{ default: React.ComponentType }>((resolve) => {
            setTimeout(() => resolve({ default: LazyComp }), 10);
          }),
      },
    ];

    render(
      <RouterProvider
        routes={routes}
        lazySpinner={<div data-testid="spinner">Loading...</div>}
      />,
    );

    // trigger navigation
    await act(async () => {
      const btn = screen.getByTestId("go");
      btn.click();
      // happy-dom may not emit hashchange automatically for hash assignment in click
      window.location.hash = "#/lazy";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    // Spinner should be visible before lazy resolves
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    // Wait for lazy component
    await screen.findByTestId("lazy-loaded");

    // Spinner should disappear after load
    expect(screen.queryByTestId("spinner")).toBeNull();
  });
});
