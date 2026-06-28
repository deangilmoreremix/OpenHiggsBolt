'use client';

import React from 'react';
import { X, Minimize2 } from 'lucide-react';

interface VideoPopupProps {
  show: boolean;
  videoUrl: string | null;
  minimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export default function VideoPopup({
  show,
  videoUrl,
  minimized,
  onToggleMinimize,
  onClose,
}: VideoPopupProps) {
  if (!show || !videoUrl) return null;

  if (minimized) {
    return (
      <button
        onClick={onToggleMinimize}
        style={{
          position: 'fixed',
          bottom: '140px',
          right: '54px',
          zIndex: 41,
          background: '#232b39',
          border: '2px solid #3b82f6',
          borderRadius: '50%',
          width: 54,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px 0 rgba(59,130,246,0.25)',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        title="Show video"
        aria-label="Show video"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="16" height="12" rx="3" stroke="#fff" strokeWidth="2" />
          <polygon points="15,12 11,14 11,10" fill="#3b82f6" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '150px',
        right: '40px',
        zIndex: 40,
        background: '#18181b',
        borderRadius: '18px',
        boxShadow: '0 4px 32px 0 #0008',
        padding: 0,
        minWidth: 320,
        minHeight: 180,
        maxWidth: '90vw',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <button
        onClick={onToggleMinimize}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          margin: 8,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        title="Minimize video"
        aria-label="Minimize video"
        onMouseOver={(e) => e.currentTarget.style.background = '#232b39'}
        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
      >
        <Minimize2 size={18} />
      </button>
      <video
        src={videoUrl}
        controls
        autoPlay
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '0 0 18px 18px',
          background: '#000',
          maxHeight: '50vh',
        }}
      />
    </div>
  );
}
