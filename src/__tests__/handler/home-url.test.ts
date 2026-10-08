// A deployment can send signed-out visitors of the bare domain to its own
// site (HOME_URL) instead of the landing page. A signed-in operator still
// lands on the dashboard, and short links resolve as before.
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { env, createExecutionContext } from "cloudflare:test";
import worker from "../../index";
import { applyMigrations, resetData } from "../setup";
import type { Env } from "../../types";

beforeAll(applyMigrations);
beforeEach(resetData);

const HOME = "https://www.example.org";

/** A deployment: no DEV_MODE, so no unverified identity signs anyone in. */
function deployedEnv(overrides: Partial<Env> = {}): Env {
  return { ...env, DEV_MODE: undefined, DEV_IDENTITY: undefined, ...overrides } as Env;
}

async function get(e: Env, path: string, headers: Record<string, string> = {}): Promise<Response> {
  return worker.fetch(
    new Request(`https://shrtnr.test${path}`, { redirect: "manual", headers }),
    e,
    createExecutionContext(),
  );
}

describe("HOME_URL", () => {
  it("redirects a signed-out visitor of / to HOME_URL with a 302", async () => {
    const res = await get(deployedEnv({ HOME_URL: HOME }), "/");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(HOME);
  });

  it("serves the landing page when HOME_URL is unset", async () => {
    const res = await get(deployedEnv(), "/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("URL SHORTENER");
  });

  it("still sends a signed-in operator to the dashboard", async () => {
    const res = await get({ ...env, HOME_URL: HOME } as Env, "/", { Cookie: "dev_identity=alice%40example.com" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/_/admin/dashboard");
  });

  it("does not touch the short link catch-all", async () => {
    const res = await get(deployedEnv({ HOME_URL: HOME }), "/no-such-slug");
    expect(res.status).toBe(404);
  });
});
