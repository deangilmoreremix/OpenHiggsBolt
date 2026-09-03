'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';
import { ENTITLEMENTS } from './entitlements';

const STUDIO_NAMES: Record<string, string> = {
  [ENTITLEMENTS.SMARTVIDEO_GO]: 'SmartVideo GO',
  [ENTITLEMENTS.SMARTVIDEO_AI]: 'SmartVideo AI',
  [ENTITLEMENTS.FOUNDERS]: 'Founders',
  'video-studio': 'Video Studio',
  'image-studio': 'Image Studio',
  'photo-studio': 'Photo Studio',
  'vfx-studio': 'VFX Studio',
  'design-agent': 'Design Agent',
  'storyboard': 'Storyboard',
  'go-ai-viral': 'GO-Viral',
  'cinema-studio': 'Cinema Studio',
  'thumbnail-studio': 'Thumbnail Studio',
  'social-publishing': 'Social Publishing',
  'default': 'SmartVideo GO',
};

export default function UpgradeModal() {
  const { upgradeModal, setUpgradeModal, isSignedIn } = useSmartVideoAccess();
  const [email, setEmail] = React.useState('');
  const [restoreStatus, setRestoreStatus] = React.useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);

  if (!upgradeModal.isOpen) return null;

  const studioName = STUDIO_NAMES[upgradeModal.source] || STUDIO_NAMES[ENTITLEMENTS.SMARTVIDEO_GO];

  const handleClose = () => {
    setUpgradeModal({ isOpen: false, source: upgradeModal.source });
    setRestoreStatus(null);
    setRestoreMessage(null);
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsRestoring(true);
    setRestoreStatus(null);
    setRestoreMessage(null);
    try {
      const res = await fetch('/api/access/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreStatus(data.status);
        setRestoreMessage(data.message);
        if (data.status === 'restored' || data.status === 'already_active') {
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 1500);
        }
      } else {
        setRestoreStatus('error');
        setRestoreMessage(data.error || 'Failed to restore access.');
      }
    } catch {
      setRestoreStatus('error');
      setRestoreMessage('Network error. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Unlock {studioName}
          </h2>
          <p className="text-sm text-white/60">
            You&apos;re exploring {studioName}.
            <br />
            Upgrade to create with this Studio and unlock SmartVideo GO creation tools.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {[
            'AI Video Generation',
            'AI Image Generation',
            'Avatar Tools',
            'Templates',
            'Video Agents',
            'Publishing',
            'All SmartVideo GO Studios',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-white/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </div>
          ))}
        </div>

        <a
          href={process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL || '/#pricing'}
          className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold text-center hover:opacity-90 transition-opacity mb-3"
        >
          Unlock SmartVideo GO
        </a>

        {isSignedIn && (
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-xs text-white/40 text-center mb-3">
              Already purchased? Restore your access.
            </p>
            <form onSubmit={handleRestore} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your purchase email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50"
              />
              <button
                type="submit"
                disabled={isRestoring || !email.trim()}
                className="w-full py-2 rounded-lg border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Restore Access'}
              </button>
              {restoreStatus && (
                <p className={`text-xs text-center ${restoreStatus === 'restored' || restoreStatus === 'already_active' ? 'text-green-400' : 'text-red-400'}`}>
                  {restoreMessage}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
