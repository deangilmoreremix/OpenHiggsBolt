import enCommon from '../messages/en/common.json';
import zhCommon from '../messages/zh/common.json';

export const DEFAULT_LOCALE = 'en';

export const LOCALE_CONFIGS = {
  en: {
    code: 'en',
    nativeName: 'English',
    htmlLang: 'en',
    rootPath: '',
    messages: { common: enCommon },
  },
  zh: {
    code: 'zh',
    nativeName: '中文',
    htmlLang: 'zh-CN',
    rootPath: '/zh',
    messages: { common: zhCommon },
  },
};

export const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIGS);

export function isSupportedLocale(locale) {
  return Boolean(locale) && Object.prototype.hasOwnProperty.call(LOCALE_CONFIGS, locale);
}

const LOCALE_PREFIXES = Object.values(LOCALE_CONFIGS)
  .filter((config) => config.rootPath)
  .map((config) => config.rootPath)
  .sort((a, b) => b.length - a.length);

export function getLocaleFromPathname(pathname) {
  if (!pathname) return DEFAULT_LOCALE;
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const locale = Object.values(LOCALE_CONFIGS).find((config) => config.rootPath === prefix);
      return locale?.code || DEFAULT_LOCALE;
    }
  }
  return DEFAULT_LOCALE;
}

export function getLocaleConfig(locale) {
  return LOCALE_CONFIGS[locale] || LOCALE_CONFIGS[DEFAULT_LOCALE];
}

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

export function getCommonCopy(locale) {
  const config = getLocaleConfig(locale);
  if (config.code === DEFAULT_LOCALE) return LOCALE_CONFIGS[DEFAULT_LOCALE].messages.common;
  return mergeCopy(LOCALE_CONFIGS[DEFAULT_LOCALE].messages.common, config.messages.common);
}

export function resolveStudioCopy(enBundle, localeBundle, locale) {
  if (locale === DEFAULT_LOCALE) return enBundle;
  return mergeCopy(enBundle, localeBundle);
}

export function localizeStudioPath(locale, tabId) {
  const config = getLocaleConfig(locale);
  const suffix = tabId ? `/studio/${tabId}` : '/studio';
  return `${config.rootPath}${suffix}`;
}
