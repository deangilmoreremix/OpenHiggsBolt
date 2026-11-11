'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import SocialPublishStepper from './social-publishing/SocialPublishStepper';
import { WriteStep } from './social-publishing/steps/WriteStep';
import ThumbnailStep from './social-publishing/steps/ThumbnailStep';
import DestinationsStep from './social-publishing/steps/DestinationsStep';
import ReviewPublishStep from './social-publishing/steps/ReviewPublishStep';
import type {
  Asset,
  CopyState,
  ThumbnailState,
  Destination,
  PublishResult,
  WriteCopyState,
} from './social-publishing/types';

interface SocialPublishModalProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  asset: Asset | null;
  writeCopy: WriteCopyState;
  socialCopy: CopyState;
  thumbnail: ThumbnailState;
  destinations: Destination[];
  publishResults: PublishResult[];
  updateWriteCopy: (copy: WriteCopyState) => void;
  updateSocialCopy: (copy: CopyState) => void;
  updateThumbnail: (state: ThumbnailState) => void;
  updateDestinations: (destinations: Destination[]) => void;
  updatePublishResults: (results: PublishResult[]) => void;
}

const TOTAL_STEPS = 4;

export default function SocialPublishModal({
  open,
  onClose,
  apiKey,
  currentStep,
  setCurrentStep,
  asset,
  writeCopy,
  socialCopy,
  thumbnail,
  destinations,
  publishResults,
  updateWriteCopy,
  updateSocialCopy,
  updateThumbnail,
  updateDestinations,
  updatePublishResults,
}: SocialPublishModalProps) {
  const [publishing, setPublishing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleContinue = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, setCurrentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  }, [currentStep, setCurrentStep, onClose]);

  const handlePublish = useCallback(
    async (dests: Destination[]) => {
      setPublishing(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateDestinations(dests);
      } finally {
        setPublishing(false);
      }
    },
    [updateDestinations]
  );

  const canContinue = useMemo(() => {
    if (!asset) return false;
    if (currentStep === 0) return true;
    if (currentStep === 1) return true;
    if (currentStep === 2) return destinations.length > 0;
    if (currentStep === 3) return true;
    return false;
  }, [asset, currentStep, destinations]);

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const showPreview = asset && (asset.type === 'image' || asset.type === 'video');

  if (!open) return null;

  const safeAsset = asset as Asset;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-publish-title"
        aria-live="polite"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="w-full max-w-[1100px] lg:max-w-[1300px] max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-[#22d3ee] flex-shrink-0" />
              <div>
                <h2 id="social-publish-title" className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                  Publish to social
                </h2>
                <p className="text-[11px] text-white/40 leading-tight">
                  {safeAsset.type === 'image' ? 'Image' : 'Video'} · YouTube · Instagram · TikTok
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <SocialPublishStepper currentStep={currentStep} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile stepper */}
        <div className="sm:hidden px-5 pt-3 flex-shrink-0">
          <SocialPublishStepper currentStep={currentStep} />
        </div>

        {/* Scrollable workspace */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main editor */}
            <div className="flex-1 min-w-0">
              {currentStep === 0 && safeAsset && (
                <WriteStep asset={safeAsset} copy={writeCopy} onUpdateCopy={updateWriteCopy} />
              )}
              {currentStep === 1 && safeAsset && (
                <ThumbnailStep
                  asset={safeAsset}
                  thumbnail={thumbnail}
                  onUpdateThumbnail={updateThumbnail}
                  copy={socialCopy}
                />
              )}
              {currentStep === 2 && safeAsset && (
                <DestinationsStep
                  asset={safeAsset}
                  copy={socialCopy}
                  destinations={destinations}
                  onChange={updateDestinations}
                  publishResults={publishResults}
                  onPublish={updateDestinations}
                  onUpdatePublishResults={updatePublishResults}
                  publishing={publishing}
                  apiKey={apiKey}
                  mediaType={safeAsset.type}
                />
              )}
              {currentStep === 3 && (
                <ReviewPublishStep
                  asset={safeAsset}
                  copy={socialCopy}
                  thumbnail={thumbnail}
                  destinations={destinations}
                  publishResults={publishResults}
                  onConfirm={() => { void handlePublish(destinations); }}
                  onBack={handleBack}
                  publishing={publishing}
                />
              )}
            </div>

            {/* Live preview */}
            {showPreview && (
              <div className="w-full lg:w-[340px] flex-shrink-0">
                <div className="sticky top-0 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-3">
                    Preview
                  </h3>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                    {safeAsset.type === 'image' ? (
                      <img
                        src={safeAsset.url}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={safeAsset.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-white/50 truncate" title={safeAsset.url}>
                      {safeAsset.url}
                    </p>
                    {socialCopy.title && (
                      <p className="text-xs text-[var(--text-primary)] font-medium truncate">
                        {socialCopy.title}
                      </p>
                    )}
                    {socialCopy.caption && (
                      <p className="text-xs text-white/60 line-clamp-2">
                        {socialCopy.caption}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
          >
            <ChevronLeft size={16} />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#22d3ee]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLastStep ? 'Publish' : 'Continue'}
              {!isLastStep && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            div[class*='max-w'] {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
