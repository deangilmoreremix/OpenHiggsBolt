'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'lucide-react';
import ApiKeyModal from './ApiKeyModal';
import ImageUrlModal from './ImageUrlModal';
import VideoPopup from './VideoPopup';

const LOCAL_PREFIX = '/vfx-effects';

function getLocalPath(cdnPath: string): string {
  return LOCAL_PREFIX + cdnPath.replace('https://d3adwkbyhxyrtq.cloudfront.net', '');
}

function EffectPreviewImage({ src, fallbackEmoji, style }: { src: string; fallbackEmoji?: string; style?: React.CSSProperties }) {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src);
    setShowFallback(false);
  }, [src]);

  const handleError = () => {
    const local = getLocalPath(src);
    if (imgSrc === src && local !== src) {
      setImgSrc(local);
    } else {
      setShowFallback(true);
    }
  };

  if (showFallback) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #23232b', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181b', fontSize: 18, ...style }}>
        {fallbackEmoji || '🎬'}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={fallbackEmoji || 'Effect preview'}
      style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #23232b', ...style }}
      onError={handleError}
    />
  );
}

type AspectRatio = '16:9' | '9:16' | '1:1';
type Resolution = '480p' | '720p';
type Quality = 'medium' | 'high';

interface BottomInputBarProps {
  showInputBar: boolean;
  setShowInputBar: (show: boolean) => void;
  showChatButton: boolean;
  setShowChatButton: (show: boolean) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  inputText: string;
  setInputText: (text: string) => void;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  selectedAspect: AspectRatio;
  setSelectedAspect: (aspect: AspectRatio) => void;
  selectedDuration: number;
  setSelectedDuration: (duration: number) => void;
  selectedResolution: Resolution;
  setSelectedResolution: (resolution: Resolution) => void;
  selectedQuality: Quality;
  setSelectedQuality: (quality: Quality) => void;
  fileInputRef: React.Ref<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleGenerate: (apiKey?: string) => void;
  handleCancel: () => void;
  handleReset: () => void;
  selectedEffect: { id: string; name: string; preview?: string } | null;
  setSelectedEffect: (effect: { id: string; name: string; preview?: string } | null) => void;
  loading: boolean;
  status: string;
  progress: number;
  error: string;
  videoUrl: string | null;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
}

