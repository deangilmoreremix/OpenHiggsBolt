/**
 * Global Tauri API shims for web runtime.
 *
 * Upstream VoiceStudio conditionally imports @tauri-apps/* modules.
 * In a browser these modules are absent; these shims make the imports
 * resolve to no-op web-compatible implementations.
 */

import { isTauri } from 'vendor/VoiceStudio/frontend/src/utils/webCompat.js';

export const invoke = async () => {
  if (!isTauri) return null;
  throw new Error('Tauri invoke unavailable in web runtime');
};

export const listen = () => () => {};
export const emit = () => {};

export const getCurrentWindow = () => ({
  label: 'main',
  maximize: async () => {},
  minimize: async () => {},
  close: async () => {},
  setFullscreen: async () => {},
  isFullscreen: async () => false,
  setDecorations: async () => {},
  setAlwaysOnTop: async () => {},
  setSize: async () => {},
  setPosition: async () => {},
});

export const appWindow = getCurrentWindow();

export const getVersion = async () => 'web';
export const open = async () => {};
export const revealItemInDir = async () => {};
export const ask = async (message) => window.confirm(message);
export const confirm = async (message) => window.confirm(message);
export const save = async () => null;
export const openMultiple = async () => [];
export const openDirectory = async () => null;
export const relaunch = async () => {};
