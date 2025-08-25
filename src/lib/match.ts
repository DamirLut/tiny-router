import type { RouteConfig, RouteParams } from "./types";

interface CompiledRoute {
  route: RouteConfig;
  keys: string[];
  regex: RegExp;
}
const compiledCache = new WeakMap<RouteConfig, CompiledRoute>();

function compile(route: RouteConfig): CompiledRoute {
  const existing = compiledCache.get(route);
  if (existing) return existing;
  const keys: string[] = [];
  let pattern = route.path === "/" ? "/" : route.path.replace(/\/$/, "");
  pattern = pattern.replace(/:([A-Za-z0-9_]+)/g, (_: string, key: string) => {
    keys.push(key);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${pattern}$`);
  const compiled: CompiledRoute = { route, keys, regex };
  compiledCache.set(route, compiled);
  return compiled;
}

export function matchRoute(
  path: string,
  routes: RouteConfig[],
): [RouteConfig | undefined, RouteParams] {
  const cleaned = path === "/" ? "/" : path.replace(/\/$/, "");
  for (const route of routes) {
    const c = compile(route);
    const match = c.regex.exec(cleaned);
    if (match) {
      const params: RouteParams = {};
      c.keys.forEach((k, i) => {
        params[k] = decodeURIComponent(match[i + 1]);
      });
      return [route, params];
    }
  }
  return [undefined, {}];
}
