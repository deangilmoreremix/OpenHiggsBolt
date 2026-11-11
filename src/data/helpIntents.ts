/**
 * Plain-language ways customers describe what they want. Indexed for "Ask SmartVideo" so natural
 * questions find the right studio, course or lesson even when they use none of our product words.
 * Rules: describe real capabilities only (checked against studio guides), no secrets, no promises.
 */

/** Studio id -> things people say they want to do there. */
export const STUDIO_INTENTS: Record<string, string[]> = {
  image: ['make a picture from a text description', 'generate an image from a prompt', 'change the style of my photo', 'edit a photo with ai', 'use reference photos to guide the image', 'make art, illustrations or portraits', 'choose an image model', 'make product mockups'],
  'brand-studio': ['build a brand kit with colors, logo and fonts', 'keep all my content on brand', 'create campaign assets for my business', 'save my brand voice and style', 'make social posts that match my brand', 'organise my brands'],
  video: ['turn a still photo into a moving video', 'generate a video from a text prompt', 'make a short clip', 'animate an image', 'pick a video model', 'make a video from a start and end image', 'what to do when a video generation fails'],
  edit: ['trim, cut and combine clips on a timeline', 'add captions and subtitles', 'add music and sound to a video', 'edit and export my finished video', 'use ai tools inside the editor', 'resize a video for different platforms'],
  audio: ['make a voiceover or narration from text', 'text to speech', 'clone a voice', 'generate background music', 'create sound effects', 'change or translate speech', 'make a song'],
  clipping: ['cut a long video or podcast into short clips', 'find the best moments automatically', 'make vertical clips for tiktok, reels and shorts', 'repurpose a webinar or stream', 'add captions to clips'],
  'vibe-motion': ['make an animated title or text intro', 'create motion graphics without after effects', 'animated lower thirds and overlays', 'turn text into an animated graphic', 'kinetic typography'],
  'motion-control': ['make a character copy the moves from a video', 'transfer dance or body motion to my character', 'use a reference video to control movement', 'animate a still character with real motion', 'motion transfer'],
  lipsync: ['make a photo talk using my recording', 'sync a mouth to audio', 'make my character speak these words', 'make an avatar say a script', 'dub a video so the lips match', 'talking head video from a portrait'],
  cinema: ['choose the camera angle, lens and movement', 'make a scene look like a movie', 'cinematic shots with depth of field', 'film-style stills and shots', 'control lighting and framing like a director of photography'],
  storyboard: ['plan my scenes before I generate anything', 'turn a script or idea into a shot list', 'lay out a storyboard with frames', 'turn a storyboard into video', 'keep characters consistent across scenes', 'write a screenplay breakdown'],
  zackd: ['render a finished video from a template', 'swap the text and media in a video template', 'template based video maker', 'make many videos from one design', 'branded explainer or promo from a template'],
  marketing: ['create a product ad', 'make a commercial or promo for my product', 'ad creative for social media', 'ugc style ads', 'campaign visuals for a launch', 'make several ad variations'],
  'motion-director': ['have an ai direct a whole film for me', 'make a film or trailer from my brand website', 'ai picks shots, music and cuts', 'a finished video with transitions and sound', 'turn my product pages into a video', 'direct a film stage by stage'],
  recast: ['replace the person in my video with someone else', 'swap the actor in a clip', 'put my face on another body', 'change who appears in footage', 'full body character swap'],
  layers: ['remove the background from an image', 'cut out a subject', 'upscale a low resolution picture', 'extend the edges of an image', 'separate an image into layers', 'clean up product images'],
  workflows: ['chain several ai steps together automatically', 'build a node pipeline for a repeated process', 'automate a multi step task', 'connect image, video and audio steps', 'run the same steps on many inputs'],
  agents: ['create my own ai agent with custom instructions', 'chat with an ai assistant I configured', 'continue an old conversation with an agent', 'use a ready made agent template', 'give an agent a personality and system prompt'],
  'design-agent': ['design a poster by chatting with ai', 'create a social graphic and keep refining it', 'conversational design tool', 'make a flyer, banner or ad by describing it', 'ask for changes to a design in plain words'],
  'vfx-studio': ['add an explosion or fire effect to my footage', 'apply a special effect to a video', 'visual effects for clips', 'add particles, smoke or lightning', 'make a shot look supernatural or sci-fi'],
  'thumbnail-studio': ['make a youtube thumbnail that gets clicks', 'design a cover image for my video', 'thumbnail with big text and a face', 'improve my click through rate', 'make thumbnails for shorts and videos'],
  'ai-influencer': ['create a fictional person for my instagram', 'design a virtual model by choosing hair and eye color', 'make a consistent ai persona', 'build a character by clicking options', 'generate portraits of the same character', 'fantasy or realistic character design'],
  'go-ai-viral': ['make a viral short video', 'plan content that could go viral on tiktok', 'trending video ideas', 'produce a batch of shorts', 'turn a topic into a short form video'],
  apps: ['sell ready made ai apps to my own customers', 'start an ai software business', 'deploy one of the apps', 'how much the reseller packages cost', 'get the source code for an app', 'try a live demo of an app', 'launch my own branded app'],
  'photo-studio': ['take a professional product photo', 'make an ecommerce photo with style presets', 'food, beauty or tech product photography', 'turn my product link into a styled photo', 'photos for a brand'],
  'social-publishing': ['post my video to youtube automatically', 'connect my instagram, tiktok or facebook to publish', 'schedule a post to several platforms', 'publish what I created without downloading it', 'what to do when a publish fails', 'write the title and caption for a post'],
};

