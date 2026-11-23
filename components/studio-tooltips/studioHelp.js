// Hover-help copy for the OpenHiggsBolt studios. One flat map: normalized control label -> { name, summary, what?, shortcut? }.
// `summary` shows on hover; `what` appears after the card has been open ~1s. Look entries up through resolveStudioHelp(), so labels
// like "Generate (Ctrl+Enter)", "↻ Regenerate" or "Advanced…" still match. Controls can also opt in with data-help="<key>".
// Labels below are the ones these studios actually render (from packages/studio/src/messages/en and the studio components).

import { getStudioGuide } from '@/data/academyStudioGuides';

const h = (name, summary, what, shortcut) => ({ name, summary, what, shortcut });

/**
 * Studio-level help for a shell tab (button[data-tab="<id>"]): the studio's own label and one-line description from the Academy
 * guides (src/data/academyStudioGuides.ts), so the wording is the owner's and a studio cannot be added without one (an existing test
 * requires every shell tab to have a guide).
 */
export function studioEntry(id) {
  const g = getStudioGuide(id);
  return g ? { name: g.label, summary: g.tagline } : null;
}

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

  // ── Labels as the studios actually render them (from the coverage audit) ────
  'library': h('Saved', 'Your saved uploads and generations.', 'Shared by every studio, so anything you made elsewhere can be reused here.'),
  'saved': h('Saved', 'Your saved uploads and generations.', 'Shared by every studio, so anything you made elsewhere can be reused here.'),
  'add up to 10 images': h('Add images', 'Upload up to 10 reference images.'),
  'recipes': h('Recipes', 'Browse ready-made prompt recipes.'),
  'upload image file': h('Upload image', 'Upload an image file.'),
  'upload audio file': h('Upload audio', 'Upload an audio file.'),
  'upload video file': h('Upload video', 'Choose the video to use.'),
  'upload product': h('Upload Product', 'Add your product image.'),
  'upload avatar': h('Upload Avatar', 'Add the presenter image.'),
  'upload references': h('Upload References', 'Add reference images.'),
  'create workflow': h('Create Workflow', 'Start a new workflow.'),
  'my workflows': h('My Workflows', 'Your saved workflows.'),
  'community': h('Community', 'Browse what the community shared.'),
  'retry': h('Retry', 'Try the failed request again.'),

  'advanced': h('Advanced', 'Extra settings for fine control.', 'The defaults work for most jobs.'),
  'generate thumbnail': h('Generate Thumbnail', 'Create the thumbnail.'),
  'new project': h('New Project', 'Start a new project.'),
  'new page': h('New page', 'Create a new page.'),
  'send message': h('Send message', 'Send your message.'),
  'upload reference media': h('Upload reference media', 'Add reference media to your message.'),
  'write script': h('Write script', 'Write the script for the video.'),
  'generate storyboard': h('Generate Storyboard', 'Create the storyboard from your story.'),
  'brief \u2192 scenes': h('Brief \u2192 scenes', 'Turn your brief into scenes.'),
  'shot editor': h('Shot Editor', 'Edit the individual shots.'),
  'try the demo project': h('Try the demo project', 'Load the demo project.'),
  'newest first': h('Newest first', 'Show the newest prompts first.'),
  'oldest first': h('Oldest first', 'Show the oldest prompts first.'),
  'all categories': h('Categories', 'Filter prompts by category.'),
  'all models': h('Models', 'Filter prompts by model.'),
  'feed': h('Feed', 'Browse the prompt feed.'),
  'video prompts': h('Video Prompts', 'Browse prompts for video.'),
  'academy': h('Academy', 'Open the Academy lessons.'),
  'topic': h('Topic', 'What the video is about.'),
  'look': h('Look', 'Pick the visual style of the video.'),
  'voice': h('Voice', 'Pick the voice for the video.'),

  'reset': h('Reset', 'Set every trait back to its default.'),
  'add image': h('Add image', 'Upload the image to use.'),

  // ── Option lists and card grids (data-help on the list container or on each option) ──
  'category filter': h('Category', 'Show only this kind of item.'),
  'edit tool': h('Tool', 'Open this tool in its own playground.'),
  'layers tool': h('Tool', 'Open this tool.'),
  'builder tab': h('Builder tab', 'Group traits by area.', 'Face, body or style traits.'),
  'trait option': h('Trait', 'Click to choose this trait.'),
  'show more tags': h('Show more', 'Show or hide the rest of the selected tags.'),
  'thumbnail view': h('View', 'Switch between creating, your thumbnails and the community.'),
  'thumbnail mode': h('Mode', 'Switch between generating a new image and editing one.'),
  'thumbnail template': h('Template', 'Start from a template.'),
  'thumbnail style': h('Style', 'Pick the look of the thumbnail.'),
  'thumbnail size': h('Size', 'Pick the thumbnail size, for example YouTube HD.'),
  'vfx effect': h('Effect', 'Pick this effect for your image.'),
  'vfx effect group': h('Effect group', 'Switch between groups of effects.'),

  'studio guide': h('Studio guide', 'A step-by-step guide to this studio, in the Academy.'),
  'settings': h('Settings', 'Your API key, local models and preferences.'),
  'sign out of your account': h('Sign out', 'Sign out of your account.'),
  'new brand': h('New Brand', 'Start a new brand from your website address.', 'Paste the address and Brand DNA is built from it.'),
  'back to studios': h('SmartVideo GO', 'Back to all studios.'),
  'photo category': h('Product category', 'Pick the kind of product.', 'The styles shown change to match the category.'),
  'photo style': h('Photo style', 'Pick the look of the photo.'),
  'photo brand': h('Brand', 'Choose a saved brand for this photo.', 'It is sent with the request, and the history below shows that brand\'s photos.'),
  'product image url': h('Product image URL', 'Paste a link to your product image.', 'Optional.'),
  'brand url': h('Website address', 'Paste your brand\'s website.', 'Brand DNA is built from it.'),
  'analyze': h('Analyze', 'Analyze the website to build your Brand DNA.'),
  // Layers tools (labels from messages/en/layersStudio.json)
  'layers shape': h('Shape', 'Draw this shape on the image.'),
  'pan tool': h('Pan tool', 'Drag to move around the canvas.'),
  'custom color': h('Custom color', 'Pick a custom colour.'),
  'clear drawings': h('Clear Drawings', 'Remove your drawings from the image.'),
  'clear marked regions': h('Clear Marked Regions', 'Remove the regions you marked.'),
  'upload or change image': h('Upload or Change Image', 'Choose the image to edit.'),
  // Thumbnail, DesignAgent, Storyboard, Agents, Skills
  'thumbnail quality': h('Quality', 'Faster drafts or slower, higher-quality results.'),
  'brand kit settings': h('Brand Kit', 'Set your logo, colours and fonts.', 'When it is on, they are added to each request you send the agent.'),
  'export json': h('Export JSON', 'Download the storyboard as a JSON file.'),
  'export pdf': h('Export PDF', 'Download the storyboard as a PDF.'),
  'switch project': h('Switch project', 'Open another storyboard project.'),
  'delete current project': h('Delete project', 'Delete this project and its scenes.', 'This cannot be undone.'),
  'send to': h('Send to', 'Send this shot to another studio.'),
  'add character': h('Add Character', 'Add this character to your library.'),
  'analysis': h('Analysis', 'Open the analysis for this scene.'),
  'example prompt': h('Example prompt', 'Click to use this example.'),
  'run workflow': h('Run workflow', 'Run this skill as a workflow.'),
  'open in studio': h('Open in Studio', 'Open this recipe in its studio, ready to use.'),
  'skills': h('Skills', 'Browse ready-made workflows and recipes.'),
  'prompt library': h('Prompt Library', 'Browse the prompt library.'),
  // Apps (wording from messages/en/appsStudio.json and the studio's own comments)
  'upgrade to apps + training for $400': h('Upgrade', 'Upgrade from DIY App Builder to Apps + Training for a $400 difference.'),
  'get all apps + training': h('Get All Apps + Training', 'Get the apps and learn how to build, customize and launch them.'),
  'open the reseller deployment center': h('Reseller Deployment Center', 'Deployment documentation for the reseller apps.'),
  'reseller setup walkthrough': h('Reseller Setup Walkthrough', 'Step-by-step setup lessons for resellers.'),
  'deployment guide': h('Deployment Guide', 'Deployment documentation for this app.'),
  'deploy on vercel': h('Deploy on Vercel', 'Import this app\'s public GitHub repository into Vercel.'),
  'source code': h('Source Code', 'Open this app\'s source code.'),
  'github': h('GitHub', 'Open this app on GitHub.'),
  'learn how to launch this app': h('Learn how to launch this app', 'Lessons on launching this app.'),
  'live demo': h('Live demo', 'Open a live demo of this app.'),
  // GO-Viral filters and view toggles
  'with video + prompt': h('With video + prompt', 'Show only prompts that come with a video and the prompt.'),
  'with video only': h('With video only', 'Show only prompts that have a video.'),
  'all prompts': h('All prompts', 'Show every prompt.'),
  'all languages': h('All languages', 'Show prompts in every language.'),
  'grid view': h('Grid view', 'Show results as a grid.'),
  'list view': h('List view', 'Show results as a list.'),
  'vibe edit mode': h('Edit', 'Edit a motion graphic you already generated.', 'Available once you have generated one.'),
  'highlight marker pen': h('Highlight marker pen', 'Mark up the image with a highlighter pen.'),
  // Supported by the code: the summary shows lens, focal length and aperture and opens the camera overlay; the image button toggles upload/remove.
  'camera setup': h('Camera setup', 'Shows your lens, focal length and aperture.', 'Click to change the camera, lens, focal length and aperture.'),
  'cinema reference image': h('Reference image', 'Add a reference image, or remove the one you added.'),
  'close preview': h('Close', 'Close the fullscreen preview.'),
  // DesignAgent sends the chosen mode to the agent as "[Mode: ...]". "edit" is also set by the asset Edit action; "agent" and "generate" are
  // read from their names only, so these two are flagged for the owner to confirm.
  'design mode agent': h('Agent', 'Let the agent decide how to handle your message.'),
  'design mode generate': h('Generate', 'Ask the agent to generate a new design.'),
  'design mode edit': h('Edit', 'Ask the agent to edit an existing design.'),
  'skill category': h('Category', 'Show only this kind of skill.'),
  'lipsync video mode': h('Video', 'Use a video as the source instead of a portrait image.'),
  'add scene': h('Add', 'Add the scene you typed to the storyboard.'),
  'upload reference image': h('Upload', 'Upload a reference image from your device.', 'You can also paste an image URL.'),
  // Motion Director's own title text for the button
  'brand kit': h('Brand Kit', 'Business name, colors, logos, images and reference frames.'),
  'brand kit \u00b7 on': h('Brand Kit', 'Business name, colors, logos, images and reference frames.'),
  'design message': h('Message', 'Tell the design agent what you want.', 'Press Enter to send, Shift+Enter for a new line.'),
  'api key set': h('API key', 'Your API key is set.', 'Click to change it.'),
  'set api key': h('Set API key', 'Add your API key.'),
  'add as image': h('Add as Image', 'Use this item as the character image.'),
  'use as video': h('Use as Video', 'Use this item as the motion video.'),
  'trait tag': h('Trait tag', 'A trait you picked.', 'Click it to jump to the tab that owns it.'),
  'batch count': h('Batch count', 'How many images to make at once.', 'From 1 to 4.'),
  'pointer tool': h('Pointer tool', 'Select and move things on the canvas.'),
  'run selection edit': h('Run Selection Edit', 'Apply your edit to the selected area.'),
  'run text edit': h('Run Text Edit', 'Apply the text change.'),
  'enhance image': h('Enhance Image', 'Sharpen and clean the image.'),
  'apply perspective angle': h('Apply Perspective Angle', 'Re-render the image from the new angle.'),
  'back to tools': h('Back to Tools', 'Return to the tools menu.'),
  'close panel': h('Close Panel', 'Close this panel.'),
  'ai enhance prompt': h('AI enhance prompt', 'Let AI expand your prompt.'),
  'image url': h('Image URL', 'Paste a link to the image instead of uploading.'),
  'vfx subject': h('Subject', 'Describe the subject in the image.', 'Optional.'),
  'quick add scene': h('Quick add', 'Type a scene to add it to the storyboard.'),
  'attach image / video / audio': h('Attach', 'Add an image, video or audio file.'),

  // ── Text fields (matched by their placeholder) ──────────────────────────────
  'speech style': h('Speech style', 'Describe how the voice should sound.'),
  'ad script': h('Ad script', 'Write what the presenter says.', 'Use @image1 for the product and @image2 for the avatar.'),
  'highlights prompt': h('Highlights prompt', 'Describe which highlights to extract.'),
  'layers prompt': h('Edit prompt', 'Describe how to edit the image or split it into layers.'),
  'story': h('Story', 'Describe the story beat by beat.', 'One line per scene works best.'),
  'search': h('Search', 'Filter the list by what you type.'),
  'character name': h('Character name', 'Name the character so scenes can refer to it.'),
  'character traits': h('Character traits', 'Short visual details about the character.', 'For example: red coat, scar.'),
  'reference image': h('Reference image', 'Upload an image of the character, or paste a link to one.'),
  'extra details': h('Extra details', 'Add anything else you want in the result.', 'For example: neon cyberpunk lighting, dramatic shadows.'),
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
  'run layer decomposition': 'layer decomposition',
  'select image generation model': 'model',
  'eraser tool': 'eraser',
  'shapes (r)': 'shapes',
  'apply relight': 'relight',
  'prompt textarea': 'prompt',
  'aspect': 'aspect ratio',
  'aspect_ratio': 'aspect ratio',
  'effects': 'effect',
};

