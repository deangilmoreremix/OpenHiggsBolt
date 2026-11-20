'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { ENTITLEMENTS, type AccessState, type AccessResult } from '@/access/entitlements';

export { ENTITLEMENTS };

/** GO-Viral is one of the two paid apps; everything else is base access. */
export function isGoViralEntitlement(entitlement: string): boolean {
  return (
    entitlement === 'go-ai-viral' ||
    entitlement === ENTITLEMENTS.SMARTVIDEO_VIRAL ||
    entitlement === ENTITLEMENTS.GO_VIRAL_AI
  );
}

interface SmartVideoAccessContextValue {
  accessResult: AccessResult;
  accessState: AccessState | null;
  isLoading: boolean;
  isPaid: boolean;
  isAuthenticatedUnpaid: boolean;
  isSignedOut: boolean;
  isSignedIn: boolean | undefined;
  hasSmartVideoViral: boolean;
  isSuperUser: boolean;
  requireEntitlement: <T>(
    entitlement: string,
    onAllowed: () => T | Promise<T>,
    onDenied?: () => void
  ) => Promise<T | undefined>;
  openUpgradeModal: (source?: string) => void;
  restoreAccess: (email: string) => Promise<{ status: string; message?: string }>;
  upgradeModal: { isOpen: boolean; source: string };
  setUpgradeModal: (modal: { isOpen: boolean; source: string }) => void;
}

const SmartVideoAccessContext = createContext<SmartVideoAccessContextValue | null>(null);

export { SmartVideoAccessContext };

export function SmartVideoAccessProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [accessResult, setAccessResult] = useState<AccessResult>({ state: 'signed_out' });
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, source: 'default' });

  const refreshAccess = useCallback(async () => {
    if (!isSignedIn) {
      setAccessResult({ state: 'signed_out' });
      setIsLoading(false);
      return;
    }

    // Every signed-in user has base access to all apps except the two paid
    // ones, so a failed or slow check must never drop them into preview mode.
    // Try twice, then fall back to base access with the paid apps locked; the
    // API routes still check every request on the server.
    const baseAccessFallback: AccessResult = {
      state: 'paid',
      access: {
        clerkUserId: user?.id || '',
        email: user?.emailAddresses?.[0]?.emailAddress || '',
        entitlements: { smartvideo_go: true },
        status: 'inactive',
        source: 'fallback',
        hasSmartVideoGo: true,
        hasSmartVideoViral: false,
        isSuperUser: false,
      },
    };

    let resolved: AccessResult | null = null;
    for (let attempt = 0; attempt < 2 && !resolved; attempt += 1) {
      try {
        const res = await fetch('/api/access/resolve', { credentials: 'same-origin' });
        if (res.ok) {
          resolved = (await res.json()) as AccessResult;
        }
      } catch (err) {
        console.error('[SmartVideoAccess] Failed to resolve access:', err);
      }
    }

    try {
      setAccessResult(resolved ?? baseAccessFallback);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, user?.emailAddresses]);

  useEffect(() => {
    if (isLoaded) {
      refreshAccess();
    }
  }, [isLoaded, refreshAccess]);

  const accessState = accessResult.state === 'signed_out' ? null : accessResult.access;
  const isPaid = accessResult.state === 'paid';
  const isAuthenticatedUnpaid = accessResult.state === 'authenticated_unpaid';
  const isSignedOut = accessResult.state === 'signed_out';
  const isSignedInBoolean = Boolean(isSignedIn);
  const hasSmartVideoViral = Boolean(accessState?.hasSmartVideoViral);
  const isSuperUser = Boolean(accessState?.isSuperUser);

  const requireEntitlement = useCallback(
    async function requireEntitlement<T>(
      entitlement: string,
      onAllowed: () => T | Promise<T>,
      onDenied?: () => void
    ): Promise<T | undefined> {
      const allowed = isGoViralEntitlement(entitlement)
        ? hasSmartVideoViral || isSuperUser
        : isPaid;
      if (allowed) {
        return await onAllowed();
      } else {
        onDenied?.();
        setUpgradeModal({ isOpen: true, source: entitlement });
        return undefined;
      }
    },
    [isPaid, hasSmartVideoViral, isSuperUser, setUpgradeModal]
  );

  const openUpgradeModal = useCallback((source?: string) => {
    setUpgradeModal({ isOpen: true, source: source || 'default' });
  }, [setUpgradeModal]);

  const restoreAccess = useCallback(
    async (email: string) => {
      if (!user?.id) return { status: 'error', message: 'Not authenticated.' };
      try {
        const res = await fetch('/api/access/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          setTimeout(() => refreshAccess(), 500);
        }
        return data;
      } catch {
        return { status: 'error', message: 'Network error' };
      }
    },
    [user?.id, refreshAccess]
  );

  return (
    <SmartVideoAccessContext.Provider
      value={{
        accessResult,
        accessState,
        isLoading,
        isPaid,
        isAuthenticatedUnpaid,
        isSignedOut,
        isSignedIn: isSignedInBoolean,
        hasSmartVideoViral,
        isSuperUser,
        requireEntitlement,
        openUpgradeModal,
        restoreAccess,
        upgradeModal,
        setUpgradeModal,
      }}
    >
      {children}
    </SmartVideoAccessContext.Provider>
  );
}

export function NoClerkSmartVideoAccessProvider({ children }: { children: React.ReactNode }) {
  const emptyContext: SmartVideoAccessContextValue = {
    accessResult: { state: 'signed_out' },
    accessState: null,
    isLoading: false,
    isPaid: false,
    isAuthenticatedUnpaid: false,
    isSignedOut: true,
    isSignedIn: false,
    hasSmartVideoViral: false,
    isSuperUser: false,
    requireEntitlement: async (_entitlement, onAllowed) => {
      return await onAllowed();
    },
    openUpgradeModal: () => {},
    restoreAccess: async () => ({ status: 'error', message: 'Clerk is not configured.' }),
    upgradeModal: { isOpen: false, source: 'default' },
    setUpgradeModal: () => {},
  };

  return (
    <SmartVideoAccessContext.Provider value={emptyContext}>
      {children}
    </SmartVideoAccessContext.Provider>
  );
}

export function useSmartVideoAccess(): SmartVideoAccessContextValue {
  const context = useContext(SmartVideoAccessContext);
  if (context) return context;
  // Provider missing (e.g. dev environment with Clerk bypass, or a
  // component rendered outside the layout's provider). Return a safe
  // no-op default instead of crashing the page so the rest of the
  // app — including the API key input and studio generation — still works.
  return {
    accessResult: { state: 'signed_out' },
    accessState: null,
    isLoading: false,
    isPaid: false,
    isAuthenticatedUnpaid: false,
    isSignedOut: true,
    isSignedIn: false,
    hasSmartVideoViral: false,
    isSuperUser: false,
    requireEntitlement: async (_entitlement, onAllowed) => onAllowed(),
    openUpgradeModal: () => {},
    restoreAccess: async () => ({ status: 'error', message: 'Access provider unavailable.' }),
    upgradeModal: { isOpen: false, source: 'default' },
    setUpgradeModal: () => {},
  };
}