/** Academy track folder -> plain-language goals the course helps with. */
export const TRACK_INTENTS: Record<string, string[]> = {
  ugc: ['make ugc style video ads', 'create ad batches for brands', 'price and sell ugc to clients', 'keep a creator character consistent in ads'],
  '02-ai-filmmaking': ['write a screenplay for a short film', 'storyboard shots and camera moves', 'make a short film with ai', 'keep a character consistent across scenes', 'sell short films'],
  '03-faceless-ai-channels': ['start a faceless youtube channel', 'find a niche and write scripts', 'narration and pacing', 'how much can I earn per thousand views', 'grow and monetize a channel'],
  '04-ai-content-factories': ['set up a content factory for tiktok and reels', 'produce youtube shorts at scale', 'design thumbnails', 'batch and schedule posts', 'sell content services'],
  '05-ai-avatars-and-influencers': ['create a consistent ai character', 'run an ai influencer', 'clone a voice for dialogue', 'monetize a virtual character', 'agency economics for avatars'],
  '06-ai-audio-and-music': ['clone a voice and text to speech', 'dub my video into another language', 'make a podcast with ai voices', 'generate music and sound effects', 'singing and vocal synthesis'],
  '07-ai-product-photography': ['product photos for online stores', 'what photography converts', 'sell product photography as a service', 'batch process many product images'],
  '08-ai-fashion-and-virtual-tryon': ['virtual try on clothes for an online store', 'studio lookbooks', 'consistent sizing and layout', 'conversion case studies for fashion'],
  '09-ai-real-estate-staging': ['stage an empty room for realtors', 'pricing against traditional staging', 'sell staging to agents and agencies'],
  '10-ai-headshots-and-portraits': ['make consistent professional headshots', 'price a headshot package', 'headshots for remote teams', 'creative and stylised portraits', 'stand out from cheap competitors'],
  '11-ai-print-on-demand-and-merch': ['sell ai art on t-shirts and mugs', 'print on demand platforms', 'build a catalog without repeating', 'pricing and passive income math'],
  '12-ai-stock-content-and-licensing': ['sell stock images and video made with ai', 'what sells on stock marketplaces', 'batch generate a licensable catalog', 'licensing and passive income'],
  '13-ai-tools-mastery': ['which ai model is best for images or video', 'choose a voice or audio model', 'api versus local models', 'compare tools for a project'],
  '14-ai-freelancing-and-agency-business': ['get my first freelance client', 'price my ai services', 'write a contract and define scope', 'build a portfolio that sells', 'scale from freelancer to agency'],
  '15-ai-agents-and-vibe-coding': ['build a small paid tool with a coding agent', 'what coding agents really do', 'vibe coding workflow', 'price and sell a micro tool'],
  '16-build-and-launch-apps-with-ai-assistants': ['use claude or chatgpt to build and host my app', 'connect claude or chatgpt to netlify clerk and stripe', 'put my app online for free', 'add sign up and login with clerk', 'take test payments with stripe', 'go live on my own domain'],
};

