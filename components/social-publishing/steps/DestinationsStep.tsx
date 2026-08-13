'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Play,
  Camera,
  Music2,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Type,
  Send,
} from 'lucide-react';
import {
  listExternalSocialAccounts,
  connectSocialAccount,
  disconnectExternalSocialAccount,
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
  publishToFacebook,
  publishToLinkedIn,
  publishToPinterest,
  publishToThreads,
  publishToX,
  pollSocialResult,
} from '@/lib/muapi';
import type { DestinationsStepProps, PublishResult, Destination, CopyState } from '../types';
import AccountCard from '../accounts/AccountCard';
import ConnectAccountButton from '../accounts/ConnectAccountButton';

const EXT_UID_KEY = 'muapi_social_ext_uid';

function FacebookIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PinterestIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.166-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

function ThreadsIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="currentColor">
      <path d="M12.6 1.52C8.88 1.52 8.12 4.18 8.12 4.18s.24-.12.72-.36c.48-.24.72-.48.84-.72.24-.6.48-1.08.6-1.44h.24c.24.72.6 2.04 1.08 3.24.72 1.8 1.56 2.88 2.28 2.88s1.2-.72 1.68-2.04c.36-.96.6-2.04.6-3.24 0-.24.04-.6.12-1.08h.24c-.12.6-.24 1.32-.36 2.04-.24 1.44-.48 3.12-.48 3.84 0 .36.12.84.36 1.2.24.36.6.6 1.08.6.24 0 .48-.06.72-.18.48-.24.84-.72 1.08-1.32.24-.6.48-1.56.6-2.52h.24c-.24 2.4-.84 5.04-1.8 6.48-.96 1.44-2.16 2.28-3.36 2.28-1.2 0-2.04-.84-2.64-2.28-.48-1.32-.72-3-.72-4.68 0-.36.04-.72.12-1.08h.24c.48 1.8 1.44 3.48 2.88 3.48 1.2 0 2.28-1.08 3.12-2.88z" />
    </svg>
  );
}

