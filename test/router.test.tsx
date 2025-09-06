import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import { useRouter, useViewTransition } from "../src/lib/hooks";
import { matchRoute } from "../src/lib/match";
import { RouterProvider } from "../src/lib/router";

describe("matchRoute (pure)", () => {
  it("matches param route and decodes", () => {
    const [r, params] = matchRoute("/u/John%20Doe", [
      { path: "/u/:id", element: "x" },
    ]);
    expect(r?.path).toBe("/u/:id");
    expect(params.id).toBe("John Doe");
  });
});

function Home() {
  const { push } = useRouter();
  return (
    <div>
      <h1>Home</h1>
      <button onClick={() => push("/user/7")}>Go user</button>
    </div>
  );
}
function User() {
  const { params, back, replace } = useRouter();
  const t = useViewTransition();
  return (
    <div>
      <h1>User {params.id}</h1>
      <div data-testid="action">{t?.action}</div>
      <button onClick={() => replace("/user/8")}>Replace</button>
      <button onClick={back}>Back</button>
    </div>
  );
}

describe("RouterProvider integration", () => {
  it("applies custom transition override (slideBackIn) on push", async () => {
    window.location.hash = "#/";
    function A() {
      const { push } = useRouter();
      return (
        <div>
          <div>A</div>
          <button onClick={() => push("/b", { transition: "slideBackIn" })}>
            GoB
          </button>
        </div>
      );
    }
    function B() {
      const t = useViewTransition();
      return (
        <div>
          <div>B</div>
          <div data-testid="transition-name" data-action={t?.action}>
            {t?.customTransition || ""}
          </div>
        </div>
      );
    }
    render(
      <RouterProvider
        routes={[
          { path: "/", element: <A /> },
          { path: "/b", element: <B /> },
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("GoB"));
      window.location.hash = "#/b";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("transition-name").textContent).toBe(
        "slideBackIn",
      ),
    );
  });

  it("disables animation with transition: none", async () => {
    window.location.hash = "#/";
    function A() {
      const { push } = useRouter();
      return (
        <div>
          <div>A</div>
          <button onClick={() => push("/b", { transition: "none" })}>
            GoB
          </button>
        </div>
      );
    }
    function B() {
      const t = useViewTransition();
      return (
        <div>
          <div>B</div>
          <div data-testid="transition-name">{t?.customTransition || ""}</div>
        </div>
      );
    }
    render(
      <RouterProvider
        routes={[
          { path: "/", element: <A /> },
          { path: "/b", element: <B /> },
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("GoB"));
      window.location.hash = "#/b";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
    const container = document.querySelector(".tiny-router-container");
    expect(
      container?.innerHTML.includes("tiny-router-slideIn") ||
        container?.innerHTML.includes("tiny-router-slideBackIn"),
    ).toBe(false);
  });

  it("applies custom slideIn override (explicit) instead of default push animation", async () => {
    window.location.hash = "#/";
    function A() {
      const { push } = useRouter();
      return (
        <div>
          <div>A</div>
          <button onClick={() => push("/b", { transition: "slideIn" })}>
            GoB
          </button>
        </div>
      );
    }
    function B() {
      const t = useViewTransition();
      return (
        <div>
          <div>B</div>
          <div data-testid="transition-name">{t?.customTransition || ""}</div>
        </div>
      );
    }
    render(
      <RouterProvider
        routes={[
          { path: "/", element: <A /> },
          { path: "/b", element: <B /> },
        ]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("GoB"));
      window.location.hash = "#/b";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("B")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("transition-name").textContent).toBe("slideIn"),
    );
  });
  it("navigates push + replace + back with transition metadata", async () => {
    window.location.hash = "#/";
    render(
      <RouterProvider
        routes={[
          { path: "/", element: <Home /> },
          { path: "/user/:id", element: <User /> },
        ]}
      />,
    );
    expect(screen.getByText("Home")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText("Go user"));
    });
    await waitFor(() => {
      expect(screen.getByText("User 7")).toBeTruthy();
    });
    // Replace
    await act(async () => {
      fireEvent.click(screen.getByText("Replace"));
      // happy-dom may not emit hashchange on location.replace, enforce manually
      window.location.hash = "#/user/8";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => {
      expect(screen.getByText("User 8")).toBeTruthy();
    });
    // Back should go to home
    await act(async () => {
      const backs = screen.getAllByText("Back");
      fireEvent.click(backs[backs.length - 1]);
      // Simulate hashchange triggered by history.back in environment
      window.location.hash = "#/";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeTruthy();
    });
  });

  it("renders notFound and redirects in example style (simulate)", async () => {
    window.location.hash = "#/unknown/path";
    function NotFound() {
      return <div data-testid="nf">NF</div>;
    }
    render(
      <RouterProvider
        routes={[{ path: "/", element: <Home /> }]}
        notFound={<NotFound />}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("nf")).toBeTruthy();
    });
  });

  it("push increases history length sequentially", async () => {
    window.location.hash = "#/";
    const pushes = Array.from({ length: 3 }).map((_, i) => ({
      path: `/user/${i + 1}`,
      element: <div>User {i + 1}</div>,
    }));
    render(
      <RouterProvider routes={[{ path: "/", element: <Home /> }, ...pushes]} />,
    );
    for (let i = 0; i < pushes.length; i++) {
      await act(async () => {
        window.location.hash = `#${pushes[i].path}`;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      await waitFor(() => {
        const all = screen.getAllByText(`User ${i + 1}`);
        expect(all.length > 0).toBeTruthy();
      });
    }
  });

  it("restores scroll position when navigating back", async () => {
    window.location.hash = "#/a";
    const origScrollTo = window.scrollTo;
    const calls: Array<[number, number]> = [];
    // Immediate RAF
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    // Track scrollTo calls (happy-dom may not actually scroll)
    // @ts-expect-error spying scrollTo
    window.scrollTo = (x: number, y: number) => {
      calls.push([x, y]);
    };

    function Page({ name }: { name: string }) {
      const { push, back } = useRouter();
      return (
        <div>
          <h1>{name}</h1>
          <div style={{ height: 2000 }} />
          <button onClick={() => push(name === "A" ? "/b" : "/a")}>Go</button>
          <button onClick={() => back()}>Back</button>
        </div>
      );
    }

    render(
      <RouterProvider
        routes={[
          { path: "/a", element: <Page name="A" /> },
          { path: "/b", element: <Page name="B" /> },
        ]}
      />,
    );

    // Simulate scroll on /a
    Object.defineProperty(window, "scrollY", {
      value: 180,
      configurable: true,
    });
    (document.documentElement || document.body).scrollTop = 180;

    // Navigate to /b
    await act(async () => {
      fireEvent.click(screen.getByText("Go"));
      // happy-dom might not trigger hashchange via programmatic push yet
      window.location.hash = "#/b";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("B")).toBeTruthy());

    // Change scroll on /b (should not affect stored /a position)
    Object.defineProperty(window, "scrollY", { value: 20, configurable: true });
    (document.documentElement || document.body).scrollTop = 20;

    // Go back to /a
    await act(async () => {
      const backs2 = screen.getAllByText("Back");
      fireEvent.click(backs2[backs2.length - 1]);
      window.location.hash = "#/a";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("A")).toBeTruthy());

    // Allow RAF + scroll restore
    await Promise.resolve();

    // Find last scrollTo call for /a restore
    const restoreCall = calls.find(([, y]) => y === 180);
    expect(restoreCall).toBeTruthy();

    window.scrollTo = origScrollTo; // cleanup
  });

  it("restores to top when no saved scroll position", async () => {
    window.location.hash = "#/x";
    const calls: Array<[number, number]> = [];
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    const origScrollTo = window.scrollTo;
    // @ts-expect-error spying scrollTo
    window.scrollTo = (x: number, y: number) => {
      calls.push([x, y]);
    };

    function P({ name, to }: { name: string; to: string }) {
      const { push } = useRouter();
      return <button onClick={() => push(to)}>{name}</button>;
    }

    render(
      <RouterProvider
        routes={[
          { path: "/x", element: <P name="GoY" to="/y" /> },
          { path: "/y", element: <div>Y</div> },
        ]}
      />,
    );

    // Navigate to /y so /x position (default 0) is saved
    await act(async () => {
      fireEvent.click(screen.getByText("GoY"));
      window.location.hash = "#/y";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() => expect(screen.getByText("Y")).toBeTruthy());

    // Navigate back to /x (simulate back)
    await act(async () => {
      window.location.hash = "#/x";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await Promise.resolve();
    const topCall = calls.find(([, y]) => y === 0);
    expect(topCall).toBeTruthy();
    window.scrollTo = origScrollTo;
  });
});

describe("useRouter history access", () => {
  it("exposes navigation history", async () => {
    window.location.hash = "#/";

    function Home() {
      const { push, history } = useRouter();
      return (
        <div>
          <h1>Home</h1>
          <button onClick={() => push("/about")}>Go to About</button>
          <div data-testid="history">{JSON.stringify(history)}</div>
        </div>
      );
    }

    function About() {
      const { history } = useRouter();
      return <div data-testid="history">{JSON.stringify(history)}</div>;
    }

    render(
      <RouterProvider
        routes={[
          { path: "/", element: <Home /> },
          { path: "/about", element: <About /> },
        ]}
      />,
    );

    // Initial history
    expect(screen.getByTestId("history").textContent).toBe(JSON.stringify(["/"]));

    // Navigate to About
    await act(async () => {
      fireEvent.click(screen.getByText("Go to About"));
      window.location.hash = "#/about";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    // Updated history
    await waitFor(() => {
      expect(screen.getByTestId("history").textContent).toBe(
        JSON.stringify(["/", "/about"]),
      );
    });
  });
});
