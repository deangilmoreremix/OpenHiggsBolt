'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Camera,
  Music2,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  listSocialAccounts,
  connectSocialAccount,
  listExternalSocialAccounts,
  disconnectExternalSocialAccount,
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
  pollSocialResult,
} from '../../lib/muapi';

const EXT_UID_KEY = 'muapi_social_ext_uid';
const SOCIAL_HISTORY_KEY = 'muapi_social_media_history';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: Play, accent: '#ff0033' },
  { id: 'instagram', name: 'Instagram', icon: Camera, accent: '#e1306c' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, accent: '#22d3ee' },
];

function loadMediaHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SOCIAL_HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(-12).reverse() : [];
  } catch {
    return [];
  }
}

function pushMediaHistory(url) {
  if (typeof window === 'undefined' || !url) return;
  try {
    const raw = localStorage.getItem(SOCIAL_HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;
    if (!arr.includes(url)) {
      arr.push(url);
      localStorage.setItem(SOCIAL_HISTORY_KEY, JSON.stringify(arr.slice(-50)));
    }
  } catch {
    // ignore quota errors
  }
}

export default function SocialPublishing({ apiKey }) {
  const [platform, setPlatform] = useState('youtube');
  const [mediaUrl, setMediaUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [categoryId, setCategoryId] = useState('');
  const [madeForKids, setMadeForKids] = useState(false);
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('VIDEO');
  const [placement, setPlacement] = useState('reels');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [manualAccountId, setManualAccountId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [mediaHistory, setMediaHistory] = useState<any[]>([]);

  const [publishing, setPublishing] = useState(false);
  const [pollStatus, setPollStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const pollTimer = useRef(null);

  useEffect(() => {
    setMediaHistory(loadMediaHistory());
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const effectiveAccountId = selectedAccountId || manualAccountId.trim();

  const refreshAccounts = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your MuAPI key in Settings first.');
      return;
    }
    setLoadingAccounts(true);
    setError(null);
    try {
      const data = await listExternalSocialAccounts(apiKey);
      const list = Array.isArray(data) ? data : (data?.accounts || []);
      setAccounts(list);
      if (list.length === 0) {
        setError('No connected accounts yet. Use "Connect account" to authorize one.');
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoadingAccounts(false);
    }
  }, [apiKey]);

  const handleConnect = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your MuAPI key in Settings first.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const redirectTo = window.location.origin + '/studio/social-publishing';
      const data = await connectSocialAccount(apiKey, redirectTo);
      const url = data?.url || data?.authorize_url || data?.connect_url;
      if (!url) throw new Error('No connect URL returned by API.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setConnecting(false);
    }
  }, [apiKey]);

  const handleDisconnect = useCallback(async (id) => {
    if (!apiKey) return;
    try {
      await disconnectExternalSocialAccount(apiKey, id);
      setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
      if (String(selectedAccountId) === String(id)) setSelectedAccountId('');
    } catch (err) {
      setError(formatError(err));
    }
  }, [apiKey, selectedAccountId]);

  const handlePublish = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your MuAPI key in Settings first.');
      return;
    }
    if (!mediaUrl.trim()) {
      setError('Provide a media URL to publish.');
      return;
    }
    if (!effectiveAccountId) {
      setError('Select or manually enter an account_id.');
      return;
    }

    setPublishing(true);
    setError(null);
    setResult(null);
    setPollStatus('Submitting…');

    let payload;
    try {
      if (platform === 'youtube') {
        payload = {
          account_id: effectiveAccountId,
          media_url: mediaUrl.trim(),
          title: title.trim() || 'Untitled',
          description: description.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          privacy: privacy || 'public',
          category_id: categoryId.trim() || undefined,
          made_for_kids: madeForKids,
        };
      } else if (platform === 'instagram') {
        payload = {
          account_id: effectiveAccountId,
          media_url: mediaUrl.trim(),
          caption: caption.trim() || undefined,
          media_type: mediaType,
          placement: placement,
          share_to_feed: shareToFeed,
        };
      } else {
        payload = {
          account_id: effectiveAccountId,
          media_url: mediaUrl.trim(),
          title: title.trim() || undefined,
          privacy_level: privacyLevel,
          disable_comment: disableComment,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
        };
      }

      let submit;
      if (platform === 'youtube') submit = await publishToYouTube(apiKey, payload);
      else if (platform === 'instagram') submit = await publishToInstagram(apiKey, payload);
      else submit = await publishToTikTok(apiKey, payload);

      const requestId = submit?.request_id || submit?.id;
      if (!requestId) throw new Error('No request_id returned by publish endpoint.');

      pushMediaHistory(mediaUrl.trim());
      setMediaHistory(loadMediaHistory());

      setPollStatus('Processing…');
      const final = await pollSocialResult(apiKey, requestId, 120, 2000);

      const out = final?.output || final?.data?.output || final;
      const link = out?.url || out?.media_id || out?.publish_id || final?.url;
      setResult({ platform, status: 'published', url: link || undefined });
      setPollStatus('');
    } catch (err) {
      setError(formatError(err));
      setPollStatus('');
    } finally {
      setPublishing(false);
    }
  }, [
    apiKey,
    platform,
    mediaUrl,
    title,
    description,
    tags,
    privacy,
    categoryId,
    madeForKids,
    caption,
    mediaType,
    placement,
    shareToFeed,
    privacyLevel,
    disableComment,
    disableDuet,
    disableStitch,
    effectiveAccountId,
  ]);

  const handleCopy = useCallback(() => {
    if (!result?.url) return;
    navigator.clipboard?.writeText(String(result.url)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  const platformMeta = useMemo(() => PLATFORMS.find((p) => p.id === platform), [platform]);

  return (
    <div className="h-full overflow-y-auto bg-[#030303] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold">Social Publishing</h1>
            <p className="text-xs text-white/40">Publish generated media to YouTube, Instagram & TikTok</p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            ~$0.01 / publish
          </span>
        </div>

        {!apiKey && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            No API key detected. Add your MuAPI key in Settings to use Social Publishing.
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-5">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setResult(null); setError(null); }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                  active ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={20} style={{ color: active ? p.accent : '#a1a1aa' }} />
                <span className={`text-xs font-medium ${active ? 'text-white' : 'text-white/50'}`}>{p.name}</span>
              </button>
            );
          })}
        </div>

        <Section title="Account">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleConnect}
              disabled={connecting || !apiKey}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              Connect {platformMeta?.name} account
            </button>
            <button
              onClick={refreshAccounts}
              disabled={loadingAccounts || !apiKey}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40"
            >
              {loadingAccounts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh accounts
            </button>
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {accounts.map((a) => {
                const id = String(a.id);
                const active = selectedAccountId === id;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      active ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10 text-white' : 'border-white/10 bg-white/[0.03] text-white/60'
                    }`}
                  >
                    <button onClick={() => { setSelectedAccountId(id); setManualAccountId(''); }}>
                      {a.account_name || a.platform_name || id}
                      <span className="ml-1 text-white/40">#{id}</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(id)}
                      className="text-white/40 hover:text-red-400"
                      title="Disconnect"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <label className="block text-xs font-bold text-white/30 mb-1">Account ID (manual)</label>
          <input
            value={manualAccountId}
            onChange={(e) => { setManualAccountId(e.target.value); setSelectedAccountId(''); }}
            placeholder="Paste a known account_id"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
          />
          {effectiveAccountId && (
            <p className="mt-1 text-[11px] text-white/40">Using account_id: {effectiveAccountId}</p>
          )}
        </Section>

        <Section title="Media">
          <label className="block text-xs font-bold text-white/30 mb-1">Media URL</label>
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://… your generated video or image"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
          />
          {mediaHistory.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {mediaHistory.map((u) => (
                <button
                  key={u}
                  onClick={() => setMediaUrl(u)}
                  className="max-w-[220px] truncate text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-[#22d3ee]/40 transition-all"
                  title={u}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section title="Details">
          {platform === 'youtube' && (
            <>
              <Field label="Title" value={title} onChange={setTitle} placeholder="Video title" />
              <Field label="Description" value={description} onChange={setDescription} placeholder="Optional description" textarea />
              <Field label="Tags (comma separated)" value={tags} onChange={setTags} placeholder="ai, generative, art" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/30 mb-1">Privacy</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
                  >
                    <option value="public">public</option>
                    <option value="private">private</option>
                    <option value="unlisted">unlisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/30 mb-1">Category ID</label>
                  <input
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="e.g. 22 (People)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-xs text-white/60">
                <input type="checkbox" checked={madeForKids} onChange={(e) => setMadeForKids(e.target.checked)} />
                Made for kids
              </label>
            </>
          )}

          {platform === 'instagram' && (
            <>
              <Field label="Caption" value={caption} onChange={setCaption} placeholder="Optional caption" textarea />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/30 mb-1">Media type</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="IMAGE">IMAGE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/30 mb-1">Placement</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
                  >
                    <option value="reels">reels</option>
                    <option value="stories">stories</option>
                    <option value="timeline">timeline</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-xs text-white/60">
                <input type="checkbox" checked={shareToFeed} onChange={(e) => setShareToFeed(e.target.checked)} />
                Share to feed
              </label>
            </>
          )}

          {platform === 'tiktok' && (
            <>
              <Field label="Title" value={title} onChange={setTitle} placeholder="Optional title" />
              <div>
                <label className="block text-xs font-bold text-white/30 mb-1">Privacy level</label>
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
                >
                  <option value="PUBLIC_TO_EVERYONE">PUBLIC_TO_EVERYONE</option>
                  <option value="MUTUAL_FOLLOW_FRIENDS">MUTUAL_FOLLOW_FRIENDS</option>
                  <option value="FOLLOWER_OF_CREATOR">FOLLOWER_OF_CREATOR</option>
                  <option value="SELF_ONLY">SELF_ONLY</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/60">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={disableComment} onChange={(e) => setDisableComment(e.target.checked)} />
                  Disable comment
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={disableDuet} onChange={(e) => setDisableDuet(e.target.checked)} />
                  Disable duet
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={disableStitch} onChange={(e) => setDisableStitch(e.target.checked)} />
                  Disable stitch
                </label>
              </div>
            </>
          )}
        </Section>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={publishing || !apiKey}
          className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#22d3ee]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {publishing ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
          {publishing ? (pollStatus || 'Publishing…') : `Publish to ${platformMeta?.name}`}
        </button>

        {result && result.url && (
          <div className="mt-4 p-4 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Published successfully</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-all"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <a
              href={String(result.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[#22d3ee] break-all hover:underline"
            >
              {String(result.url)}
            </a>
            <p className="mt-1 text-[11px] text-white/40">status: {result.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <h2 className="text-xs font-bold uppercase tracking-wide text-white/40 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-bold text-white/30 mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
        />
      )}
    </div>
  );
}

function formatError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  let detail = data?.detail || data?.error || data?.message;
  if (typeof detail === 'object') detail = JSON.stringify(detail);
  if (status === 401) return 'Invalid API key (401). Check your MuAPI key in Settings.';
  if (status) return `${err.message || 'Request failed'} (${status})${detail ? ' — ' + detail : ''}`;
  return err?.message || 'Request failed.';
}
