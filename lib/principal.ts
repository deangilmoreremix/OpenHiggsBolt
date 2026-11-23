import { AsyncLocalStorage } from 'node:async_hooks';
import { auth as clerkAuth } from '@clerk/nextjs/server';

/**
 * Who a server request acts for.
 *
 * Normally that is the Clerk session. The MCP gateway (app/api/mcp-gateway) has already verified an MCP key that belongs to a
 * user and then runs the app's own route handlers for that user: it does so inside `runAs`, and the handlers' identity lookups
 * (`authOrPrincipal`) see that user. The principal lives in AsyncLocalStorage, which only code running in this process can set:
 * a request header, cookie or body can never create one. With no principal set, behaviour is exactly Clerk's `auth()`.
 */
export type Principal = { userId: string };

const store = new AsyncLocalStorage<Principal>();

export function runAs<T>(principal: Principal, fn: () => T): T {
  if (!principal?.userId || typeof principal.userId !== 'string') throw new Error('runAs needs a user id');
  return store.run({ userId: principal.userId }, fn);
}

export function currentPrincipal(): Principal | undefined {
  return store.getStore();
}

/** Drop-in for Clerk's `auth()` where only the user id is needed. */
export async function authOrPrincipal(): Promise<{ userId: string | null }> {
  const p = store.getStore();
  if (p) return { userId: p.userId };
  const { userId } = await clerkAuth();
  return { userId: userId ?? null };
}
