/**
 * Natural-language questions a customer might type into "Ask SmartVideo", with where the answer lives.
 * None of the studio questions name the studio, because real users rarely do.
 * Used by tests/help-natural-language.vitest.test.ts to guard retrieval quality.
 */
export interface HelpQuestion {
  q: string;
  /** studio chunks for this studio id */
  studio?: string;
  /** academy lessons in any of these tracks (folder names) */
  track?: string[];
  /** reseller lesson ids (prefix match, e.g. "13." matches 13.5) */
  reseller?: string[];
}

export const STUDIO_QUESTIONS: HelpQuestion[] = [
  { q: 'make a picture from a text description', studio: 'image' },
  { q: 'how many photos can I upload as a reference when making images', studio: 'image' },
  { q: 'change the style of my photo with ai', studio: 'image' },
  { q: 'build a brand kit with my colors and logo', studio: 'brand-studio' },
  { q: 'create social posts that match my brand voice', studio: 'brand-studio' },
  { q: 'turn a still photo into a moving video', studio: 'video' },
  { q: 'generate a short clip from a prompt', studio: 'video' },
  { q: 'which video model should I pick', studio: 'video' },
  { q: 'trim and combine my clips on a timeline', studio: 'edit' },
  { q: 'add captions and music to my finished video', studio: 'edit' },
  { q: 'make a voiceover from text', studio: 'audio' },
  { q: 'clone a voice so it sounds like me', studio: 'audio' },
  { q: 'generate background music for my video', studio: 'audio' },
  { q: 'cut a long podcast into short clips', studio: 'clipping' },
  { q: 'find the best moments in a long video', studio: 'clipping' },
  { q: 'make an animated title graphic', studio: 'vibe-motion' },
  { q: 'create motion graphics without after effects', studio: 'vibe-motion' },
  { q: 'make a character copy the moves from my video', studio: 'motion-control' },
  { q: 'transfer dance motion onto my character', studio: 'motion-control' },
  { q: 'make a photo talk with my recording', studio: 'lipsync' },
  { q: 'sync a mouth to my audio', studio: 'lipsync' },
  { q: 'make my character speak these words', studio: 'lipsync' },
  { q: 'set the camera angle and lens for a shot', studio: 'cinema' },
  { q: 'make a scene look like a movie with depth of field', studio: 'cinema' },
  { q: 'plan my scenes before I generate anything', studio: 'storyboard' },
  { q: 'turn a script into a shot list', studio: 'storyboard' },
  { q: 'render a finished video from a template', studio: 'zackd' },
  { q: 'swap the text in a video template', studio: 'zackd' },
  { q: 'create a product ad for my store', studio: 'marketing' },
  { q: 'make a commercial for my product', studio: 'marketing' },
  { q: 'have an ai direct a whole film for me', studio: 'motion-director' },
  { q: 'make a film from my brand website with music and cuts', studio: 'motion-director' },
  { q: 'replace the person in my video with someone else', studio: 'recast' },
  { q: 'swap the actor in a clip', studio: 'recast' },
  { q: 'remove the background from an image', studio: 'layers' },
  { q: 'upscale a low resolution picture', studio: 'layers' },
  { q: 'chain several ai steps together automatically', studio: 'workflows' },
  { q: 'build a node pipeline for a repeated process', studio: 'workflows' },
  { q: 'create my own ai agent with custom instructions', studio: 'agents' },
  { q: 'continue an old conversation with an agent', studio: 'agents' },
  { q: 'design a poster by chatting with ai', studio: 'design-agent' },
  { q: 'ask ai to create a social graphic and keep refining it', studio: 'design-agent' },
  { q: 'add an explosion or fire effect to my footage', studio: 'vfx-studio' },
  { q: 'apply a special effect to a video', studio: 'vfx-studio' },
  { q: 'make a youtube thumbnail that gets clicks', studio: 'thumbnail-studio' },
  { q: 'design a cover image for my video with big text', studio: 'thumbnail-studio' },
  { q: 'create a fictional person for my instagram', studio: 'ai-influencer' },
  { q: 'design a virtual model by choosing hair and eye color', studio: 'ai-influencer' },
  { q: 'make a viral short video', studio: 'go-ai-viral' },
  { q: 'plan content that could go viral on tiktok', studio: 'go-ai-viral' },
  { q: 'sell ready made ai apps to my own customers', studio: 'apps' },
  { q: 'how much do the reseller packages cost', studio: 'apps' },
  { q: 'take a professional product photo', studio: 'photo-studio' },
  { q: 'make an ecommerce photo with style presets', studio: 'photo-studio' },
  { q: 'post my video to youtube automatically', studio: 'social-publishing' },
  { q: 'connect my instagram account to publish', studio: 'social-publishing' },
];

