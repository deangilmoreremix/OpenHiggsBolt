'use client';

import React from 'react';

interface ImageUrlModalProps {
  show: boolean;
  imageUrlInput: string;
  onUrlChange: (value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export default function ImageUrlModal({
  show,
  imageUrlInput,
  onUrlChange,
  onContinue,
  onCancel,
}: ImageUrlModalProps) {
  if (!show) return null;

  const isValid = /^https?:\/\//.test(imageUrlInput);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#232b39',
          padding: 32,
          borderRadius: 16,
          minWidth: 320,
          boxShadow: '0 4px 32px 0 #0008',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Enter Image URL
        </div>
        <input
          type="text"
          value={imageUrlInput}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #333',
            fontSize: 16,
            background: '#18181b',
            color: '#fff',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#232b39',
              color: '#fff',
              border: '1px solid #444',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.6,
            }}
            disabled={!isValid}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
