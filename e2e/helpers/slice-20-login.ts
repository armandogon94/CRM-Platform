import { type Page } from '@playwright/test';
import { API_BASE_URL, type IndustryFixture } from '../fixtures/slice-20-industries';

/**
 * Slice 20 login helper (shared by D1/D2/D3 specs).
 *
 * The Slice 19 auth-setup path writes a storageState file specifically
 * for NovaPay (see e2e/auth.setup.ts + playwright.config.ts). Slice 20
 * specs fan out across 3 industries on different ports, so reusing that
 * single storageState doesn't work — each industry has its own token
 * key and its own backend session state.
 *
 * Cheapest reliable path: hit the backend's /auth/login endpoint
 * directly via page.request (no UI keystrokes), stash the token under
 * the industry's localStorage key via addInitScript, then page.goto
 * picks up an authenticated session from the first request.
 *
 * This helper returns the access token so afterEach hooks can issue
 * REST cleanup calls without re-logging-in.
 */

export interface Session {
  accessToken: string;
  user: {
    id: number;
    workspaceId: number;
    email: string;
    role: string;
  };
}

export async function loginAsAdmin(
  page: Page,
  industry: IndustryFixture
): Promise<Session> {
  // 1. Authenticate via REST to get the JWT without UI interaction.
  const res = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email: industry.adminEmail,
      password: industry.adminPassword,
    },
  });
  if (!res.ok()) {
    throw new Error(
      `loginAsAdmin(${industry.slug}) failed: ${res.status()} ${await res.text()}`
    );
  }
  const body = (await res.json()) as {
    success: boolean;
    data?: { user: Session['user']; accessToken: string };
    error?: string;
  };
  if (!body.success || !body.data) {
    throw new Error(
      `loginAsAdmin(${industry.slug}) non-success: ${body.error ?? 'unknown'}`
    );
  }

  // 2. Seed the industry-specific localStorage key BEFORE any script on
  //    the page runs — addInitScript fires before document parse so the
  //    industry's AuthContext reads an already-populated token on mount.
  await page.addInitScript(
    ({ key, token }: { key: string; token: string }) => {
      window.localStorage.setItem(key, token);
    },
    { key: industry.tokenKey, token: body.data.accessToken }
  );

  return { accessToken: body.data.accessToken, user: body.data.user };
}

export async function deleteItem(
  page: Page,
  itemId: number,
  accessToken: string
): Promise<void> {
  // Flat DELETE /items/:id shim landed in Slice 20 A2.5.
  await page.request.delete(`${API_BASE_URL}/items/${itemId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
