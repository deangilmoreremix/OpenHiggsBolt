'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { ENTITLEMENTS, isSuperUserEmail, type AccessState, type AccessResult } from '@/access/entitlements';

export { ENTITLEMENTS };

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
  /**
   * True when the user may USE features behind this entitlement. Base
   * SmartVideo GO studios follow isPaid; GO-Viral (smartvideo_viral) is a
   * separate paid upgrade that must be bought on its own.
   */
  hasEntitlement: (entitlement: string) => boolean;
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

  // When the access check itself fails (e.g. the server times out), a
  // signed-in user keeps base SmartVideo GO access — every signed-in user has
  // it by default — instead of being dropped into Preview Mode. Paid upgrades
  // (GO-Viral) stay locked unless the user is the super user.
  const signedInFallback = useCallback((): AccessResult => {
    const emails = (user?.emailAddresses || []).map((e) => e?.emailAddress || '');
    const superUser = emails.some((e) => isSuperUserEmail(e));
    return {
      state: 'paid',
      access: {
        clerkUserId: user?.id || '',
        email: emails[0] || '',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'fallback',
        hasSmartVideoGo: true,
        hasSmartVideoViral: superUser,
        isSuperUser: superUser,
      },
    };
  }, [user?.id, user?.emailAddresses]);

  const refreshAccess = useCallback(async () => {
    if (!isSignedIn) {
      setAccessResult({ state: 'signed_out' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/access/resolve', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setAccessResult(data);
      } else {
        setAccessResult(signedInFallback());
      }
    } catch (err) {
      console.error('[SmartVideoAccess] Failed to resolve access:', err);
      setAccessResult(signedInFallback());
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, signedInFallback]);

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

  const hasEntitlement = useCallback(
    (entitlement: string) => {
      if (isSuperUser) return true;
      if (entitlement === ENTITLEMENTS.SMARTVIDEO_VIRAL || entitlement === 'go-ai-viral') {
        return hasSmartVideoViral;
      }
      return isPaid;
    },
    [isPaid, isSuperUser, hasSmartVideoViral]
  );

  const requireEntitlement = useCallback(
    async function requireEntitlement<T>(
      entitlement: string,
      onAllowed: () => T | Promise<T>,
      onDenied?: () => void
    ): Promise<T | undefined> {
      if (hasEntitlement(entitlement)) {
        return await onAllowed();
      } else {
        onDenied?.();
        setUpgradeModal({ isOpen: true, source: entitlement });
        return undefined;
      }
    },
    [hasEntitlement, setUpgradeModal]
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
        hasEntitlement,
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
    hasEntitlement: () => true,
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
    hasEntitlement: () => true,
    requireEntitlement: async (_entitlement, onAllowed) => onAllowed(),
    openUpgradeModal: () => {},
    restoreAccess: async () => ({ status: 'error', message: 'Access provider unavailable.' }),
    upgradeModal: { isOpen: false, source: 'default' },
    setUpgradeModal: () => {},
  };
}
