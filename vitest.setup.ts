// Global Vitest setup for React 19 act() compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}