export default function BottomInputBar({
  showInputBar,
  setShowInputBar,
  showChatButton,
  setShowChatButton,
  uploadedFile,
  setUploadedFile,
  previewUrl,
  setPreviewUrl,
  inputText,
  setInputText,
  imageUrl,
  setImageUrl,
  selectedAspect,
  setSelectedAspect,
  selectedDuration,
  setSelectedDuration,
  selectedResolution,
  setSelectedResolution,
  selectedQuality,
  setSelectedQuality,
  fileInputRef,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleGenerate,
  handleCancel,
  handleReset,
  selectedEffect,
  setSelectedEffect,
  loading,
  status,
  progress,
  error,
  videoUrl,
  userApiKey,
  setUserApiKey,
}: BottomInputBarProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [minimizedVideoPopup, setMinimizedVideoPopup] = useState(false);

  // Set default dropdown values
  useEffect(() => {
    if (!selectedAspect) setSelectedAspect('9:16');
    if (!selectedDuration) setSelectedDuration(5);
    if (!selectedResolution) setSelectedResolution('480p');
    if (!selectedQuality) setSelectedQuality('medium');
  }, [selectedAspect, selectedDuration, selectedResolution, selectedQuality, setSelectedAspect, setSelectedDuration, setSelectedResolution, setSelectedQuality]);

  const videoUrlToShow = videoUrl || (imageUrl && imageUrl.endsWith('.mp4') ? imageUrl : null);

  // Show video popup when video URL is available
  useEffect(() => {
    if (videoUrlToShow && status === 'completed') {
      setShowVideoPopup(true);
      setMinimizedVideoPopup(false);
    }
  }, [videoUrlToShow, status]);

  function handleGenerateWithApiKey(e: React.FormEvent) {
    e.preventDefault();
    // Validation: require effect selection AND (image or text)
    const hasImage = (uploadedFile && previewUrl) || (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')));
    const hasText = inputText && inputText.trim().length > 0;
    // Dropdown validation
    if (!selectedAspect || !selectedDuration || !selectedResolution || !selectedQuality) {
      alert('Please select all dropdown options (aspect ratio, duration, size, and quality) before generating.');
      return;
    }
    if (!selectedEffect) {
      alert('Please select an effect before generating.');
      return;
    }
    if (!(hasImage || hasText)) {
      alert('Please provide an image or a text prompt before generating.');
      return;
    }
    // If user has entered their own API key, use it; otherwise prompt for one
    if (userApiKey.trim()) {
      handleGenerate(userApiKey.trim());
    } else {
      setShowApiKeyModal(true);
      setPendingGenerate(true);
    }
  }

  function handleApiKeyContinue() {
    const key = apiKeyInput.trim();
    if (key) {
      // Clean the key before saving to prevent invisible Unicode characters
      // from causing 401 errors during API calls
      const cleanedKey = key
        .replace(/[​-‍﻿﻿­]/g, '')
        .replace(/^[\s\x00-\x1F]+|[\s\x00-\x1F]+$/g, '')
        .trim();
      localStorage.setItem('muapi_key', cleanedKey);
      setUserApiKey(cleanedKey);
      setImageUrl('');
    }
    setShowApiKeyModal(false);
    setPendingGenerate(false);
    setApiKeyInput('');
    // Auto-close input bar and scroll to video section
    setShowInputBar(false);
    // Scroll to video section after a short delay
    setTimeout(() => {
      const videoSection = document.getElementById('video-generation-status');
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    // Call the real generate handler with the provided API key
    handleGenerate(key || undefined);
  }

  const InlineDropdown = ({ value, onChange, options = [], placeholder = 'Select' }: {
    value: string | number;
    onChange: (e: { target: { value: string } }) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      function handleClick(e: MouseEvent) {
        if (
          buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const selected = options.find((opt) => opt.value === String(value));

    return (
      <div style={{ position: 'relative', minWidth: 120 }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%',
            background: '#10141c',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 18px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
            outline: open ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? selected.label : <span style={{ color: '#9ca3af' }}>{placeholder}</span>}
        </button>
        {open && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '110%',
              background: '#18181b',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
              zIndex: 100,
              padding: '6px 0',
              marginTop: 4,
              minWidth: 120,
            }}
            role="listbox"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                onClick={(e) => {
                  setOpen(false);
                  onChange({ target: { value: opt.value } } as unknown as React.ChangeEvent<HTMLSelectElement>);
                }}
                style={{
                  padding: '10px 18px',
                  color: value === opt.value ? '#3b82f6' : '#fff',
                  background: value === opt.value ? 'rgba(59,130,246,0.08)' : 'none',
                  fontWeight: value === opt.value ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  border: 'none',
                  outline: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = value === opt.value ? 'rgba(59,130,246,0.08)' : 'none')}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {showInputBar && (
        <div
          style={{
            position: 'fixed',
            bottom: '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            maxWidth: '95vw',
            zIndex: 20,
            borderRadius: '20px',
            background: 'linear-gradient(120deg, rgb(30, 39, 55) 0%, #1e2235 60%, rgb(7, 31, 69) 100%)',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.45)',
            border: '1.5px solid #232b39',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
            transition: 'background 0.4s',
          }}
        >
          {/* Close Arrow */}
          <button
            onClick={() => {
              setShowInputBar(false);
              setShowChatButton(true);
            }}
            style={{
              position: 'absolute',
              top: 8,
              right: 16,
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '22px',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'color 0.2s',
            }}
            title="Close"
            aria-label="Close"
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            style={{
              padding: '24px 28px 18px 28px',
              borderRadius: '20px',
              background: 'transparent',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Top row: Upload button */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setImageUrlInput('');
                  setShowImageUrlModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(35,43,57,0.95)',
                  padding: '8px 28px',
                  borderRadius: '999px',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#232b39'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(35,43,57,0.95)'}
              >
                <Image size={18} />
                <span>Image URL</span>
              </button>
              <div style={{ flex: 1 }} />
            </div>
            {/* Middle row: Input and send */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(35,43,57,0.95)',
                borderRadius: '12px',
                padding: '0 18px',
                marginBottom: '0',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              }}
            >
              <input
                type="text"
                placeholder="Enter your prompt here"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#d1d5db',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  padding: '14px 0',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              />
              <button
                type="button"
                onClick={handleGenerateWithApiKey}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, rgb(26, 40, 62) 60%, rgb(29, 8, 79) 100%)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '8px',
                  marginLeft: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px 0 rgba(59,130,246,0.15)',
                  transition: 'background 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgb(21, 29, 43) 60%, rgb(15, 6, 67) 100%)'}
              >
                <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {/* Bottom row: Dropdowns */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginTop: '2px',
                marginBottom: 0,
                width: '100%',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                <label style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 4, marginLeft: 2 }}>
                  Aspect Ratio
                </label>
                <InlineDropdown
                  value={selectedAspect}
                  onChange={(e) => setSelectedAspect(e.target.value as AspectRatio)}
                  options={[
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' },
                    { value: '1:1', label: '1:1' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                <label style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 4, marginLeft: 2 }}>
                  Duration
                </label>
                <InlineDropdown
                  value={String(selectedDuration)}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  options={[
                    { value: '5', label: '5s' },
                    { value: '10', label: '10s' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                <label style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 4, marginLeft: 2 }}>
                  Resolution
                </label>
                <InlineDropdown
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value as Resolution)}
                  options={[
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
                <label style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 4, marginLeft: 2 }}>
                  Quality
                </label>
                <InlineDropdown
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value as Quality)}
                  options={[
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                />
              </div>
              <div style={{ flex: 1 }} />
            </div>
             {/* Show selected effect if any */}
             {selectedEffect && (
               <div
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px',
                   background: '#232b39',
                   borderRadius: '10px',
                   padding: '6px 14px',
                   marginBottom: '8px',
                   marginTop: '2px',
                   color: '#fff',
                   fontWeight: 500,
                   fontSize: '15px',
                   boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
                 }}
               >
                 {selectedEffect.preview && (
                   <EffectPreviewImage src={selectedEffect.preview} fallbackEmoji={selectedEffect.name} />
                 )}
                 <span>{selectedEffect.name}</span>
                 <button
                   onClick={() => setSelectedEffect(null)}
                   style={{
                     marginLeft: 8,
                     background: 'none',
                     border: 'none',
                     color: '#9ca3af',
                     fontSize: 18,
                     cursor: 'pointer',
                     borderRadius: '50%',
                     width: 28,
                     height: 28,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     transition: 'background 0.2s',
                   }}
                   title="Remove selected effect"
                   aria-label="Remove selected effect"
                   onMouseOver={(e) => e.currentTarget.style.background = '#2d2d2d'}
                   onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                 >
                   ×
                 </button>
               </div>
             )}
            {/* Preview uploaded file or image URL */}
            {imageUrl && (
              <div
                style={{
                  marginTop: '12px',
                  textAlign: 'left',
                  maxWidth: '180px',
                  minHeight: '90px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#232b39',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    cursor: 'pointer',
                    zIndex: 2,
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
                    transition: 'background 0.2s',
                  }}
                  title="Remove preview"
                  aria-label="Remove preview"
                  onMouseOver={(e) => e.currentTarget.style.background = '#2d2d2d'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#232b39'}
                >
                  ×
                </button>
                <img
                  src={imageUrl}
                  alt="Image URL Preview"
                  style={{
                    maxWidth: '160px',
                    maxHeight: '90px',
                    borderRadius: '8px',
                    border: '1px solid #23232b',
                    background: '#18181b',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '';
                    e.currentTarget.alt = 'Invalid image URL';
                  }}
                />
              </div>
            )}
            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {loading ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'rgba(35,43,57,0.95)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  }}
                >
                  Cancel
                </button>
              ) : status === 'completed' && videoUrl ? (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, rgb(26, 40, 62) 60%, rgb(29, 8, 79) 100%)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px 0 rgba(59,130,246,0.15)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgb(21, 29, 43) 60%, rgb(15, 6, 67) 100%)'}
                >
                  New Video
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!selectedEffect || !imageUrl || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, rgb(26, 40, 62) 60%, rgb(29, 8, 79) 100%)',
                    color: '#fff',
                    border: 'none',
                    cursor: !selectedEffect || !imageUrl || loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px 0 rgba(59,130,246,0.15)',
                    opacity: !selectedEffect || !imageUrl || loading ? 0.6 : 1,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgb(21, 29, 43) 60%, rgb(15, 6, 67) 100%)'}
                >
                  Generate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Small Chat Button (when input bar is closed) */}
      {showChatButton && !showInputBar && (
        <button
          onClick={() => {
            setShowInputBar(true);
            setShowChatButton(false);
          }}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '40px',
            zIndex: 30,
            background: 'linear-gradient(120deg, #232b39 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '54px',
            height: '54px',
            boxShadow: '0 4px 24px 0 rgba(59,130,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          title="Open Chat"
          aria-label="Open Chat"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        show={showApiKeyModal}
        apiKeyInput={apiKeyInput}
        onApiKeyChange={setApiKeyInput}
        onContinue={handleApiKeyContinue}
        onCancel={() => {
          setShowApiKeyModal(false);
          setPendingGenerate(false);
          setApiKeyInput('');
        }}
        disabled={loading}
      />

      {/* Image URL Modal */}
      <ImageUrlModal
        show={showImageUrlModal}
        imageUrlInput={imageUrlInput}
        onUrlChange={setImageUrlInput}
        onContinue={() => {
          if (/^https?:\/\//.test(imageUrlInput)) {
            setImageUrl(imageUrlInput);
            setShowImageUrlModal(false);
            setImageUrlInput('');
          } else {
            alert('Please enter a valid image URL (http/https)');
          }
        }}
        onCancel={() => {
          setShowImageUrlModal(false);
          setImageUrlInput('');
        }}
      />

      {/* Video Popup */}
      <VideoPopup
        show={showVideoPopup}
        videoUrl={videoUrlToShow}
        minimized={minimizedVideoPopup}
        onToggleMinimize={() => setMinimizedVideoPopup(!minimizedVideoPopup)}
        onClose={() => {
          setShowVideoPopup(false);
          setMinimizedVideoPopup(false);
        }}
      />
    </>
  );
}
