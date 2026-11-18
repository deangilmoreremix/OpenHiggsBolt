// Hover-help copy for the OpenHiggsBolt studios. One flat map: normalized control label -> { name, summary, what?, shortcut? }.
// `summary` shows on hover; `what` appears after the card has been open ~1s. Look entries up through resolveStudioHelp(), so labels
// like "Generate (Ctrl+Enter)", "↻ Regenerate" or "Advanced…" still match. Controls can also opt in with data-help="<key>".
// Labels below are the ones these studios actually render (from packages/studio/src/messages/en and the studio components).

const h = (name, summary, what, shortcut) => ({ name, summary, what, shortcut });

export const STUDIO_HELP = {
  // ── Shared controls ─────────────────────────────────────────────────────────
  'model': h('Model', 'Picks the AI model.', 'Different models trade speed, cost and style. The credit cost updates when you switch.'),
  'aspect ratio': h('Aspect Ratio', 'Frame shape of the result.', '16:9 suits YouTube, 9:16 suits Reels, TikTok and Shorts, and 1:1 suits feed posts.'),
  'resolution': h('Resolution', 'Output sharpness.', 'Higher resolution looks better but costs more credits and takes longer.'),
  'duration': h('Duration', 'Clip length in seconds.', 'Longer clips cost more credits and take longer to generate.'),
  'quality': h('Quality', 'Speed versus detail.', 'Standard is faster and cheaper. High takes longer and renders finer detail.'),
  'seed': h('Seed', 'Fixes the randomness.', 'Reuse a seed to reproduce a result. Leave it blank for a different result each time.'),
  'prompt': h('Prompt', 'Describe what you want.', 'Subject, setting, lighting and style give the best results.'),
  'reference images': h('Reference Images', 'Guide the look with images.', 'Upload images to steer style, character or composition.'),
  'effect': h('Effect', 'Apply a preset look or motion.', 'Pick an effect to apply to the result.'),
  'effect type': h('Effect Type', 'Choose which effect to apply.'),
  'draw': h('Draw', 'Sketch to guide the AI.', 'Draw on the image to show exactly where something should change.'),
  'generate': h('Generate', 'Run the job.', 'The credit cost is shown before you commit.'),
  'download': h('Download', 'Save the result to your device.'),
  'save': h('Save', 'Keep this in your library.'),
  'copy link': h('Copy Link', 'Copy a shareable link.'),
  'undo': h('Undo', 'Step back one change.', undefined, 'Ctrl+Z'),
  'redo': h('Redo', 'Step forward one change.', undefined, 'Ctrl+Shift+Z'),
  'upload files': h('Upload files', 'Add your own images or clips.'),
  'regenerate': h('Regenerate', 'Run it again for a new result.', 'Uses the same prompt and settings.'),

  // ── Image Studio ────────────────────────────────────────────────────────────
  'text to image': h('Text to Image', 'Turn a description into a new image.'),
  'image to image': h('Image to Image', 'Rework an uploaded image.', 'Restyle or change an image while keeping its structure.'),
  'swap face': h('Swap Face', 'Put a chosen face on another image.'),

  // ── Video Studio ────────────────────────────────────────────────────────────
  'text to video': h('Text to Video', 'Describe a scene and get a clip.'),
  'image to video': h('Image to Video', 'Bring a still image to life.'),
  'animate image': h('Animate image', 'Bring a still image to life.'),
  'from prompt': h('From prompt', 'Create the video from a written description.'),
  'video tools': h('Video Tools', 'Post tools for clips you already have.'),
  'start & end frames': h('Start & end frames', 'Set the first and last frame.', 'The AI fills in the motion between them.'),
  'use references': h('Use references', 'Guide style or characters with images.'),
  'edit video': h('Edit video', 'Change a clip with text instructions.'),
  'extend video': h('Extend video', 'Add more seconds to an existing clip.'),
  'transfer motion': h('Transfer motion', 'Copy movement from one video onto your character.'),

  // ── Audio Studio ────────────────────────────────────────────────────────────
  'upload audio track': h('Upload audio track', 'Use your own audio.'),
  'audio model': h('Audio Model', 'Choose the music or voice engine.'),
  'lyrics / prompt': h('Lyrics / Prompt', 'Words to sing, or a style description.'),
  'generate track': h('Generate Track', 'Create the audio.'),
  'play': h('Play', 'Preview the audio.'),
  'mute': h('Mute', 'Silence the preview.'),
  'download audio': h('Download Audio', 'Save the audio file.'),

  // ── AI Clipping ─────────────────────────────────────────────────────────────
  'upload source video': h('Upload source video', 'The long video to pull highlights from.'),
  'max highlights': h('Max Highlights', 'Upper limit of clips to pull out.'),
  'coordinates only': h('Coordinates Only', 'Return timestamps without cutting the video.'),
  'highlights timeline': h('Highlights Timeline', 'Where the highlights occur in the video.'),
  'clips gallery mode': h('Clips Gallery Mode', 'Browse the clips as thumbnails.'),
  'timeline seek mode': h('Timeline Seek Mode', 'Jump through the video on the timeline.'),

  // ── Vibe Motion / Motion Control / Body Swap ────────────────────────────────
  'remix': h('Remix', 'Make a variation of the source clip.'),
  'cancel edit mode': h('Cancel Edit Mode', 'Leave editing without changes.'),
  'reference video': h('Reference Video', 'The movement to copy.'),
  'character image': h('Character Image', 'Who performs the movement.'),
  'motion transfer': h('Motion Transfer', 'Copy the movement onto your character.'),
  'objects swap': h('Objects Swap', 'Swap objects in the video.'),
  'high bitrate': h('High Bitrate', 'Larger file, cleaner picture.'),
  'generate audio': h('Generate Audio', 'Add matching sound.'),
  'generate motion': h('Generate Motion', 'Create the motion video.'),
  'orientation': h('Orientation', 'Match the camera direction of the source.'),
  'swap body': h('Swap Body', 'Replace the person in the video.'),

  // ── Lip Sync ────────────────────────────────────────────────────────────────
  'portrait image': h('Portrait Image', 'The still photo to make talk.'),
  'sync lip': h('Sync Lip', 'Run the lip sync.'),

  // ── Cinema Studio ───────────────────────────────────────────────────────────
  'camera': h('Camera', 'The camera body that sets the look.', 'Sensor and grain character.'),
  'lens': h('Lens', 'Lens character.', 'Wide, anamorphic and more.'),
  'focal length': h('Focal length', 'Wider shows more.', 'Longer focal lengths compress the scene and isolate the subject.'),
  'aperture': h('Aperture', 'Depth of field.', 'A low f-number gives a blurrier background.'),
  'reference': h('Reference', 'Match the framing or look of an image.'),
  'shoot': h('Shoot', 'Generate the shot.'),
  'copy prompt': h('Copy prompt', 'Copy the final prompt text.'),
  'fullscreen preview': h('Fullscreen Preview', 'View the result full size.'),

  // ── Zack D Studio ───────────────────────────────────────────────────────────
  'final cut': h('Final cut', 'Assemble the finished video.'),
  'keep clip audio': h('Keep clip audio', 'Preserve the original sound.'),
  'download video': h('Download video', 'Save the finished video.'),
  'captions (.srt)': h('Captions (.srt)', 'Export a subtitle file.'),
  'burn captions': h('Burn captions', 'Permanently embed the subtitles in the video.'),

  // ── Marketing Studio ────────────────────────────────────────────────────────
  'video format presets': h('Video Format Presets', 'Ready-made video setups.'),
  'avatar presets': h('Avatar Presets', 'Ready-made presenter setups.'),
  'select avatar': h('Select Avatar', 'Pick the presenter.'),
  'launch': h('Launch', 'Create the ad.'),

  // ── Layers Studio ───────────────────────────────────────────────────────────
  'layer decomposition': h('Layer Decomposition', 'Split an image into editable layers.'),
  'upscale': h('Upscale', 'Increase resolution and detail.'),
  'color grading': h('Color Grading', 'Adjust the color and mood.'),
  'remove background': h('Remove Background', 'Cut the subject out on a transparent background.'),
  'expand image': h('Expand Image', 'Grow the canvas.', 'The new area is filled to match the original.'),
  'edit text': h('Edit text', 'Change text inside the image.'),
  'enhancer': h('Enhancer', 'Sharpen and clean the image.'),
  'relight': h('Relight', 'Change the direction of the light.'),
  'angles': h('Angles', 'Re-view the subject from another angle.'),
  'lasso edit': h('Lasso Edit', 'Draw around an area and edit only that.'),
  'regional edit': h('Regional Edit', 'Select a region and edit only that.'),
  'marker': h('Marker', 'Mark up the image.'),
  'eraser': h('Eraser', 'Erase part of a stroke or mask.'),
  'shapes': h('Shapes', 'Add a shape to the canvas.'),
  'undo stroke': h('Undo Stroke', 'Step back one brush stroke.'),
  'redo stroke': h('Redo Stroke', 'Step forward one brush stroke.'),
  'reset zoom & pan': h('Reset Zoom & Pan', 'Return the canvas to fit the view.'),

  // ── Agents, workflows, apps ─────────────────────────────────────────────────
  'templates': h('Templates', 'Start from a ready-made setup.'),
  'my agents': h('My Agents', 'The agents you created.'),
  'my chats': h('My Chats', 'Your saved conversations.'),
  'create agent': h('Create Agent', 'Make a new agent.'),
  'system prompt': h('System Prompt', 'Standing instructions the agent always follows.'),
  'welcome message': h('Welcome Message', 'The first thing people see in the chat.'),
  'diy app builder': h('DIY App Builder', 'Build your own app.'),
  'apps + training': h('Apps + Training', 'Learn and install apps.'),
  'get all apps': h('Get All Apps', 'Unlock every app.'),
  'try live demo': h('Try Live Demo', 'Preview before you use it.'),

  // ── AI Influencer Studio ────────────────────────────────────────────────────
  'character type': h('Character Type', 'The kind of character to create.'),
  'gender': h('Gender', 'The character\'s gender.'),
  'shuffle': h('Shuffle', 'Randomize the traits for ideas.'),
  'generate character': h('Generate Character', 'Create the character.'),
};

