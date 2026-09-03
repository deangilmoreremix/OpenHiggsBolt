/**
 * Niche Classifier
 * ------------------------------------------------------------------
 * Classifies prompt-feed records into business-relevant niches using
 * keyword matching on title, prompt text, and tags.
 *
 * Uses word-boundary regex to avoid substring false positives
 * (e.g. "car" inside "skincare", "ar" inside "glowing").
 */

import type { PromptRecord } from '@/types/go-ai-viral/prompt';

export interface NicheResult {
  /** Niches matched by keyword/context. */
  businessNiches: string[];
  /** Single strongest niche for deterministic grouping. */
  primaryNiche: string;
}

const NICHE_KEYWORDS: Record<string, string[]> = {
  'ecommerce': [
    'shopify', 'unboxing', 'checkout', 'ecommerce', 'e-commerce',
    'inventory', 'discount', 'dropshipping', 'amazon',
    'product demo', 'product video', 'store ad',
    'chanel', 'gucci', 'louis vuitton', 'watch', 'jewelry',
    'bag', 'purse', 'accessory', 'sunglasses', 'leather',
    'gold', 'diamond', 'product placement', 'sponsored',
  ],
  'real-estate': [
    'real estate', 'realtor', 'broker', 'mortgage', 'apartment',
    'condo', 'bedroom', 'living room', 'open house', 'backyard',
    'patio', 'villa', 'mansion', 'property listing', 'home staging',
    'interior design', 'real estate',
  ],
  'restaurants-food': [
    'restaurant', 'chef', 'recipe', 'dining', 'kitchen', 'meal',
    'dish', 'bake', 'bakery', 'cafe', 'coffee', 'pizza', 'burger',
    'sushi', 'ramen', 'cuisine', 'gourmet', 'delicious', 'flavor',
    'ingredient', 'plate', 'serving', 'takeout', 'dine-in',
  ],
  'beauty': [
    'beauty', 'makeup', 'skincare', 'serum', 'lipstick', 'cosmetic',
    'glow', 'skin', 'facial', 'cream', 'moisturizer', 'foundation',
    'eyeliner', 'mascara', 'blush', 'contour', 'mask', 'spa', 'salon',
    'hair', 'nail', 'perfume', 'fragrance', 'beauty influencer',
    'beauty tutorial', 'glam', 'aesthetic', 'self-care',
  ],
  'wellness-fitness': [
    'wellness', 'fitness', 'workout', 'gym', 'yoga', 'meditation',
    'health', 'exercise', 'training', 'cardio', 'strength', 'nutrition',
    'diet', 'supplement', 'protein', 'personal trainer', 'cycling',
    'pilates', 'stretch', 'mindfulness', 'mental health',
    'calm', 'relax', 'stress', 'sleep',
  ],
  'education': [
    'education', 'learn', 'course', 'tutorial', 'lesson', 'teach',
    'student', 'class', 'school', 'university', 'academy', 'training',
    'workshop', 'lecture', 'study', 'exam', 'homework', 'curriculum',
    'skill', 'knowledge', 'explain', 'how to', 'guide', 'walkthrough',
    'tips', 'tricks', 'beginner', 'advanced', 'teacher',
  ],
  'technology': [
    'technology', 'software', 'app', 'device', 'gadget',
    'laptop', 'phone', 'smartphone', 'camera', 'drone', 'robot',
    'artificial intelligence', 'machine learning', 'developer',
    'programming', 'startup', 'saas', 'platform',
    'digital', 'cyber', 'data', 'cloud', 'iot', 'vr', 'ar', '3d',
    'animation', 'render', 'synthetic', 'generation', 'ai video',
    'prompt', 'text to video', 'image to video',
  ],
  'finance': [
    'finance', 'money', 'investment', 'stock', 'crypto', 'trading',
    'bank', 'loan', 'mortgage', 'budget', 'saving', 'income', 'profit',
    'revenue', 'entrepreneur', 'funding',
    'portfolio', 'asset', 'wealth', 'tax', 'accounting', 'invoice',
    'payment', 'fintech', 'trader', 'market',
  ],
  'entertainment-media': [
    'entertainment', 'movie', 'film', 'cinema', 'television',
    'show', 'series', 'actor', 'actress', 'celebrity', 'viral', 'meme',
    'comedy', 'funny', 'humor', 'music', 'song', 'dance', 'game',
    'gaming', 'stream', 'twitch', 'youtube', 'instagram', 'tiktok',
    'reels', 'shorts', 'podcast', 'animation', 'cartoon', 'anime',
    'documentary', 'trailer', 'premiere',
  ],
  'automotive': [
    'car', 'vehicle', 'automotive', 'truck', 'suv', 'electric vehicle',
    'motorcycle', 'bike', 'drive', 'driving', 'road', 'highway',
    'garage', 'engine', 'motor', 'wheel', 'tire', 'fuel', 'charging',
    'tesla', 'hyundai', 'toyota', 'bmw', 'mercedes', 'audi', 'ford',
    'racing', 'speed', 'luxury car', 'test drive',
  ],
  'travel-hospitality': [
    'travel', 'hotel', 'resort', 'vacation', 'trip', 'flight', 'airport',
    'beach', 'island', 'destination', 'tourist', 'passport',
    'luggage', 'booking', 'airbnb', 'hostel', 'camping', 'adventure',
    'backpack', 'sightseeing', 'landmark', 'cruise',
    'journey', 'getaway', 'travel vlog', 'MiniDV', 'camcorder',
  ],
  'sports-outdoors': [
    'sport', 'athlete', 'team', 'match', 'tournament',
    'basketball', 'football', 'soccer', 'tennis', 'golf', 'baseball',
    'hockey', 'boxing', 'mma', 'ufc', 'olympic', 'fitness', 'gym',
    'outdoor', 'hiking', 'camping', 'climbing', 'surfing', 'skiing',
    'snowboard', 'cycling', 'running', 'marathon', 'extreme', 'action',
    'stunt', 'parkour', 'skateboard', 'bmx',
  ],
};

/** Build a word-boundary regex for a keyword phrase. */
function nicheRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i')
}

/** Pre-compile regexes once per niche for performance. */
const NICHE_REGEXES: Record<string, RegExp[]> = Object.fromEntries(
  Object.entries(NICHE_KEYWORDS).map(([niche, keywords]) => [
    niche,
    keywords.map(nicheRegex),
  ])
);

/**
 * Classify a prompt record into business niches.
 *
 * Falls back to:
 * 1. Any record.categories that map to a known niche
 * 2. 'general-business' when nothing matches
 */
export function classifyPrompt(record: PromptRecord): NicheResult {
  const text = [
    record.title,
    record.prompt,
    ...(record.tags || []),
    ...(record.categories || []),
  ].join(' ');

  const matches = new Map<string, number>();

  for (const [niche, regexes] of Object.entries(NICHE_REGEXES)) {
    let score = 0;
    for (const regex of regexes) {
      const m = text.match(regex);
      if (m) {
        score += m[0].length;
      }
    }
    if (score > 0) {
      matches.set(niche, score);
    }
  }

  const businessNiches = Array.from(matches.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([niche]) => niche);

  const primaryNiche = businessNiches[0] || 'general-business';

  return { businessNiches, primaryNiche };
}

/**
 * Pre-classify a batch of records.
 *
 * Returns a map of record.id -> NicheResult for fast lookup.
 */
export function classifyBatch(records: PromptRecord[]): Map<string, NicheResult> {
  const results = new Map<string, NicheResult>();
  for (const record of records) {
    results.set(record.id, classifyPrompt(record));
  }
  return results;
}
