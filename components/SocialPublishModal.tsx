'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  X,
  Share2,
} from 'lucide-react';
import {
  listExternalSocialAccounts,
  connectSocialAccount,
  disconnectExternalSocialAccount,
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
  pollSocialResult,
} from '@/lib/muapi';

/**
 * Reusable social-publishing modal.
 *
 * Props:
 *  - open:        whether the modal is visible
 *  - onClose:     close handler
 *  - apiKey:      MuAPI key (from the studio shell)
 *  - mediaUrl:    public URL of the generated media to publish
 *  - mediaType:   'video' | 'image' — drives which platforms are offered
 *  - defaultTitle:    prefilled title/caption (YouTube/TikTok)
 *  - defaultCaption:  prefilled caption (Instagram)
 *
 * The modal handles account connect (OAuth), account selection, publishing and
 * result polling entirely. It mirrors the standalone SocialPublishing studio but
 * is designed to be launched from any studio's output area.
 */

const EXT_UID_KEY = 'muapi_social_ext_uid';

const PLATFORMS = [
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
];

const YOUTUBE_CATEGORIES = [
  { id: '', label: 'Default (People & Blogs)' },
  { id: '1', label: 'Film & Animation' },
  { id: '2', label: 'Autos & Vehicles' },
  { id: '10', label: 'Music' },
  { id: '15', label: 'Pets & Animals' },
  { id: '17', label: 'Sports' },
  { id: '19', label: 'Travel & Events' },
  { id: '20', label: 'Gaming' },
  { id: '22', label: 'People & Blogs' },
  { id: '23', label: 'Comedy' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News & Politics' },
  { id: '26', label: 'Howto & Style' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Technology' },
  { id: '29', label: 'Nonprofits & Activism' },
];

function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getExternalUserId() {
  if (typeof window === 'undefined') return uuidv4();
  let id = localStorage.getItem(EXT_UID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(EXT_UID_KEY, id);
  }
  return id;
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

export default function SocialPublishModal({
  open,
  onClose,
  apiKey,
  mediaUrl = '',
  mediaType = 'video',
  defaultTitle = '',
  defaultCaption = '',
}) {
  const [platform, setPlatform] = useState('youtube');

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [categoryId, setCategoryId] = useState('');
  const [madeForKids, setMadeForKids] = useState(false);

  const [caption, setCaption] = useState(defaultCaption);
  const [mediaKind, setMediaKind] = useState(mediaType === 'image' ? 'IMAGE' : 'VIDEO');
  const [placement, setPlacement] = useState('reels');
  const [shareToFeed, setShareToFeed] = useState(true);

  const [tiktokTitle, setTiktokTitle] = useState(defaultTitle);
  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [manualAccountId, setManualAccountId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [pollStatus, setPollStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pollTimer = useRef(null);

  const availablePlatforms = useMemo(
    () => PLATFORMS.filter((p) => p.supports.includes(mediaType)),
    [mediaType]
  );

  // Reset transient state and sync defaults whenever the modal opens or the
  // media / type changes (e.g. launching it from a different studio output).
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setPollStatus('');
    setPublishing(false);
    setSelectedAccountId('');
    setManualAccountId('');
    setAccounts([]);
    setTitle(defaultTitle);
    setCaption(defaultCaption);
    setTiktokTitle(defaultTitle);
    setMediaKind(mediaType === 'image' ? 'IMAGE' : 'VIDEO');
    // Default to the first platform that supports this media type.
    const first = availablePlatforms[0];
    if (first && first.id !== platform) setPlatform(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mediaUrl, mediaType]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const effectiveAccountId = selectedAccountId || manualAccountId.trim();
  const platformMeta = useMemo(
    () => PLATFORMS.find((p) => p.id === platform),
    [platform]
  );

  const refreshAccounts = useCallback(
    async (silent = false) => {
      if (!apiKey) {
        if (!silent) setError('Enter your MuAPI key in Settings first.');
        return;
      }
      setLoadingAccounts(true);
      if (!silent) setError(null);
      try {
        const data = await listExternalSocialAccounts(apiKey, getExternalUserId());
        const list = Array.isArray(data) ? data : data?.accounts || [];
        setAccounts(list);
        if (list.length === 0 && !silent) {
          setError('No connected accounts yet. Use "Connect account" to authorize one.');
        }
      } catch (err) {
        if (!silent) setError(formatError(err));
      } finally {
        setLoadingAccounts(false);
      }
    },
    [apiKey]
  );

  const handleConnect = useCallback(
    async (connectPlatform) => {
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
          getExternalUserId(),
          redirectTo,
          connectPlatform
        );
        const url = data?.url || data?.authorize_url || data?.connect_url;
        if (!url) throw new Error('No connect URL returned by API.');
        window.open(url, '_blank', 'noopener,noreferrer');
        // Give the user a moment to OAuth, then refresh in case they come back.
        setTimeout(() => refreshAccounts(true), 2500);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setConnecting(false);
      }
    },
    [apiKey, refreshAccounts]
  );

  const handleDisconnect = useCallback(
    async (id) => {
      if (!apiKey) return;
      try {
        await disconnectExternalSocialAccount(apiKey, id);
        setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
        if (String(selectedAccountId) === String(id)) setSelectedAccountId('');
      } catch (err) {
        setError(formatError(err));
      }
    },
    [apiKey, selectedAccountId]
  );

  const handlePublish = useCallback(async () => {
    if (!apiKey) {
      setError('Enter your MuAPI key in Settings first.');
      return;
    }
    if (!mediaUrl.trim()) {
      setError('No media URL to publish.');
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

    try {
      let payload;
      const base = { account_id: effectiveAccountId, media_url: mediaUrl.trim() };
      if (platform === 'youtube') {
        payload = {
          ...base,
          title: title.trim() || 'Untitled',
          description: description.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
          privacy: privacy || 'public',
          category_id: categoryId.trim() || undefined,
          made_for_kids: madeForKids,
        };
      } else if (platform === 'instagram') {
        payload = {
          ...base,
          caption: caption.trim() || undefined,
          media_type: mediaKind,
          placement: placement,
          share_to_feed: shareToFeed,
        };
      } else {
        payload = {
          ...base,
          title: tiktokTitle.trim() || undefined,
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

      setPollStatus('Processing…');
      const final = await pollSocialResult(apiKey, requestId, 120, 2000);

      const out = final?.output || final?.data?.output || final;
      const link = out?.url || out?.media_id || out?.publish_id || final?.url;
      setResult({ requestId, platform, output: out, link });
      setPollStatus('');
    } catch (err) {
      setError(formatError(err));
      setPollStatus('');
    } finally {
      setPublishing(false);
    }
  }, [
    apiKey,
    mediaUrl,
    effectiveAccountId,
    platform,
    title,
    description,
    tags,
    privacy,
    categoryId,
    madeForKids,
    caption,
    mediaKind,
    placement,
    shareToFeed,
    tiktokTitle,
    privacyLevel,
    disableComment,
    disableDuet,
    disableStitch,
  ]);

  const handleCopy = useCallback(() => {
    if (!result?.link) return;
    navigator.clipboard?.writeText(String(result.link)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !publishing) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, publishing, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !publishing) onClose?.();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[#22d3ee]" />
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">Publish to social</h2>
              <p className="text-[11px] text-white/40 leading-tight">
                {mediaType === 'image' ? 'Image' : 'Video'} · YouTube · Instagram · TikTok
              </p>
            </div>
          </div>
          <button
            onClick={() => !publishing && onClose?.()}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!apiKey && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              No API key detected. Add your MuAPI key in Settings to use Social Publishing.
            </div>
          )}

          <p className="mb-3 text-[11px] text-white/40 truncate" title={mediaUrl}>
            Media: {mediaUrl || '—'}
          </p>

          {/* Platform picker */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {availablePlatforms.map((p) => {
              const Icon = p.icon;
              const active = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPlatform(p.id);
                    setResult(null);
                    setError(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                    active
                      ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={18} style={{ color: active ? p.accent : '#a1a1aa' }} />
                  <span className={`text-[11px] font-medium ${active ? 'text-white' : 'text-white/50'}`}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Account */}
          <Section title="Account">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handleConnect(platform)}
                disabled={connecting || !apiKey}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {connecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Connect {platformMeta?.name} account
              </button>
              <button
                onClick={() => refreshAccounts()}
                disabled={loadingAccounts || !apiKey}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40"
              >
                {loadingAccounts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
            </div>

            {accounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {accounts
                  .filter((a) =>
                    platform === 'instagram' ? true : a.platform_name === platform || a.platform === platform
                  )
                  .map((a) => {
                    const id = String(a.id);
                    const active = selectedAccountId === id;
                    return (
                      <div
                        key={id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                          active
                            ? 'border-[#22d3ee]/60 bg-[#22d3ee]/10 text-white'
                            : 'border-white/10 bg-white/[0.03] text-white/60'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedAccountId(id);
                            setManualAccountId('');
                          }}
                        >
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
              onChange={(e) => {
                setManualAccountId(e.target.value);
                setSelectedAccountId('');
              }}
              placeholder="Paste a known account_id"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/50"
            />
            {effectiveAccountId && (
              <p className="mt-1 text-[11px] text-white/40">Using account_id: {effectiveAccountId}</p>
            )}
          </Section>

          {/* Details */}
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
                    <label className="block text-xs font-bold text-white/30 mb-1">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50"
                    >
                      {YOUTUBE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
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
                      value={mediaKind}
                      onChange={(e) => setMediaKind(e.target.value)}
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
                <Field label="Title" value={tiktokTitle} onChange={setTiktokTitle} placeholder="Optional title" />
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
            <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && result.link && (
            <div className="mt-3 p-4 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/5">
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
                href={String(result.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#22d3ee] break-all hover:underline"
              >
                {String(result.link)}
              </a>
              <p className="mt-1 text-[11px] text-white/40">request_id: {result.requestId}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <button
            onClick={handlePublish}
            disabled={publishing || !apiKey}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#22d3ee]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
            {publishing ? (pollStatus || 'Publishing…') : `Publish to ${platformMeta?.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-3">{title}</h3>
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