// "Select / Change / Show ..." prefixes and a trailing "options" are dropped, so "Show advanced options" finds "Advanced".
const VERB = /^(?:select|change|choose|pick|show|hide|open|toggle|set)\s+(?:the\s+|a\s+|an\s+|your\s+)?/;

// Buttons that show their current value instead of a name ("16:9", "5s", "480p", "3 Highlights"): matched by shape, not by label.
const VALUE_PATTERNS = [
  [/^\d{1,2}:\d{1,2}$/, 'aspect ratio'],
  [/^\d+(\.\d+)?s$/, 'duration'],
  [/^\d{3,4}p$/, 'resolution'],
  [/^\d(\.\d)?k$/, 'resolution'],
  [/^\d+ highlights?$/, 'max highlights'],
  [/^orientation:/, 'orientation'],
  [/^upload reference video/, 'reference video'],
  [/^upload character (or performer )?image/, 'character image'],
  [/^upload video file/, 'upload video file'],
];

// Text fields that are labelled only by their placeholder, matched by prefix (the text is long and sometimes truncated).
const PLACEHOLDERS = [
  [/^step-by-step guide for /, 'studio guide'],
  [/^separate layers/, 'layer decomposition'],
  [/^type your prompt here/, 'prompt'],
  [/^open live demo for /, 'live demo'],
  [/^settings \u2014 /, 'settings'],
  [/^https?:\/\/your-brand/, 'brand url'],
  [/^product image url/, 'product image url'],
  [/^describe the (image|video) you want/, 'prompt'],
  [/^describe your cinema scene/, 'prompt'],
  [/^describe the motion graphic/, 'prompt'],
  [/^optional \u2014 describe/, 'prompt'],
  [/^describe speech style/, 'speech style'],
  [/^describe your ad script/, 'ad script'],
  [/^describe prompt \/ highlights/, 'highlights prompt'],
  [/^describe how to edit image or split layers/, 'layers prompt'],
  [/^describe the story beat by beat/, 'story'],
  [/^optional: describe the subject/, 'vfx subject'],
  [/^a dramatic gaming thumbnail/, 'prompt'],
  [/^quick-add a scene/, 'quick add scene'],
  [/^describe your motion video/, 'prompt'],
  [/^search /, 'search'],
  [/^name \(e\.g\./, 'character name'],
  [/^traits \(/, 'character traits'],
  [/^reference image \(upload or paste/, 'reference image'],
  [/^add extra details/, 'extra details'],
];

const lookup = (key) => STUDIO_HELP[key] || STUDIO_HELP[ALIASES[key]] || null;

/** Help entry for a control label, or null. */
export function resolveStudioHelp(label) {
  const key = helpKey(label);
  const direct = lookup(key);
  if (direct) return direct;
  const shaped = [...VALUE_PATTERNS, ...PLACEHOLDERS].find(([re]) => re.test(key));
  if (shaped) return lookup(shaped[1]);
  const stripped = key.replace(VERB, '').replace(/\s+options?$/, '');
  return stripped !== key ? lookup(stripped) : null;
}
