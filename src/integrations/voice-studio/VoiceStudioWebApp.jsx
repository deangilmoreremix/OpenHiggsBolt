/**
 * VoiceStudio component-mode entrypoint for SmartVideo GO.
 *
 * Mounts the upstream VoiceStudio React application directly into the host
 * React tree without iframe isolation or a second createRoot().
 *
 * Canonical upstream source: vendor/VoiceStudio/frontend/src/
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyVoiceStudioTheme, clearVoiceStudioTheme } from './theme.js';
import { setVoiceStudioApiBase } from './api.js';

// Set the API override before any upstream module executes its own resolution.
// This must happen at module-body time, before App.jsx imports api/client.ts.
setVoiceStudioApiBase('/api/voice');

// VoiceStudio expects `__APP_VERSION__` to be injected at build time by Vite.
// Define it here for the web runtime so version-dependent UI (About, bug
// report, first-run notes) can read it without crashing.
if (typeof window !== 'undefined' && typeof window.__APP_VERSION__ === 'undefined') {
  window.__APP_VERSION__ = '0.5.2';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function VoiceStudioWebApp(props) {
  const [AppComponent, setAppComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    applyVoiceStudioTheme();
    return () => clearVoiceStudioTheme();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        console.log('[VoiceStudio] bootstrap start');

        // Best-effort web-only setup. These are optional and gracefully skipped
        // when absent, so they never block the first paint.
        const installers = [
          ['webCompat', 'vendor/VoiceStudio/frontend/src/utils/webCompat.js', 'installWebCompat'],
          ['audioUnlock', 'vendor/VoiceStudio/frontend/src/utils/audioUnlock.js', 'installAudioUnlock'],
          ['consoleCapture', 'vendor/VoiceStudio/frontend/src/utils/consoleBuffer.js', 'installConsoleCapture'],
          ['globalErrorHandlers', 'vendor/VoiceStudio/frontend/src/utils/globalErrorHandlers.js', 'installGlobalErrorHandlers'],
        ];

        for (const [name, modPath, exportName] of installers) {
          try {
            const mod = await import(modPath);
            mod[exportName]?.();
            console.log(`[VoiceStudio] ${name} installed`);
          } catch (e) {
            console.warn(`[VoiceStudio] ${name} skipped:`, e);
          }
        }

        // Load upstream side-effect modules so their initialization runs before
        // the app shell mounts. These are not strictly required for the first
        // paint, but completing them here prevents race conditions during the
        // first user interaction.
        try {
          await import('vendor/VoiceStudio/frontend/src/i18n/index.ts');
          console.log('[VoiceStudio] i18n loaded');
        } catch (e) {
          console.warn('[VoiceStudio] i18n skipped:', e);
        }
        try {
          await import('vendor/VoiceStudio/frontend/src/ui/index.js');
          console.log('[VoiceStudio] ui loaded');
        } catch (e) {
          console.warn('[VoiceStudio] ui skipped:', e);
        }

        // Load the store so persistence can be configured before App renders.
        const storeModule = await import('vendor/VoiceStudio/frontend/src/store/index.ts');
        console.log('[VoiceStudio] store loaded');

        // Persistence setup mirrors upstream bootstrapApp() for the web runtime.
        // configurePersistenceRole('main') marks this as the primary document
        // store; the widget window uses 'readonly'.
        const persistenceUtils = await import('vendor/VoiceStudio/frontend/src/utils/coalescedJsonStorage.ts');
        const { configurePersistenceRole, installPersistenceLifecycleFlush } = persistenceUtils;
        
        let installLongformPersistenceLifecycleFlush;
        try {
          const longformMod = await import('vendor/VoiceStudio/frontend/src/utils/longformPersistence.ts');
          installLongformPersistenceLifecycleFlush = longformMod.installLongformPersistenceLifecycleFlush;
        } catch (e) {
          console.warn('[VoiceStudio] longform persistence skipped:', e);
        }

        let installDesktopPersistenceExitHandshake;
        try {
          const exitMod = await import('vendor/VoiceStudio/frontend/src/utils/persistenceLifecycle.ts');
          installDesktopPersistenceExitHandshake = exitMod.installDesktopPersistenceExitHandshake;
        } catch (e) {
          console.warn('[VoiceStudio] desktop exit handshake skipped:', e);
        }

        configurePersistenceRole('main');
        await storeModule.useAppStore.persist.rehydrate();
        installPersistenceLifecycleFlush();
        installLongformPersistenceLifecycleFlush?.();
        // Desktop-only: returns a no-op cleanup in non-Tauri contexts.
        installDesktopPersistenceExitHandshake?.();
        console.log('[VoiceStudio] persistence configured');

        // Load the actual upstream App component after all prerequisites are
        // ready. Dynamic import guarantees api/client.ts sees the override.
        const appModule = await import('vendor/VoiceStudio/frontend/src/App.jsx');
        console.log('[VoiceStudio] App loaded');
        if (!cancelled) {
          setAppComponent(() => appModule.default);
        }
      } catch (e) {
        console.error('[VoiceStudio] bootstrap failed:', e);
        if (!cancelled) setError(e);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050505] text-[#a1a1aa]">
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0a0a0a] p-6 text-center">
          <p className="mb-2 text-sm font-semibold text-[#22d3ee]">VoiceStudio failed to initialize</p>
          <p className="text-xs text-[#52525b]">{error?.message || 'Unknown error'}</p>
          <pre className="mt-2 text-left text-xs text-red-400 overflow-auto max-h-40">{error?.stack}</pre>
        </div>
      </div>
    );
  }

  if (!AppComponent) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22d3ee] border-t-transparent" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppComponent {...props} />
    </QueryClientProvider>
  );
}