export const ACADEMY_QUESTIONS: HelpQuestion[] = [
  { q: 'how much can I earn from a faceless youtube channel', track: ['03-faceless-ai-channels'] },
  { q: 'how do I price a headshot package for clients', track: ['10-ai-headshots-and-portraits'] },
  { q: 'how to sell ai art on t-shirts and mugs', track: ['11-ai-print-on-demand-and-merch'] },
  { q: 'make staged photos of an empty room for realtors', track: ['09-ai-real-estate-staging'] },
  { q: 'virtual try on clothes for an online store', track: ['08-ai-fashion-and-virtual-tryon'] },
  { q: 'how to sell stock images made with ai', track: ['12-ai-stock-content-and-licensing'] },
  { q: 'which ai model is best for images', track: ['13-ai-tools-mastery'] },
  { q: 'how do I get my first freelance client', track: ['14-ai-freelancing-and-agency-business'] },
  { q: 'build a small paid tool with a coding agent', track: ['15-ai-agents-and-vibe-coding'] },
  { q: 'how do I make ugc style video ads', track: ['ugc'] },
  { q: 'dub my video into spanish', track: ['06-ai-audio-and-music'] },
  { q: 'keep the same character in every scene', track: ['05-ai-avatars-and-influencers', 'ugc', '02-ai-filmmaking'] },
  { q: 'write a screenplay for a short film', track: ['02-ai-filmmaking'] },
  { q: 'set up a content factory for tiktok and reels', track: ['04-ai-content-factories'] },
  { q: 'how do I price my ai services', track: ['14-ai-freelancing-and-agency-business', 'ugc'] },
  { q: 'make a podcast with ai voices', track: ['06-ai-audio-and-music'] },
  { q: 'how do I schedule and batch my short videos', track: ['04-ai-content-factories'] },
  { q: 'how do I keep clients happy with a contract', track: ['14-ai-freelancing-and-agency-business'] },
];

export const RESELLER_QUESTIONS: HelpQuestion[] = [
  { q: 'how do I get a domain name for my app', reseller: ['10.'] },
  { q: 'what is stripe and why do I need it', reseller: ['7.'] },
  { q: 'which database does my app need', reseller: ['5.'] },
  { q: 'make google login work for my app', reseller: ['5.'] },
  { q: 'how do I refund a customer', reseller: ['9.'] },
  { q: 'how do I protect myself from big ai costs', reseller: ['4.'] },
  { q: 'how do I put my app online on netlify', reseller: ['13.'], track: ['16-build-and-launch-apps-with-ai-assistants'] },
  { q: 'how do I add clerk sign up to my app', reseller: ['13.'] },
  { q: 'how do I connect chatgpt to netlify and stripe', reseller: ['13.'] },
  { q: 'my deploy failed what do I do', reseller: ['6.', '13.'] },
  { q: 'how do I find my first customers', reseller: ['12.'] },
  { q: 'how do I set the price of my credit packs', reseller: ['9.'] },
  { q: 'what accounts do I need to start', reseller: ['1.', '13.'], track: ['16-build-and-launch-apps-with-ai-assistants'] },
  { q: 'how do I create a github account and copy the app', reseller: ['3.'] },
];
