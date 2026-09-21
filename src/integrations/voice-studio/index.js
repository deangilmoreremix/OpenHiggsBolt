/**
 * VoiceStudio native integration public API.
 *
 * Mounts the upstream VoiceStudio React application without an iframe.
 *
 * Upstream source: vendor/VoiceStudio/frontend/src/
 */

export { default as VoiceStudioWebApp } from './VoiceStudioWebApp.jsx';

export { setVoiceStudioApiBase, resolveVoiceStudioApiBase } from './api.js';

export { applyVoiceStudioTheme, clearVoiceStudioTheme } from './theme.js';
