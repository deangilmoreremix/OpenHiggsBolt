'use client';

import { useEffect } from 'react';
import enCommon from '../messages/en/common.json';
import zhCommon from '../messages/zh/common.json';
import enAgent from '../packages/studio/src/messages/en/agentStudio.json';
import zhAgent from '../packages/studio/src/messages/zh/agentStudio.json';
import enInfluencer from '../packages/studio/src/messages/en/aiInfluencerStudio.json';
import zhInfluencer from '../packages/studio/src/messages/zh/aiInfluencerStudio.json';
import enApps from '../packages/studio/src/messages/en/appsStudio.json';
import zhApps from '../packages/studio/src/messages/zh/appsStudio.json';
import enAudio from '../packages/studio/src/messages/en/audioStudio.json';
import zhAudio from '../packages/studio/src/messages/zh/audioStudio.json';
import enCinema from '../packages/studio/src/messages/en/cinemaStudio.json';
import zhCinema from '../packages/studio/src/messages/zh/cinemaStudio.json';
import enClipping from '../packages/studio/src/messages/en/clippingStudio.json';
import zhClipping from '../packages/studio/src/messages/zh/clippingStudio.json';
import enImage from '../packages/studio/src/messages/en/imageStudio.json';
import zhImage from '../packages/studio/src/messages/zh/imageStudio.json';
import enLayers from '../packages/studio/src/messages/en/layersStudio.json';
import zhLayers from '../packages/studio/src/messages/zh/layersStudio.json';
import enLipSync from '../packages/studio/src/messages/en/lipSyncStudio.json';
import zhLipSync from '../packages/studio/src/messages/zh/lipSyncStudio.json';
import enMarketing from '../packages/studio/src/messages/en/marketingStudio.json';
import zhMarketing from '../packages/studio/src/messages/zh/marketingStudio.json';
import enRecast from '../packages/studio/src/messages/en/recastStudio.json';
import zhRecast from '../packages/studio/src/messages/zh/recastStudio.json';
import enVibe from '../packages/studio/src/messages/en/vibeMotionStudio.json';
import zhVibe from '../packages/studio/src/messages/zh/vibeMotionStudio.json';
import enVideo from '../packages/studio/src/messages/en/videoStudio.json';
import zhVideo from '../packages/studio/src/messages/zh/videoStudio.json';

const BUNDLES = [
  [enCommon, zhCommon],
  [enAgent, zhAgent],
  [enInfluencer, zhInfluencer],
  [enApps, zhApps],
  [enAudio, zhAudio],
  [enCinema, zhCinema],
  [enClipping, zhClipping],
  [enImage, zhImage],
  [enLayers, zhLayers],
  [enLipSync, zhLipSync],
  [enMarketing, zhMarketing],
  [enRecast, zhRecast],
  [enVibe, zhVibe],
  [enVideo, zhVideo],
];

const ATTRIBUTES = ['placeholder', 'title', 'aria-label'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectPairs(enValue, zhValue, pairs) {
  if (typeof enValue === 'string' && typeof zhValue === 'string') {
    if (enValue && zhValue && enValue !== zhValue) pairs.push([enValue, zhValue]);
    return;
  }
  if (!enValue || !zhValue || typeof enValue !== 'object' || typeof zhValue !== 'object') return;
  for (const key of Object.keys(enValue)) {
    if (Object.prototype.hasOwnProperty.call(zhValue, key)) {
      collectPairs(enValue[key], zhValue[key], pairs);
    }
  }
}

function buildTranslator() {
  const pairs = [];
  for (const [enBundle, zhBundle] of BUNDLES) collectPairs(enBundle, zhBundle, pairs);

  const exact = new Map();
  const templates = [];
  for (const [english, chinese] of pairs) {
    const tokenMatches = [...english.matchAll(/\{([A-Za-z0-9_]+)\}/g)];
    if (!tokenMatches.length) {
      if (!exact.has(english)) exact.set(english, chinese);
      continue;
    }

    let cursor = 0;
    let pattern = '^';
    const tokens = [];
    for (const match of tokenMatches) {
      pattern += escapeRegExp(english.slice(cursor, match.index));
      pattern += '(.+?)';
      tokens.push(match[1]);
      cursor = match.index + match[0].length;
    }
    pattern += escapeRegExp(english.slice(cursor)) + '$';
    templates.push({ regex: new RegExp(pattern), tokens, chinese });
  }

  const cache = new Map();
  return (rawValue) => {
    if (!rawValue || typeof rawValue !== 'string') return rawValue;
    if (cache.has(rawValue)) return cache.get(rawValue);

    const trimmed = rawValue.trim();
    if (!trimmed) return rawValue;
    let translated = exact.get(trimmed);

    if (!translated) {
      for (const template of templates) {
        const match = trimmed.match(template.regex);
        if (!match) continue;
        const values = {};
        template.tokens.forEach((token, index) => { values[token] = match[index + 1]; });
        translated = template.chinese.replace(/\{([A-Za-z0-9_]+)\}/g, (_, token) => values[token] ?? `{${token}}`);
        break;
      }
    }

    const result = translated ? rawValue.replace(trimmed, translated) : rawValue;
    cache.set(rawValue, result);
    return result;
  };
}

function localizeElement(root, translate) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    const parentTag = root.parentElement?.tagName;
    if (!parentTag || SKIP_TAGS.has(parentTag)) return;
    const next = translate(root.nodeValue);
    if (next !== root.nodeValue) root.nodeValue = next;
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has(root.tagName)) return;

  if (root.nodeType === Node.ELEMENT_NODE) {
    for (const attribute of ATTRIBUTES) {
      if (!root.hasAttribute(attribute)) continue;
      const current = root.getAttribute(attribute);
      const next = translate(current);
      if (next !== current) root.setAttribute(attribute, next);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parentTag = node.parentElement?.tagName;
      if (parentTag && !SKIP_TAGS.has(parentTag)) {
        const next = translate(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(node.tagName)) {
      for (const attribute of ATTRIBUTES) {
        if (!node.hasAttribute(attribute)) continue;
        const current = node.getAttribute(attribute);
        const next = translate(current);
        if (next !== current) node.setAttribute(attribute, next);
      }
    }
    node = walker.nextNode();
  }
}

// SmartVideo contains heavily customized upstream studios. Replacing those files
// just to adopt upstream's locale props would remove local Assist/Publish,
// Storyboard, Template, Skills and branding behavior. This bridge applies the
// registered upstream EN→ZH copy pairs to the rendered UI on /zh instead. Local
// SmartVideo-only strings remain untouched unless they have an explicit common
// translation above.
export default function LocaleTextBridge({ locale = 'en' }) {
  useEffect(() => {
    if (locale !== 'zh' || typeof document === 'undefined') return undefined;
    const translate = buildTranslator();
    localizeElement(document.body, translate);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          localizeElement(mutation.target, translate);
        } else if (mutation.type === 'attributes') {
          localizeElement(mutation.target, translate);
        } else {
          mutation.addedNodes.forEach((node) => localizeElement(node, translate));
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
