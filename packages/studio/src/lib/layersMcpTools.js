/**
 * Layers Studio tab tools: the small set of operations that exist as plain handlers in LayersStudio.jsx
 * (decompose into layers, upscale, remove background, layer visibility, source image and options). `get()` returns the latest
 * { state, actions } from the component. NOT exposed: freehand drawing, lasso/region/shape/brush tools, drag and zoom, text and
 * colour-grade sliders, and the canvas undo/redo: they work on pointer events over a canvas and have no programmatic surface.
 */
const settle = () => new Promise((r) => setTimeout(r, 60));
const RES = ['1K', '1.5K', '2K'];
const FORMATS = ['png', 'jpeg', 'webp'];
const fail = (msg) => { throw new Error(msg); };

const snapshot = (s) => ({
  imageUrl: s.currentImageUrl, prompt: s.prompt, resolution: s.resolution, layerCount: s.layerCount, outputFormat: s.outputFormat,
  processing: !!s.isProcessing, layers: (s.decomposedLayers || []).map((url, index) => ({ index, url, visible: s.visibleLayers?.[index] !== false })),
});

export function layersTools(get) {
  const t = (name, description, risk, properties, required, run) => ({ name, description, risk, schema: { type: 'object', properties, required: required || [] }, run });
  const busy = () => { if (get().state.isProcessing) fail('Layers Studio is still working on something.'); };
  return [
    t('layers_get_state', 'Layers Studio: the source image, options and the decomposed layers (with visibility).', 'read', {}, [], async () => snapshot(get().state)),
    t('layers_set_image', 'Use an image (public https URL) as the source.', 'write', { image_url: { type: 'string', maxLength: 2000 } }, ['image_url'], async (a) => {
      if (!/^https:\/\//i.test(String(a.image_url))) fail('image_url must be an https link.');
      get().actions.setCurrentImageUrl(a.image_url); await settle(); return snapshot(get().state);
    }),
    t('layers_set_options', 'Set decomposition options: prompt, resolution (1K, 1.5K, 2K), output format and layer count.', 'write', { prompt: { type: 'string', maxLength: 1000 }, resolution: { type: 'string', enum: RES }, output_format: { type: 'string', enum: FORMATS }, layer_count: { type: 'integer', minimum: 2, maximum: 12 } }, [], async (a) => {
      const x = get().actions;
      if (a.prompt !== undefined) x.setPrompt(String(a.prompt));
      if (a.resolution !== undefined) { if (!RES.includes(a.resolution)) fail('resolution must be 1K, 1.5K or 2K.'); x.setResolution(a.resolution); }
      if (a.output_format !== undefined) { if (!FORMATS.includes(a.output_format)) fail('output_format must be png, jpeg or webp.'); x.setOutputFormat(a.output_format); }
      if (a.layer_count !== undefined) x.setLayerCount(Math.min(12, Math.max(2, Math.round(Number(a.layer_count) || 8))));
      await settle(); return snapshot(get().state);
    }),
    t('layers_decompose', 'Split the source image into layers (paid generation). Optionally pass a prompt to describe the layers.', 'write', { prompt: { type: 'string', maxLength: 1000 } }, [], async (a) => {
      busy(); await get().actions.decompose(a.prompt); await settle(); return snapshot(get().state);
    }),
    t('layers_upscale', 'Upscale the source image with the studio\'s upscaler settings (paid generation).', 'write', {}, [], async () => { busy(); await get().actions.upscale(); await settle(); return snapshot(get().state); }),
    t('layers_remove_background', 'Remove the source image background (paid generation).', 'write', {}, [], async () => { busy(); await get().actions.removeBackground(); await settle(); return snapshot(get().state); }),
    t('layers_set_layer_visibility', 'Show or hide one decomposed layer.', 'write', { index: { type: 'integer', minimum: 0 }, visible: { type: 'boolean' } }, ['index', 'visible'], async (a) => {
      const n = (get().state.decomposedLayers || []).length;
      if (a.index >= n) fail(`There are ${n} layers.`);
      get().actions.setLayerVisible(a.index, !!a.visible); await settle(); return snapshot(get().state);
    }),
  ];
}
