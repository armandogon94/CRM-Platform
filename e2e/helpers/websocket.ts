import path from 'node:path';
import type { Browser, BrowserContext, Page } from '@playwright/test';

/**
 * Second-browser-context helper for WebSocket real-time assertions
 * (Slice 19 C5).
 *
 * The D2 / D3 specs need to prove that when user A mutates the board
 * (create item, change column value, etc.) a second subscribed client
 * receives the corresponding Socket.io event. Rather than repeating
 * context-open + storageState + frame-capture boilerplate in every
 * spec, this helper opens a fresh pre-authenticated context, navigates
 * it to a board page, and exposes:
 *
 *   - `page`     — the second context's page (for UI assertions)
 *   - `events`   — a live-updated array of Socket.io events observed
 *                  on any WebSocket attached to the page
 *   - `waitForEvent(type, …)` — poll helper for deterministic waits
 *   - `dispose()` — closes the context (idempotent)
 *
 * Event capture taps `page.on('websocket')` → `ws.on('framereceived')`
 * so we catch frames emitted by the frontend's own socket.io-client
 * without injecting scripts. Socket.io v4 wraps messages in an
 * engine.io packet of the form `4<sioPacketType><JSON…>`; we only
 * decode the common message packet (engine.io type 4, sio type 2).
 */

const DEFAULT_AUTH_STATE = path.resolve(__dirname, '../.auth/novapay.json');

export interface CapturedEvent {
  type: string;
  payload: unknown;
  receivedAt: number;
}

export interface WaitForEventOptions {
  /** Max wall-time to wait for a matching event. Default 5s. */
  timeoutMs?: number;
  /** Optional predicate that an event must satisfy to count as a match. */
  match?: (event: CapturedEvent) => boolean;
}

export interface WebSocketClient {
  page: Page;
  context: BrowserContext;
  events: CapturedEvent[];
  waitForEvent(type: string, options?: WaitForEventOptions): Promise<CapturedEvent>;
  dispose(): Promise<void>;
}

export interface WebSocketClientOptions {
  /** Override the persisted auth state file. Defaults to `.auth/novapay.json`. */
  storageState?: string;
}

/**
 * Opens a second browser context authenticated as the e2e user,
 * installs a WebSocket frame listener, and navigates the context to
 * the given board path. Returns a `{ page, events, waitForEvent,
 * dispose }` handle.
 */
export async function websocketClient(
  browser: Browser,
  boardPath: string,
  options: WebSocketClientOptions = {}
): Promise<WebSocketClient> {
  const context = await browser.newContext({
    storageState: options.storageState ?? DEFAULT_AUTH_STATE,
  });
  const page = await context.newPage();
  const events: CapturedEvent[] = [];

  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      const raw = frame.payload;
      if (typeof raw !== 'string') return;

      // Socket.io v4 message frames look like `42["item:created",{…}]`.
      // Engine.io packet type 4 = message, followed by Socket.io packet
      // type 2 = event (0=connect, 1=disconnect, 3=ack, 4=error, etc.).
      // Anything else (heartbeats, acks, binary) is noise for us.
      const match = raw.match(/^42(?:\/[^,]*,)?(\[.+\])$/s);
      if (!match) return;

      try {
        const parsed = JSON.parse(match[1]) as unknown;
        if (
          Array.isArray(parsed) &&
          parsed.length >= 1 &&
          typeof parsed[0] === 'string'
        ) {
          events.push({
            type: parsed[0],
            payload: parsed.length > 1 ? parsed[1] : undefined,
            receivedAt: Date.now(),
          });
        }
      } catch {
        // Malformed frame — ignore.
      }
    });
  });

  // Fail early if the navigation blows up; better than a timeout
  // further downstream when a spec tries to use `client.page`.
  await page.goto(boardPath);

  const waitForEvent: WebSocketClient['waitForEvent'] = async (
    type,
    { timeoutMs = 5_000, match: predicate } = {}
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const found = events.find(
        (e) => e.type === type && (!predicate || predicate(e))
      );
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const observed = events.length
      ? events.map((e) => e.type).join(', ')
      : 'none';
    throw new Error(
      `websocketClient: timed out after ${timeoutMs}ms waiting for '${type}' ` +
        `(observed events: ${observed})`
    );
  };

  let disposed = false;
  const dispose: WebSocketClient['dispose'] = async () => {
    if (disposed) return;
    disposed = true;
    await context.close().catch(() => {
      /* already closed — idempotent */
    });
  };

  return { page, context, events, waitForEvent, dispose };
}
