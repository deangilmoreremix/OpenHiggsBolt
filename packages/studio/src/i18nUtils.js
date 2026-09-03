// Tiny, dependency-free locale-copy resolver shared by Studio components.
// A caller may pass an explicit locale. When the customized SmartVideo shell
// has not forwarded one, the resolver also recognizes additive /zh routes in
// the browser so localized studios still select their Chinese bundle.

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeCopy(base, override) {
  if (!override) return base;
  if (!base) return override;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;

  const merged = { ...base };
  for (const key of Object.keys(override)) {
    merged[key] = isPlainObject(base[key]) && isPlainObject(override[key])
      ? mergeCopy(base[key], override[key])
      : override[key];
  }
  return merged;
}

export function resolveRuntimeLocale(locale) {
  return locale && locale !== 'en' ? locale : 'en';
}

// `en` is the required default bundle; `localeBundle` is the override for
// the active locale. Missing translated keys fall back to English.
export function resolveCopy(en, localeBundle, locale) {
  const activeLocale = resolveRuntimeLocale(locale);
  if (!activeLocale || activeLocale === 'en') return en;
  return mergeCopy(en, localeBundle);
}