/** Reseller Setup Walkthrough module id -> plain-language goals. */
export const RESELLER_MODULE_INTENTS: Record<number, string[]> = {
  1: ['understand what I am launching', 'what accounts and costs do I need', 'my launch roadmap'],
  2: ['pick which app to sell', 'try the live demos', 'explore the app collection'],
  3: ['create a github account', 'copy an app to my own github', 'what is inside the app code'],
  4: ['set up my muapi account and key', 'protect myself from big ai costs', 'understand ai usage costs'],
  5: ['set up the database', 'which database does my app need', 'create the tables', 'make google login work'],
  6: ['put my app online on vercel', 'add environment variables', 'my deploy or build failed', 'redeploy my app'],
  7: ['what is stripe', 'create a stripe account', 'receive payouts to my bank', 'test mode versus live mode'],
  8: ['connect stripe to my app', 'set up the stripe webhook', 'make a test purchase', 'switch stripe to live safely', 'payment worked but no credits'],
  9: ['understand fees, revenue and profit', 'set my credit pack prices', 'handle refunds, failed payments and disputes'],
  10: ['set my business name and app name', 'buy a domain and connect it', 'update every address after changing domain'],
  11: ['run the full customer test', 'be ready to take live payments'],
  12: ['find my first customers', 'write an offer and sales message', 'monthly expenses and running the business'],
  13: ['use claude or chatgpt to build and host my app', 'connect claude or chatgpt to netlify clerk and stripe', 'host my app on netlify for free', 'add sign up and login with clerk', 'test stripe payments and check them from the chat', 'go live on my own domain with clerk and stripe'],
};

/** Extra ways of saying common things, used to widen search (same group = same meaning). */
export const SYNONYM_GROUPS: string[][] = [
  ['picture', 'photo', 'image', 'pic', 'graphic', 'illustration'],
  ['video', 'clip', 'footage', 'movie', 'film', 'reel'],
  ['talk', 'speak', 'speech', 'mouth', 'lip', 'lipsync', 'dialogue'],
  ['voiceover', 'narration', 'narrate', 'tts', 'voice'],
  ['music', 'song', 'soundtrack', 'beat'],
  ['caption', 'subtitle', 'subtitles'],
  ['commercial', 'advert', 'advertisement', 'promo', 'ad', 'ads'],
  ['person', 'character', 'avatar', 'persona', 'influencer', 'fictional', 'virtual'],
  ['thumbnail', 'cover', 'banner'],
  ['cut', 'trim', 'split', 'chop'],
  ['viral', 'trending', 'shorts', 'tiktok', 'reels'],
  ['login', 'signin', 'signup', 'authentication', 'account'],
  ['host', 'hosting', 'online', 'deploy', 'publish'],
  ['money', 'earn', 'income', 'revenue', 'profit', 'monetize', 'monetise'],
  ['sell', 'customer', 'client', 'reseller'],
  ['script', 'screenplay', 'story'],
  ['camera', 'lens', 'angle', 'cinematic'],
  ['automate', 'automation', 'workflow', 'pipeline', 'chain'],
  ['background', 'cutout'],
  ['upscale', 'enhance', 'sharpen', 'resolution'],
  ['effect', 'vfx', 'explosion', 'fire', 'particles'],
  ['payment', 'checkout', 'purchase'],
];
