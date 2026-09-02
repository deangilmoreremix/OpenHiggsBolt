'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { useClerk, useAuth } from '@clerk/nextjs';
import ApiKeyModal from './ApiKeyModal';
import { SocialPublishProvider } from '@/components/SocialPublishProvider';
import { AiAssistantProvider } from '@/components/AiAssistantProvider';
import { useAuthConfig } from '@/lib/authConfig';

// Lazily load the heavy `studio` package so its many studio modules are not
// part of the initial bundle for /, /studio and /workflow. Each export is only
// fetched when its tab becomes active.
const loadStudio = (name) => dynamic(() => import('studio').then((m) => m[name]), { ssr: false });

const ImageStudio = loadStudio('ImageStudio');
const VideoStudio = loadStudio('VideoStudio');
const ClippingStudio = loadStudio('ClippingStudio');
const VibeMotionStudio = loadStudio('VibeMotionStudio');
const LipSyncStudio = loadStudio('LipSyncStudio');
const CinemaStudio = loadStudio('CinemaStudio');
const AudioStudio = loadStudio('AudioStudio');
const MarketingStudio = loadStudio('MarketingStudio');
const RecastStudio = loadStudio('RecastStudio');
const WorkflowStudio = loadStudio('WorkflowStudio');
const AgentStudio = loadStudio('AgentStudio');
const AppsStudio = loadStudio('AppsStudio');
const McpCliStudio = loadStudio('McpCliStudio');
const AiInfluencerStudio = loadStudio('AiInfluencerStudio');
const LayersStudio = loadStudio('LayersStudio');