const SHORTCUT = /\s*\((?:ctrl|cmd|alt|shift|⌘|⌥|⇧)[^)]*\)\s*$/i;

/**
 * Normalize a control label into a STUDIO_HELP key: shortcut suffix "(Ctrl+S)", count badge "(18)", and any leading / trailing
 * icon, emoji or punctuation ("↻ Regenerate", "Generate ✨", "Advanced…") are dropped; case is folded.
 */
export function helpKey(label) {
  return String(label || '')
    .replace(/\s+/g, ' ').trim()
    .replace(SHORTCUT, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .toLowerCase();
}

/** Candidate labels derived from a control id: "v-duration-btn" -> ["duration", "v duration", "v duration btn"]. */
export function idLabels(id) {
  const raw = String(id || '').toLowerCase();
  const base = raw.replace(/-(btn|button|toggle|trigger|pill)$/, '');
  if (!base) return [];
  const full = base.replace(/-/g, ' ');
  const bare = base.replace(/^[a-z]{1,3}-/, '').replace(/-/g, ' ');
  return [...new Set([bare, full, raw.replace(/-/g, ' ')])];
}

// Descriptive title/aria sentences the studios use, mapped to the entry they describe.
export const ALIASES = {
  'select model': 'model',
  'choose model': 'model',
  'change aspect ratio': 'aspect ratio',
  'ar': 'aspect ratio',
  'aspect': 'aspect ratio',
  'aspect_ratio': 'aspect ratio',
  'effects': 'effect',
};

// "Select / Change / Show ..." prefixes and a trailing "options" are dropped, so "Show advanced options" finds "Advanced".
const VERB = /^(?:select|change|choose|pick|show|hide|open|toggle|set)\s+(?:the\s+|a\s+|an\s+|your\s+)?/;

const lookup = (key) => STUDIO_HELP[key] || STUDIO_HELP[ALIASES[key]] || null;

/** Help entry for a control label, or null. */
export function resolveStudioHelp(label) {
  const key = helpKey(label);
  const direct = lookup(key);
  if (direct) return direct;
  const stripped = key.replace(VERB, '').replace(/\s+options?$/, '');
  return stripped !== key ? lookup(stripped) : null;
}
