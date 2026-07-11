// Shared Clerk appearance so the sign-in / sign-up pages match the dark,
// cyan + purple SmartVideo GO branding.
//
// NOTE: This file lives at the repo root, which is outside Tailwind's content
// globs, so we deliberately use custom class names (svgo-*) that are styled
// with plain CSS in app/globals.css rather than Tailwind utility classes.
const brandAppearance = {
  variables: {
    colorPrimary: '#22d3ee',
    colorBackground: '#050505',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.6)',
    colorInputBackground: 'rgba(255,255,255,0.04)',
    colorInputText: '#ffffff',
    colorDanger: '#f87171',
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    formButtonPrimary: 'svgo-gradient-btn',
    card: 'svgo-card',
    socialButtonsBlockButton: 'svgo-social-btn',
    socialButtonsBlockButtonText: 'svgo-social-btn-text',
    formFieldInput: 'svgo-input',
    footerActionLink: 'svgo-link',
    footerActionText: 'svgo-footer-text',
    headerTitle: 'svgo-header-title',
    headerSubtitle: 'svgo-header-subtitle',
    dividerText: 'svgo-divider-text',
    dividerLine: 'svgo-divider-line',
  },
};

export default brandAppearance;
