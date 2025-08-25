import { useEffect } from "react";

import { useRouter } from "../lib/hooks";
import { RouterProvider } from "../lib/router";
import type { RouteConfig } from "../lib/types";

import Spinner from "./components/Spinner";
import Home from "./pages/Home";
import UserDetail from "./pages/UserDetail";

import "../example/example.css";

const routes: RouteConfig[] = [
  { path: "/", element: <Home /> },
  { path: "/user/:id", element: <UserDetail /> },
  {
    path: "/settings",
    element: (
      <div style={{ padding: 40 }}>fallback element while lazy loads</div>
    ),
    lazy: () => import("./pages/LazySettings"),
  },
];

function NotFoundRedirect() {
  const { replace } = useRouter();
  useEffect(() => {
    replace("/");
  }, [replace]);
  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <p>Redirecting…</p>
    </div>
  );
}

export function ExampleApp() {
  return (
    <div className="example-shell">
      <RouterProvider
        routes={routes}
        notFound={<NotFoundRedirect />}
        lazySpinner={
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: 80,
              pointerEvents: "none",
              zIndex: 999,
              background:
                "linear-gradient(rgba(255,255,255,0.6),rgba(255,255,255,0.3))",
              backdropFilter: "blur(2px)",
            }}
          >
            <Spinner label="Loading…" />
          </div>
        }
      />
    </div>
  );
}

export default ExampleApp;