const ALL_PLATFORMS: Array<{
  id: string
  name: string
  icon: React.ComponentType<any>
  accent: string
  supports: string[]
}> = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Play,
    accent: '#ff0033',
    supports: ['video'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Camera,
    accent: '#e1306c',
    supports: ['video', 'image'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    accent: '#22d3ee',
    supports: ['video'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    accent: '#1877f2',
    supports: ['video', 'image'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedInIcon,
    accent: '#0a66c2',
    supports: ['video', 'image'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: PinterestIcon,
    accent: '#e60023',
    supports: ['video', 'image'],
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: ThreadsIcon,
    accent: '#000000',
    supports: ['video', 'image'],
  },
  {
    id: 'x',
    name: 'X',
    icon: XIcon,
    accent: '#000000',
    supports: ['video', 'image'],
  },
];

function formatError(err: any) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  let detail = data?.detail || data?.error || data?.message;
  if (typeof detail === 'object') detail = JSON.stringify(detail);
  if (status === 401) return 'Invalid API key (401). Check your MuAPI key in Settings.';
  if (status) return `${err.message || 'Request failed'} (${status})${detail ? ' — ' + detail : ''}`;
  return err?.message || 'Request failed.';
}

function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function DestinationsStep({
  asset,
  copy,
  destinations,
  onChange,
  publishResults,
  onPublish,
  onUpdatePublishResults,
  publishing,
  apiKey,
  mediaType,
}: DestinationsStepProps) {
  const [activePlatform, setActivePlatform] = useState('youtube');
  const [connecting, setConnecting] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Multi-select & per-destination settings
  const [expandedDestId, setExpandedDestId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [destSettings, setDestSettings] = useState<Record<string, any>>({});
  const [manualAccountIds, setManualAccountIds] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState<any>(null);

  const availablePlatforms = useMemo(
    () => ALL_PLATFORMS.filter((p) => p.supports.includes(mediaType)),
    [mediaType],
  );

  const platformMeta = useMemo(
    () => ALL_PLATFORMS.find((p) => p.id === activePlatform),
    [activePlatform],
  );

  const selectedDestinations = useMemo(
    () => destinations.filter((d) => d.enabled),
    [destinations],
  );

  const hasSelection = selectedDestinations.length > 0;

  const refreshAccounts = useCallback(
    async (silent = false) => {
      if (!apiKey) {
        if (!silent) setError('Enter your MuAPI key in Settings first.');
        return;
      }
      setLoadingAccounts(true);
      if (!silent) setError(null);
      try {
        const data = await listExternalSocialAccounts(apiKey);
        const list = Array.isArray(data) ? data : data?.accounts || [];
        const filtered = list.filter((a: any) => {
          const p = String(a.platform_name || a.platform || '').toLowerCase();
          return p === activePlatform.toLowerCase();
        });
        setAccounts(filtered);
        if (filtered.length === 0 && !silent) {
          setError('No connected accounts yet. Use "Connect account" to authorize one.');
        }
      } catch (err) {
        if (!silent) setError(formatError(err));
      } finally {
        setLoadingAccounts(false);
      }
    },
    [apiKey, activePlatform],
  );

  const handleConnect = useCallback(
    async (connectPlatform: string) => {
      if (!apiKey) {
        setError('Enter your MuAPI key in Settings first.');
        return;
      }
      setConnecting(true);
      setError(null);
      try {
        const redirectTo =
          typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '/';
        const data = await connectSocialAccount(
          apiKey,
          undefined,
          redirectTo,
          connectPlatform,
        );
        const url = data?.url || data?.authorize_url || data?.connect_url;
        if (!url) throw new Error('No connect URL returned by API.');
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => refreshAccounts(true), 2500);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setConnecting(false);
      }
    },
    [apiKey, refreshAccounts],
  );

  const handleDisconnect = useCallback(
    async (id: string) => {
      if (!apiKey) return;
      try {
        await disconnectExternalSocialAccount(apiKey, id);
        setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
        onChange?.(
          destinations.filter(
            (d) => !(d.accountId === id && d.platform === activePlatform),
          ),
        );
      } catch (err) {
        setError(formatError(err));
      }
    },
    [apiKey, activePlatform, destinations, onChange],
  );

  const handleToggleDestination = useCallback(
    (id: string) => {
      const dest = destinations.find((d) => d.id === id);
      if (!dest) return;
      onChange?.(destinations.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
    },
    [destinations, onChange],
  );

  const handleAddManualAccount = useCallback(
    (platform: string) => {
      const manualId = manualAccountIds[platform]?.trim();
      if (!manualId) return;
      const exists = destinations.find(
        (d) => d.platform === platform && d.accountId === manualId,
      );
      if (exists) {
        onChange?.(destinations.map((d) => (d.id === exists.id ? { ...d, enabled: true } : d)));
      } else {
        const newDest: Destination = {
          id: `${platform}:${manualId}:${uuidv4()}`,
          platform: platform as Destination['platform'],
          accountId: manualId,
          accountName: `Manual ${platform}`,
          enabled: true,
          settings: {},
        };
        onChange?.([...destinations, newDest]);
      }
      setManualAccountIds((prev) => ({ ...prev, [platform]: '' }));
    },
    [destinations, onChange, manualAccountIds],
  );

  const updateSetting = useCallback(
    (destId: string, key: string, value: any) => {
      setDestSettings((prev) => ({
        ...prev,
        [destId]: { ...(prev[destId] || {}), [key]: value },
      }));
    },
    [],
  );

  async function publishOne(destination: Destination, results: PublishResult[]) {
    if (!apiKey || !asset.url.trim()) {
      throw new Error('Missing API key or media URL.');
    }
    if (!destination.accountId) {
      throw new Error('Missing account ID.');
    }

    const base = {
      account_id: destination.accountId,
      media_url: asset.url.trim(),
    };
    const settings = destSettings[destination.id] || destination.settings || {};
    let payload: Record<string, any>;
    let submit;

    switch (destination.platform) {
      case 'youtube':
        payload = {
          ...base,
          title: copy.title?.trim() || 'Untitled',
          description: copy.description?.trim() || undefined,
          tags: copy.tags?.trim() ? copy.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          privacy: settings.privacy || 'public',
          category_id: '',
          made_for_kids: false,
        };
        submit = await publishToYouTube(apiKey, payload);
        break;
      case 'instagram':
        payload = {
          ...base,
          caption: copy.caption?.trim() || undefined,
          media_type: mediaType === 'image' ? 'IMAGE' : 'VIDEO',
          placement: 'reels',
          share_to_feed: true,
          ...settings,
        };
        submit = await publishToInstagram(apiKey, payload);
        break;
      case 'tiktok':
        payload = {
          ...base,
          title: copy.tiktokTitle?.trim() || undefined,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
          ...settings,
        };
        submit = await publishToTikTok(apiKey, payload);
        break;
      case 'facebook':
        payload = {
          ...base,
          title: copy.title?.trim() || undefined,
          description: copy.description?.trim() || undefined,
          ...settings,
        };
        submit = await publishToFacebook(apiKey, payload);
        break;
      case 'linkedin':
        payload = {
          ...base,
          title: copy.title?.trim() || undefined,
          description: copy.description?.trim() || undefined,
          ...settings,
        };
        submit = await publishToLinkedIn(apiKey, payload);
        break;
      case 'pinterest':
        payload = {
          ...base,
          title: copy.title?.trim() || undefined,
          description: copy.description?.trim() || undefined,
          ...settings,
        };
        submit = await publishToPinterest(apiKey, payload);
        break;
      case 'threads':
        payload = {
          ...base,
          title: copy.title?.trim() || undefined,
          description: copy.description?.trim() || undefined,
          ...settings,
        };
        submit = await publishToThreads(apiKey, payload);
        break;
      case 'x':
        payload = {
          ...base,
          title: copy.title?.trim() || undefined,
          description: copy.description?.trim() || undefined,
          ...settings,
        };
        submit = await publishToX(apiKey, payload);
        break;
      default:
        throw new Error(`Unsupported platform: ${destination.platform}`);
    }

    const requestId = submit?.request_id || submit?.id;
    if (!requestId) {
      const out = submit?.output || submit?.data?.output || submit;
      const url = out?.url || out?.media_id || out?.publish_id || submit?.url;
      return {
        platform: destination.platform,
        status: 'published' as const,
        url,
        accountId: destination.accountId,
        requestId: submit?.request_id,
        output: submit,
      };
    }

    const final = await pollSocialResult(apiKey, requestId, 120, 2000);
    const out = final?.output || final?.data?.output || final;
    const url = out?.url || out?.media_id || out?.publish_id || final?.url;
    return {
      platform: destination.platform,
      status: 'published' as const,
      url,
      accountId: destination.accountId,
      requestId,
      output: out,
    };
  }

  const handlePublish = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your MuAPI key in Settings first.');
      return;
    }
    if (!asset.url.trim()) {
      setError('No media URL to publish.');
      return;
    }
    if (selectedDestinations.length === 0) {
      setError('Select at least one destination.');
      return;
    }

    setError(null);
    const newResults: PublishResult[] = [...publishResults];
    onPublish?.(selectedDestinations);

    for (const dest of selectedDestinations) {
      try {
        const result = await publishOne(dest, newResults);
        newResults.push(result);
        onUpdatePublishResults?.([...newResults]);
      } catch (err) {
        const result: PublishResult = {
          platform: dest.platform,
          status: 'failed',
          error: formatError(err),
          accountId: dest.accountId,
          requestId: '',
        };
        newResults.push(result);
        onUpdatePublishResults?.([...newResults]);
      }
    }

    setAnnouncement(`Publish completed: ${newResults.filter((r) => r.status === 'published').length} succeeded, ${newResults.filter((r) => r.status === 'failed').length} failed.`);
  }, [apiKey, asset.url, selectedDestinations, publishResults, onPublish, onUpdatePublishResults]);

  const handleRetry = useCallback(
    async (destId: string) => {
      const dest = destinations.find((d) => d.id === destId);
      if (!dest || !apiKey) return;
      setRetryingId(destId);
      setError(null);
      try {
        const result = await publishOne(dest, publishResults);
        const updated = publishResults.map((r) =>
          r.platform === dest.platform && r.accountId === dest.accountId ? result : r,
        );
        onUpdatePublishResults?.(updated);
        setAnnouncement(`Retry succeeded for ${dest.platform}`);
      } catch (err) {
        const result: PublishResult = {
          platform: dest.platform,
          status: 'failed',
          error: formatError(err),
          accountId: dest.accountId,
          requestId: '',
        };
        const updated = publishResults.map((r) =>
          r.platform === dest.platform && r.accountId === dest.accountId ? result : r,
        );
        onUpdatePublishResults?.(updated);
        setAnnouncement(`Retry failed for ${dest.platform}: ${formatError(err)}`);
      } finally {
        setRetryingId(null);
      }
    },
    [destinations, apiKey, publishResults, onUpdatePublishResults],
  );

  const latestResult = publishResults[publishResults.length - 1];

  const handleCopy = useCallback(() => {
    if (!latestResult?.url && !latestResult?.link) return;
    const urlToCopy = String(latestResult.url || latestResult.link || '');
    navigator.clipboard?.writeText(urlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [latestResult]);

  useEffect(() => {
    refreshAccounts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlatform]);

  const getStatusForPlatform = (platform: string, accountId?: string): PublishResult | undefined => {
    const match = [...publishResults].reverse().find(
      (r) => r.platform === platform && (accountId === undefined || r.accountId === accountId),
    );
    return match;
  };

  return (
    <div className="space-y-4">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {!apiKey && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          No API key detected. Add your MuAPI key in Settings to use Social Publishing.
        </div>
      )}

      <p className="text-[11px] text-white/40 truncate" title={asset.url}>
        Media: {asset.url || '—'}
      </p>

      {/* Platform picker */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {availablePlatforms.map((p) => {
          const Icon = p.icon;
          const active = activePlatform === p.id;
          const hasSelected = selectedDestinations.some((d) => d.platform === p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActivePlatform(p.id);
                setError(null);
              }}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              style={
                active
                  ? { borderColor: `${p.accent}66`, backgroundColor: `${p.accent}15` }
                  : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }
              }
            >
              {hasSelected && !active && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: p.accent }} />
              )}
              <Icon size={18} style={{ color: active ? p.accent : '#a1a1aa' }} />
              <span className={`text-[11px] font-medium ${active ? 'text-white' : 'text-white/50'}`}>
                {p.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected destinations summary */}
      {hasSelection && (
        <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-2">
            Selected destinations ({selectedDestinations.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedDestinations.map((d) => {
              const meta = ALL_PLATFORMS.find((p) => p.id === d.platform);
              const Icon = meta?.icon || Link2;
              const accent = meta?.accent || '#22d3ee';
              const result = getStatusForPlatform(d.platform, d.accountId);
              const statusLabel = result?.status || 'pending';
              const isPending = statusLabel === 'queued' || statusLabel === 'uploading' || statusLabel === 'processing';
              const isFailed = statusLabel === 'failed';
              const isPublished = statusLabel === 'published';
              const statusColor = isPublished ? '#22c55e' : isFailed ? '#ef4444' : isPending ? '#eab308' : '#71717a';
              return (
                <span
                  key={d.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                  style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10`, color: 'white' }}
                >
                  <Icon size={12} style={{ color: accent }} />
                  {d.accountName || d.accountId}
                  {result && (
                    <span className="flex items-center gap-1" style={{ color: statusColor }}>
                      {isPending && <Loader2 size={10} className="animate-spin" />}
                      {isFailed && <AlertCircle size={10} />}
                      {isPublished && <Check size={10} />}
                      {statusLabel}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleDestination(d.id)}
                    className="ml-0.5 text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                    aria-label={`Remove ${d.accountName || d.accountId} from selection`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Account */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-3">
          {platformMeta?.name || 'Platform'} accounts
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <ConnectAccountButton
            platformName={platformMeta?.name || activePlatform}
            platformIcon={platformMeta?.icon || Link2}
            platformAccent={platformMeta?.accent || '#22d3ee'}
            connecting={connecting}
            disabled={!apiKey}
            onClick={() => handleConnect(activePlatform)}
          />
          <button
            type="button"
            onClick={() => refreshAccounts()}
            disabled={loadingAccounts || !apiKey}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {loadingAccounts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2 mb-3">
            {accounts.map((a) => {
              const id = String(a.id);
              const dest = destinations.find(
                (d) => d.platform === activePlatform && d.accountId === id,
              );
              const isSelected = dest?.enabled ?? false;
              const result = getStatusForPlatform(activePlatform, id);
              const isExpanded = expandedDestId === `${activePlatform}:${id}`;
              return (
                <AccountCard
                  key={id}
                  destination={
                    dest || {
                      id: `${activePlatform}:${id}:${uuidv4()}`,
                      platform: activePlatform as Destination['platform'],
                      accountId: id,
                      accountName: a.account_name || a.platform_name || id,
                      enabled: false,
                      settings: {},
                    }
                  }
                  selected={isSelected}
                  onToggle={(destId) => {
                    const current = destinations.find((d) => d.id === destId);
                    if (current) {
                      handleToggleDestination(destId);
                    } else {
                      const newDest: Destination = {
                        id: `${activePlatform}:${id}:${uuidv4()}`,
                        platform: activePlatform as Destination['platform'],
                        accountId: id,
                        accountName: a.account_name || a.platform_name || id,
                        accountImage: a.account_image,
                        enabled: true,
                        settings: {},
                      };
                      onChange?.([...destinations, newDest]);
                    }
                  }}
                  onDisconnect={handleDisconnect}
                  onExpand={(destId) => setExpandedDestId(isExpanded ? null : destId)}
                  expanded={isExpanded}
                  platformName={platformMeta?.name || activePlatform}
                  platformIcon={platformMeta?.icon || Link2}
                  platformAccent={platformMeta?.accent || '#22d3ee'}
                  result={result}
                  onRetry={handleRetry}
                  retrying={retryingId === `${activePlatform}:${id}`}
                >
                  {isExpanded && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide">Privacy</label>
                          <select
                            value={destSettings[`${activePlatform}:${id}`]?.privacy || 'public'}
                            onChange={(e) => updateSetting(`${activePlatform}:${id}`, 'privacy', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#22d3ee]/50 appearance-none"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="unlisted">Unlisted</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide">Schedule</label>
                          <input
                            type="datetime-local"
                            value={destSettings[`${activePlatform}:${id}`]?.schedule || ''}
                            onChange={(e) => updateSetting(`${activePlatform}:${id}`, 'schedule', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#22d3ee]/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide flex items-center gap-1">
                          <Tag size={10} /> Tags
                        </label>
                        <input
                          value={destSettings[`${activePlatform}:${id}`]?.tags || ''}
                          onChange={(e) => updateSetting(`${activePlatform}:${id}`, 'tags', e.target.value)}
                          placeholder="tag1, tag2, tag3"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide flex items-center gap-1">
                          <MapPin size={10} /> Location
                        </label>
                        <input
                          value={destSettings[`${activePlatform}:${id}`]?.location || ''}
                          onChange={(e) => updateSetting(`${activePlatform}:${id}`, 'location', e.target.value)}
                          placeholder="City, Country"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
                        />
                      </div>
                      {mediaType === 'image' && (
                        <div>
                          <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide flex items-center gap-1">
                            <Type size={10} /> Alt text
                          </label>
                          <textarea
                            value={destSettings[`${activePlatform}:${id}`]?.altText || ''}
                            onChange={(e) => updateSetting(`${activePlatform}:${id}`, 'altText', e.target.value)}
                            placeholder="Describe the image for accessibility..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </AccountCard>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-white/30 mb-1 uppercase tracking-wide">
            Add account manually (account ID)
          </label>
          <div className="flex gap-2">
            <input
              value={manualAccountIds[activePlatform] || ''}
              onChange={(e) =>
                setManualAccountIds((prev) => ({ ...prev, [activePlatform]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddManualAccount(activePlatform);
              }}
              placeholder="Paste a known account_id"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
            />
            <button
              type="button"
              onClick={() => handleAddManualAccount(activePlatform)}
              disabled={!manualAccountIds[activePlatform]?.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Publish Now button */}
      {hasSelection && (
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || !apiKey || !asset.url.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{
            backgroundColor: hasSelection ? '#22d3ee' : 'rgba(255,255,255,0.05)',
            color: hasSelection ? '#000' : '#71717a',
          }}
        >
          {publishing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {publishing ? 'Publishing...' : `Publish Now (${selectedDestinations.length})`}
        </button>
      )}

      {/* Partial failure / status UI */}
      {publishResults.length > 0 && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-3">
            Publish status ({publishResults.length})
          </h3>
          <div className="space-y-2">
            {publishResults.map((r, idx) => {
              const meta = ALL_PLATFORMS.find((p) => p.id === r.platform);
              const Icon = meta?.icon || Link2;
              const accent = meta?.accent || '#22d3ee';
              const isPublished = r.status === 'published';
              const isFailed = r.status === 'failed';
              const isPending = r.status === 'queued' || r.status === 'uploading' || r.status === 'processing';
              const statusColor = isPublished ? '#22c55e' : isFailed ? '#ef4444' : isPending ? '#eab308' : '#71717a';
              return (
                <div
                  key={`${r.platform}-${r.accountId || ''}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ borderColor: `${accent}20`, backgroundColor: `${accent}08` }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}20` }}>
                    <Icon size={16} style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {r.platform}
                      {r.accountId && <span className="text-white/40 ml-1">#{r.accountId}</span>}
                    </p>
                    {r.error && <p className="text-[11px] text-red-400 truncate">{r.error}</p>}
                    {r.url && !r.error && (
                      <a
                        href={String(r.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-[#22d3ee] hover:underline truncate"
                      >
                        {String(r.url)}
                      </a>
                    )}
                  </div>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                  >
                    {isPending && <Loader2 size={10} className="animate-spin" />}
                    {isFailed && <AlertCircle size={10} />}
                    {isPublished && <Check size={10} />}
                    {r.status}
                  </span>
                  {isFailed && (
                    <button
                      type="button"
                      onClick={() => {
                        const dest = destinations.find(
                          (d) => d.platform === r.platform && d.accountId === r.accountId,
                        );
                        if (dest) handleRetry(dest.id);
                      }}
                      disabled={retryingId !== null}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <RefreshCw size={10} />
                      Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {latestResult && latestResult.url && !publishResults.find((r) => r.url) && (
        <div className="p-4 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Published successfully</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <a
            href={String(latestResult.url || latestResult.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#22d3ee] break-all hover:underline"
          >
            {String(latestResult.url || latestResult.link)}
          </a>
          {latestResult.requestId && (
            <p className="mt-1 text-[11px] text-white/40">request_id: {latestResult.requestId}</p>
          )}
        </div>
      )}
    </div>
  );
}
