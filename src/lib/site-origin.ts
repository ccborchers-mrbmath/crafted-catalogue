import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

// createServerFn splits this handler out of the client bundle, so it's safe
// for it to depend on request/Node-only APIs that don't exist in the browser.
const getServerOrigin = createServerFn({ method: "GET" }).handler(async () => {
  return getRequestUrl().origin;
});

/**
 * Origin of the current request. On the client this is synchronous and free;
 * on the server it reads the incoming request. Safe to call from an
 * isomorphic route loader (runs on the server for the initial SSR request,
 * on the client for subsequent navigations).
 */
export async function getSiteOrigin(): Promise<string> {
  if (typeof window !== "undefined") return window.location.origin;
  return getServerOrigin();
}
