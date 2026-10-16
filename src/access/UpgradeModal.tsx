'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useSmartVideoAccess } from './SmartVideoAccessProvider';

const FEATURES = [
  'AI Video Generation',
  'AI Image Generation',
  'Avatar Tools',
  'Templates',
  'Video Agents',
  'Publishing',
  'All SmartVideo GO Studios',
];

export default function UpgradeModal() {
  const { upgradeModal, setUpgradeModal, isSignedIn } = useSmartVideoAccess();
  const [email, setEmail] = React.useState('');
  const [restoreStatus, setRestoreStatus] = React.useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [showRestoreForm, setShowRestoreForm] = React.useState(false);
  const [isCheckoutPending, setIsCheckoutPending] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  if (!upgradeModal.isOpen) return null;

  const checkoutUrl = process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL;

  const handleClose = () => {
    setUpgradeModal({ isOpen: false, source: upgradeModal.source });
    setRestoreStatus(null);
    setRestoreMessage(null);
    setShowRestoreForm(false);
    setCheckoutError(null);
    setIsCheckoutPending(false);
  };

  const handleCheckout = async () => {
    setIsCheckoutPending(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro_lifetime' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err?.message || 'Something went wrong. Please try again.');
      setIsCheckoutPending(false);
    }
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
            Unlock SmartVideo GO AI
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            You&apos;ve explored the possibilities. Activate your access to generate
            videos, personalize your content, and use the AI creation tools.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-white/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </div>
          ))}
        </div>

        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold text-center hover:opacity-90 transition-opacity mb-3"
          >
            Get SmartVideo GO AI
          </a>
        ) : (
          <>
            <button
              onClick={handleCheckout}
              disabled={isCheckoutPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold text-center hover:opacity-90 transition-opacity mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckoutPending ? 'Redirecting…' : 'Get SmartVideo GO AI'}
            </button>
            {checkoutError && (
              <p role="alert" className="mb-3 text-xs text-red-400 text-center">
                {checkoutError}
              </p>
            )}
          </>
        )}

        {isSignedIn && (
          <div className="mb-3">
            <button
              onClick={() => setShowRestoreForm((v) => !v)}
              aria-expanded={showRestoreForm}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              Already Purchased? Restore Access
            </button>
            {showRestoreForm && (
              <form onSubmit={handleRestore} className="space-y-2 mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
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
            )}
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
}