const DesignAgentStudio = dynamic(() => import('../src/apps/design-agent/DesignAgent'), { ssr: false });
const VFXStudio = dynamic(() => import('../src/apps/vfx-studio/VFXStudio'), { ssr: false });
const GoAiViralStudio = dynamic(() => import('../src/apps/go-ai-viral/GoAiViralStudio'), { ssr: false });
const Storyboard = dynamic(() => import('../src/apps/storyboard/Storyboard'), { ssr: false });
const ThumbnailStudio = dynamic(() => import('../src/apps/thumbnail-studio/ThumbnailStudio'), { ssr: false });
const SocialPublishing = dynamic(() => import('../src/apps/social-publishing/SocialPublishing'), { ssr: false });
const TABS = [
  { id: 'image',   label: 'Image Studio' },
  { id: 'video',   label: 'Video Studio' },
  { id: 'audio',   label: 'Audio Studio' },
  { id: 'clipping', label: 'AI Clipping' },
  { id: 'vibe-motion', label: 'Vibe Motion' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema',  label: 'Cinema Studio' },
  { id: 'storyboard', label: 'Storyboard' },
  { id: 'marketing', label: 'Marketing Studio' },
  { id: 'recast', label: 'Body Swap' },
  { id: 'layers', label: 'Layers Studio' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'agents', label: 'Agents' },
  { id: 'design-agent', label: 'Design Agent AI' },
  { id: 'vfx-studio', label: 'VFX' },
  { id: 'thumbnail-studio', label: 'Thumbnail Studio' },
  { id: 'apps', label: 'Explore Apps' },
  { id: 'mcp-cli', label: 'MCP / CLI' },
  { id: 'ai-influencer', label: 'AI Influencer Studio' },
  { id: 'social-publishing', label: 'Social Publishing' },
  { id: 'go-ai-viral', label: 'GO-Viral' },
];

// Maps every landing-page studio slug to the studio tab that renders it.
const SLUG_TO_TAB = {
  image: 'image', video: 'video', audio: 'audio', clipping: 'clipping',
  'vibe-motion': 'vibe-motion', lipsync: 'lipsync', cinema: 'cinema',
  storyboard: 'storyboard', marketing: 'marketing', recast: 'recast', layers: 'layers',
  workflows: 'workflows', agents: 'agents', 'design-agent': 'design-agent',
  'vfx-studio': 'vfx-studio',
  'music-studio': 'audio', 'thumbnail-studio': 'thumbnail-studio',
  apps: 'apps', 'mcp-cli': 'mcp-cli',
  'ai-influencer': 'ai-influencer',
  'social-publishing': 'social-publishing',
  'go-ai-viral': 'go-ai-viral',
};

export default function StandaloneShell({ embedded = false, initialTab = null, demoMode = false, templateData = null } = {}) {
  const params = useParams();
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const auth = useAuthConfig();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow') || slug.includes('workflows')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    const firstSegment = slug[0];
    return (firstSegment && SLUG_TO_TAB[firstSegment]) || 'image';
  };
  
  const { apiKey, openaiKey, setApiKey, setOpenAiKey, clearApiKey, clearOpenAiKey, hasApiKey, hasOpenAiKey } = auth;
  const [activeTab, setActiveTab] = useState(initialTab || getInitialTab());

  useEffect(() => {
    if (embedded) return;
    if (activeTab === 'brand-studio') {
      router.push('/brand-studio');
    }
  }, [activeTab, router, embedded]);

  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  // First-login API key popup — shown once when the user has no key on this
  // device and none saved to their account. Uses the on-brand ApiKeyModal.
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [settingsKeyInput, setSettingsKeyInput] = useState('');
  const [settingsOpenaiInput, setSettingsOpenaiInput] = useState('');
  const settingsClosedAt = useRef(0);
  const [authError, setAuthError] = useState(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Sync tab with URL if user navigates manually or via browser back/forward
  useEffect(() => {
    if (embedded) return;
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('design-agent')) {
        setActiveTab('design-agent');
    } else {
        const firstSegment = slug[0];
        const mapped = firstSegment && SLUG_TO_TAB[firstSegment];
        if (mapped) {
          setActiveTab(mapped);
        }
    }
  }, [slug, getWorkflowInfo, embedded]);

  const handleTabChange = (tabId) => {
    if (tabId === 'brand-studio') {
      if (embedded) { setActiveTab('brand-studio'); return; }
      router.push('/brand-studio');
      return;
    }
    if (embedded) {
      setActiveTab(tabId);
      return;
    }
    router.push(`/studio/${tabId}`);
  };

  // Cross-studio handoff: listen for studios that request a tab switch via
  // the shared `storyboard:send-to` event. The source studio writes its
  // payload to localStorage before emitting, so the target studio can apply
  // it on mount.
  const handleTabChangeRef = useRef(handleTabChange)
  useEffect(() => {
    handleTabChangeRef.current = handleTabChange
  })
  useEffect(() => {
    const handler = (e) => {
      const { target } = e.detail || {}
      if (!target) return
      const tabId =
        typeof target === 'string' && SLUG_TO_TAB[target]
          ? SLUG_TO_TAB[target]
          : target
      handleTabChangeRef.current(tabId)
    }
    window.addEventListener('storyboard:send-to', handler)
    return () => window.removeEventListener('storyboard:send-to', handler)
  }, [embedded, router])

  // Auto-hide header when inside a specific workflow view or design agent
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    
    if (isEditingWorkflow) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  // Global builder CSS cleanup when switching away from Workflows or Design Agent tabs.
  // We only clear the session flags here. A full page reload was previously used
  // to drop builder-injected global CSS, but it destroyed all other studios'
  // in-memory state (generated assets, prompts, selections) — a data-loss
  // footgun. Builders should expose an explicit teardown hook to remove their own
  // DOM/CSS; until that exists we intentionally avoid the reload.
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    const fromDesignAgent = sessionStorage.getItem("fromDesignAgent");

    if ((fromBuilder && activeTab !== 'workflows') || (fromDesignAgent && activeTab !== 'design-agent')) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      sessionStorage.removeItem("fromDesignAgent");
      // TODO(remediation): call the builder's teardown hook here instead of
      // silently leaving its global CSS behind.
    }
  }, [activeTab]);

  const fetchBalance = useCallback(async (key) => {
    try {
      const { getUserBalance } = await import('studio');
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      const isAuthError = err?.message?.includes('401') || err?.message?.includes('403') || err?.message?.includes('Not authorized');
      if (!isAuthError) {
        console.error('Balance fetch failed:', err);
      }
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    if (demoMode) {
      clearApiKey();
      clearOpenAiKey();
      return;
    }
    // The centralized auth config already restored keys from localStorage/cookies
    // on module load. If both are present, we're done.
    if (hasApiKey && hasOpenAiKey) return;

    // Missing at least one key — try to restore from the signed-in user's
    // account so the keys follow them across browsers, devices and sign-ins.
    let cancelled = false;
    (async () => {
      let restored = '';
      let restoredOpenai = '';
      try {
        const res = await fetch('/api/auth/muapi-key', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          restored = data?.key ? String(data.key).trim() : '';
          restoredOpenai = data?.openaiKey ? String(data.openaiKey).trim() : '';
        }
      } catch {
        // Offline or not signed in — the user can still enter keys manually.
      }
      if (cancelled) return;
      if (restored) {
        setApiKey(restored);
        fetchBalance(restored);
      }
      if (restoredOpenai) {
        setOpenAiKey(restoredOpenai);
      }
      // Still missing at least one key after restore → prompt via the
      // dedicated first-login popup (both keys required to proceed).
      if (restored && restoredOpenai) return;
      if (!embedded) {
        setShowApiKeyPopup(true);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchBalance, embedded, demoMode, hasApiKey, hasOpenAiKey, setApiKey, setOpenAiKey]);

  const [isSavingKey, setIsSavingKey] = useState(false);

  const handleKeySave = useCallback(async (key, openaiKeyValue) => {
    if (demoMode) return;
    if (!key || !isValidKeyFormat(key)) {
      setAuthError('API key looks invalid (contains spaces or control characters). Re-copy it from your MuAPI dashboard.');
      return;
    }

    const trimmed = key.trim();
    const trimmedOpenai = (openaiKeyValue || '').trim();

    // Verify BOTH keys before committing. Previously a format-valid-but-wrong
    // key was silently saved, leaving the user stranded in the studio with a
    // stale invalid key and no clean way to replace it. OpenAI is required for
    // prompt enhancement, script generation and several image paths, so an
    // invalid OpenAI key would silently break those features.
    setIsSavingKey(true);
    try {
      await fetchBalance(trimmed);
    } catch (err) {
      const isAuthError =
        err?.message?.includes?.('401') ||
        err?.message?.includes?.('403') ||
        err?.message?.includes?.('Not authorized');
      setIsSavingKey(false);
      setAuthError(
        isAuthError
          ? 'That MuAPI key is invalid or unauthorized. Double-check it on your MuAPI dashboard and try again.'
          : 'Could not verify the MuAPI key. Check your connection and try again.'
      );
      return; // Do NOT save an unverified key.
    }

    try {
      const { verifyOpenAIKey } = await import('@/shared/api/verifyOpenAIKey');
      await verifyOpenAIKey(trimmedOpenai);
    } catch (err) {
      setIsSavingKey(false);
      const kind = err?.message;
      setAuthError(
        kind === 'unauthorized'
          ? 'That OpenAI key is invalid or unauthorized. Double-check it on your OpenAI dashboard and try again.'
          : 'Could not verify the OpenAI key. Check your connection and try again.'
      );
      return; // Do NOT save an unverified key.
    }

    // Both keys verified — persist them via the centralized auth config.
    // This syncs to localStorage, cookies, and notifies all React consumers.
    setApiKey(trimmed);
    setOpenAiKey(trimmedOpenai);
    setSettingsKeyInput('');
    setSettingsOpenaiInput('');
    setAuthError(null);
    setShowSettings(false);
    setShowApiKeyPopup(false);
    settingsClosedAt.current = Date.now();
    setIsSavingKey(false);
    // Persist the keys against the signed-in user's account so they are restored
    // automatically on future sign-ins and on other browsers/devices.
    fetch('/api/auth/muapi-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ key: trimmed, openaiKey: trimmedOpenai }),
    }).catch(() => {});
  }, [fetchBalance, setApiKey, setOpenAiKey]);

  const handleKeyChange = useCallback(() => {
    if (demoMode) return;
    clearApiKey();
    clearOpenAiKey();
    setBalance(null);
    setSettingsKeyInput('');
    setSettingsOpenaiInput('');
    setAuthError(null);
    // Also forget the keys stored against the user's account.
    fetch('/api/auth/muapi-key', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
  }, [clearApiKey, clearOpenAiKey]);

  // Inject API keys into all outgoing Axios requests (prop-based approach).
  // We use an interceptor to be selective and NOT send the keys to external
  // domains like S3. The MuAPI key goes to x-api-key; the OpenAI key goes to
  // x-openai-key so the Supabase edge functions can use the user's own key.
  useEffect(() => {
    // Safety: Clear any global defaults that might have been set previously
    delete axios.defaults.headers.common['x-api-key'];
    delete axios.defaults.headers.common['x-openai-key'];

    if (!apiKey && !openaiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      // Check if URL is local/proxied
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        if (apiKey) config.headers['x-api-key'] = apiKey.trim();
        if (openaiKey) config.headers['x-openai-key'] = openaiKey.trim();
      }

      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey, openaiKey]);

  // Poll for balance every 30 seconds if key is present
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => fetchBalance(apiKey), 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchBalance]);

  // When MuAPI reports the key is invalid/missing, surface the message but do not
  // immediately wipe the saved key. The user may have a transient failure or want
  // to inspect/update the key manually via the "Change Key" button.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAuthRequired = (e) => {
      // Ignore auth-required events for 3 seconds after the user manually
      // closed the settings modal. This prevents background balance polls
      // or redundant verify requests from immediately reopening it.
      if (Date.now() - settingsClosedAt.current < 3000) return;
      let message = 'Your API key is missing or invalid. Please enter a valid key.';
      const raw = e?.detail?.message;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.detail) message = parsed.detail;
        } catch {
          message = raw;
        }
      }
      setAuthError(message);
      setShowSettings(true);
    };
    window.addEventListener('muapi:auth-required', onAuthRequired);
    return () => window.removeEventListener('muapi:auth-required', onAuthRequired);
  }, []);

  // Drag and Drop Handlers
  const dragDepth = useRef(0);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Track nested enter/leave events with a depth counter so moving between
    // child elements doesn't flicker the overlay off prematurely.
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin text-[#22d3ee] text-3xl">◌</div>
    </div>
  );

  return (
    <div 
      className="h-screen bg-[#030303] flex flex-col overflow-hidden text-white relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-[#22d3ee]/10 backdrop-blur-md border-4 border-dashed border-[#22d3ee]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-[#22d3ee] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">Drop your media here</span>
              <span className="text-sm text-white/40">Images, videos, or audio files</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-40 gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">SmartVideo GO</span>
          </div>

          {/* Center: Navigation Container with fade edges */}
          <div className="flex-1 min-w-0 mx-4 sm:mx-6 relative overflow-hidden h-full flex items-center justify-start">
            {/* Fade Left Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
            
            <nav className="flex items-center gap-4 overflow-x-auto scrollbar-none w-full lg:w-auto h-full px-4 lg:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative text-[13px] font-medium transition-all duration-300 whitespace-nowrap px-1 flex-shrink-0 flex items-center h-full ${
                    activeTab === tab.id
                      ? 'text-[#22d3ee]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22d3ee] to-[#a855f7] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  )}
                </button>
              ))}
            </nav>
            
            {/* Fade Right Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/90">
                  ${balance !== null ? `${balance}` : '---'}
                </span>
              </div>
            </div>

            {!demoMode && (
              <button
                onClick={() => { setAuthError(null); setShowSettings(true); }}
                title="Settings — API key, local models, preferences"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </button>
            )}

            {!demoMode && isSignedIn && (
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                title="Sign out of your account"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Sign out</span>
            </button>
            )}
          </div>
        </header>
      )}

      {/* Studio Content */}
      <AiAssistantProvider apiKey={apiKey} openaiKey={openaiKey}>
      <SocialPublishProvider apiKey={apiKey}>
      <div className="flex-1 min-h-0 relative overflow-hidden">
         {activeTab === 'image'   && <ImageStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'video'   && <VideoStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'clipping' && <ClippingStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'vibe-motion' && <VibeMotionStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'cinema'  && <CinemaStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'audio'   && <AudioStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'marketing' && <MarketingStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'recast' && <RecastStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'layers' && <LayersStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
         {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} templateData={templateData} />}
         {activeTab === 'agents' && <AgentStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} templateData={templateData} />}
         {activeTab === 'design-agent' && <DesignAgentStudio apiKey={apiKey} onRequestApiKey={() => setShowApiKeyPopup(true)} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} templateData={templateData} />}
         {activeTab === 'vfx-studio' && <MemoryRouter initialEntries={['/']}><VFXStudio apiKey={apiKey} onRequestApiKey={() => setShowApiKeyPopup(true)} onDismissApiKey={() => setShowApiKeyPopup(false)} templateData={templateData} /></MemoryRouter>}
         {activeTab === 'storyboard' && <MemoryRouter initialEntries={['/']}><Storyboard apiKey={apiKey} templateData={templateData} /></MemoryRouter>}
         {activeTab === 'thumbnail-studio' && <ThumbnailStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} templateData={templateData} />}
         {activeTab === 'brand-studio' && (
           <div className="flex items-center justify-center h-full">
             <p style={{ color: semantic.textSecondary }}>Loading Brand Studio…</p>
           </div>
         )}
         {activeTab === 'apps' && <AppsStudio apiKey={apiKey} />}
         {activeTab === 'mcp-cli' && <McpCliStudio apiKey={apiKey} />}
         {activeTab === 'ai-influencer' && <AiInfluencerStudio apiKey={apiKey} templateData={templateData} />}
         {activeTab === 'social-publishing' && <SocialPublishing apiKey={apiKey} />}
         {activeTab === 'go-ai-viral' && <GoAiViralStudio apiKey={apiKey} />}
      </div>
      </SocialPublishProvider>
      </AiAssistantProvider>

      {/* First-login API key popup — on-brand overlay modal with an X close
          button, wired to the same handleKeySave / MuAPI persistence logic as
          the Settings modal. Shown once when a signed-in user has no key yet. */}
      {showApiKeyPopup && !apiKey && !demoMode && (
        <ApiKeyModal
          overlay
          onSave={handleKeySave}
          onClose={() => { setAuthError(null); setShowApiKeyPopup(false); }}
          error={authError}
          loading={isSavingKey}
          title="Welcome to SmartVideo GO"
          subtitle={
            <>Enter your <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#e5ff33] transition-colors">Muapi.ai</a> and <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#e5ff33] transition-colors">OpenAI</a> API keys to start creating</>
          }
        />
      )}

      {/* Settings Modal */}
      {showSettings && !demoMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-bold text-lg mb-2">
              {apiKey || openaiKey ? 'Settings' : 'Add your API keys'}
            </h2>
            <p className="text-white/40 text-[13px] mb-4">
              {apiKey || openaiKey
                ? 'Manage your AI studio preferences and authentication.'
                : 'Welcome! Add your own MuAPI and OpenAI keys to start generating.'}
            </p>
            
            {authError && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                {authError}
              </div>
            )}
            
            <div className="space-y-4 mb-8">
              {apiKey && (
                <div className="bg-white/5 border border-white/[0.03] rounded-md p-4">
                  <label className="block text-xs font-bold text-white/30 mb-2">
                    Active MuAPI Key
                  </label>
                  <div className="text-[13px] font-mono text-white/80">
                    {apiKey.slice(0, 8)}••••••••••••••
                  </div>
                </div>
              )}
              {openaiKey && (
                <div className="bg-white/5 border border-white/[0.03] rounded-md p-4">
                  <label className="block text-xs font-bold text-white/30 mb-2">
                    Active OpenAI Key
                  </label>
                  <div className="text-[13px] font-mono text-white/80">
                    {openaiKey.slice(0, 8)}••••••••••••••
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-white/30 mb-2">
                  {apiKey ? 'New MuAPI Key' : 'MuAPI Key'}
                </label>
                <input
                  type="password"
                  value={settingsKeyInput}
                  onChange={(e) => setSettingsKeyInput(e.target.value)}
                  placeholder="Enter your MuAPI key..."
                  disabled={isSavingKey}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 disabled:opacity-60"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  {apiKey
                    ? 'Your key is stored securely to your account and restored automatically when you sign in.'
                    : 'Add your own MuAPI key to start generating. It is stored securely to your account, so you only need to enter it once.'}{' '}
                  <a
                    href="https://muapi.ai/access-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#22d3ee] font-semibold hover:underline"
                  >
                    Get your key at muapi.ai
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 mb-2">
                  {openaiKey ? 'New OpenAI Key' : 'OpenAI Key'}
                </label>
                <input
                  type="password"
                  value={settingsOpenaiInput}
                  onChange={(e) => setSettingsOpenaiInput(e.target.value)}
                  placeholder="sk-... (OpenAI key)"
                  disabled={isSavingKey}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 disabled:opacity-60"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  {openaiKey
                    ? 'Used for prompt enhancement, script generation and some image paths. Stored securely to your account.'
                    : 'Used for prompt enhancement, script generation and some image paths. Add your own OpenAI key to enable them.'}{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#22d3ee] font-semibold hover:underline"
                  >
                    Get your key at platform.openai.com
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleKeySave(settingsKeyInput, settingsOpenaiInput)}
                disabled={isSavingKey || (!settingsKeyInput.trim() && !settingsOpenaiInput.trim())}
                className="flex-1 h-10 rounded-md bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingKey && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {isSavingKey ? 'Verifying…' : 'Save Key'}
              </button>
              {apiKey && (
                <button
                  onClick={handleKeyChange}
                  disabled={isSavingKey}
                  className="flex-1 h-10 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Change Key
                </button>
              )}
              <button
                onClick={() => { setAuthError(null); setShowSettings(false); settingsClosedAt.current = Date.now(); }}
                disabled={isSavingKey}
                className="flex-1 h-10 rounded-md bg-white/5 text-white/80 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
