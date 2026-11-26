/**
 * The "video slot" fields every design with a video card offers in the page editor:
 *   slotImage  any https picture (a personalized image, a thumbnail, a graphic): shown as the video's picture,
 *              or on its own when the page has no video
 *   slotVideo  any https video you made (instead of the page's video)
 *   bakedPlay  the design's own picture already shows a play button (no second one is drawn over it)
 * Labels contain "picture" / "video you made" so withImagePickers() swaps in the library-aware fields.
 */
export const slotFields = () => ({
  slotImage: { type: 'text', label: 'Picture in the video slot (e.g. a personalized image; use {{custom3}} to show each contact\'s own picture)' },
  slotVideo: { type: 'text', label: 'Video in the video slot (a video you made)' },
  viewerStart: { type: 'number', label: 'Start the video at (seconds)', min: 0 },
  viewerEnd: { type: 'number', label: 'Stop the video at (seconds, 0 = the end)', min: 0 },
  viewerPosterAt: { type: 'number', label: 'Show the frame at (seconds) as the picture, when no picture is set', min: 0 },
  viewerSubtitles: { type: 'text', label: 'Subtitles file (.vtt link, hosted on your own uploads or this site; other hosts are blocked by the security policy)' },
  viewerOverlay: { type: 'text', label: 'Text on the video (e.g. Hi {{firstname|there}}, this is for you)' },
  viewerCtaAt: { type: 'number', label: 'Show a button at (seconds, 0 = off; always shown here in the editor)', min: 0 },
  viewerCtaLabel: { type: 'text', label: 'Button text on the video' },
  viewerCtaUrl: { type: 'text', label: 'Button link on the video (https, mailto: or #lead)' },
  bakedPlay: { type: 'radio', label: "The design's picture already shows a play button", options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
});

export const SLOT_DEFAULTS = { slotImage: '', slotVideo: '', bakedPlay: 'no', viewerStart: 0, viewerEnd: 0, viewerPosterAt: 0, viewerSubtitles: '', viewerOverlay: '', viewerCtaAt: 0, viewerCtaLabel: '', viewerCtaUrl: '' };
