'use client';

import React from 'react';
import { isValidKeyFormat } from '@/lib/keys';

// Strip invisible Unicode characters that commonly corrupt copied API keys.
function cleanApiKey(key: string): string {
  if (!key) return '';
  return String(key)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')  // zero-width chars, BOM, word joiner, soft hyphen
    .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
    .trim();
}

interface ApiKeyModalProps {
  show: boolean;
  apiKeyInput: string;
  onApiKeyChange: (value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function ApiKeyModal({
  show,
  apiKeyInput,
  onApiKeyChange,
  onContinue,
  onCancel,
  disabled = false,
}: ApiKeyModalProps) {
  if (!show) return null;

  const handleContinue = () => {
    const key = cleanApiKey(apiKeyInput);
    if (!key || !isValidKeyFormat(key)) {
      alert('Please enter a valid API key (at least 8 characters, no surrounding quotes).');
      return;
    }
    onContinue();
  };

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
          Enter your MuApi API Key
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>
          Don&apos;t have an API key?&nbsp;
          <a
            href="https://muapi.ai/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'underline' }}
          >
            Get it from muapi.ai
          </a>
        </div>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => onApiKeyChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          placeholder="API Key"
          style={{
            padding: 10,
            borderRadius: 8,
            border: '1px solid #333',
            fontSize: 16,
            background: '#18181b',
            color: '#fff',
          }}
          autoFocus
          disabled={disabled}
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
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: disabled || !apiKeyInput.trim() ? 'not-allowed' : 'pointer',
              opacity: disabled || !apiKeyInput.trim() ? 0.6 : 1,
            }}
            disabled={disabled || !apiKeyInput.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
