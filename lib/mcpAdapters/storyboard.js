/**
 * Storyboard tab tools. Everything here calls the storyboard's own context actions (src/apps/storyboard/StoryboardContext.tsx), the same
 * ones its UI buttons call, so the MCP cannot do anything the studio cannot. `get()` returns the latest context value (a ref in the page).
 * Not exposed: shot image/video generation and the PDF/GIF downloads (generation is covered by the generation tools; downloads need the browser's file dialog).
 */
import { STORYBOARD_MODEL_IDS } from '../../src/apps/storyboard/models.ts';

const str = (max) => ({ type: 'string', maxLength: max });
const ASPECTS = ['16:9', '9:16'];
const settle = () => new Promise((r) => setTimeout(r, 30)); // let React apply the state change before we read it back
const fail = (msg) => { throw new Error(msg); };

const summary = (c) => ({
  projectId: c.projectId, projectName: c.projectName, brief: c.brief, aspectRatio: c.aspectRatio, episodeDuration: c.episodeDuration, model: c.model,
  characters: (c.characters || []).map((x) => ({ id: x.id, name: x.name, description: x.description, hasReference: !!x.referenceImageUrl })),
  shots: (c.shots || []).map((s, i) => ({ index: i, id: s.id, scene: s.scene, duration: s.duration, camera: s.camera, hasFrame: !!s.frameUrl, characterIds: s.characterIds })),
  projects: (c.projects || []).map((p) => ({ id: p.id, name: p.id === c.projectId ? c.projectName : p.projectName, active: p.id === c.projectId })),
});

/** @param {() => any} get */
export function storyboardTools(get) {
  const t = (name, description, risk, properties, required, run) => ({ name, description, risk, schema: { type: 'object', properties, required: required || [] }, run });
  return [
    t('storyboard_get_state', 'The open storyboard project: name, brief, aspect ratio, duration, model, characters, shots and the project list.', 'read', {}, [], async () => summary(get())),
    t('storyboard_export_json', 'The open project as the storyboard\'s JSON export (shots, characters, aspect ratio, duration). Returned as data; nothing is downloaded.', 'read', {}, [], async () => {
      const c = get();
      return { project: { projectName: c.projectName, shots: c.shots, characters: c.characters, aspectRatio: c.aspectRatio, episodeDuration: c.episodeDuration } };
    }),
    t('storyboard_set_brief', 'Set the project brief (the story idea).', 'write', { brief: str(4000) }, ['brief'], async (a) => { get().setBrief(String(a.brief)); await settle(); return summary(get()); }),
    t('storyboard_set_project_name', 'Rename the open project.', 'write', { name: str(120) }, ['name'], async (a) => { get().setProjectName(String(a.name)); await settle(); return { projectName: get().projectName }; }),
    t('storyboard_set_aspect_ratio', 'Set the aspect ratio.', 'write', { aspect_ratio: { type: 'string', enum: ASPECTS } }, ['aspect_ratio'], async (a) => {
      if (!ASPECTS.includes(a.aspect_ratio)) fail('aspect_ratio must be 16:9 or 9:16');
      get().setAspectRatio(a.aspect_ratio); await settle(); return { aspectRatio: get().aspectRatio };
    }),
    t('storyboard_set_episode_duration', 'Set the total episode length in seconds.', 'write', { seconds: { type: 'number', minimum: 1, maximum: 600 } }, ['seconds'], async (a) => {
      const n = Number(a.seconds); if (!Number.isFinite(n) || n < 1 || n > 600) fail('seconds must be between 1 and 600');
      get().setEpisodeDuration(n); await settle(); return { episodeDuration: get().episodeDuration };
    }),
    t('storyboard_set_model', 'Choose the image model the storyboard uses for shots.', 'write', { model: str(80) }, ['model'], async (a) => {
      if (!STORYBOARD_MODEL_IDS.has(a.model)) fail(`Unknown storyboard model "${String(a.model).slice(0, 40)}".`);
      get().setModel(a.model); await settle(); return { model: get().model };
    }),
    t('storyboard_add_shot', 'Add a shot (scene description and length in seconds).', 'write', { scene: str(2000), duration: { type: 'number', minimum: 1, maximum: 60 }, character_ids: { type: 'array', items: str(40), maxItems: 12 } }, ['scene'], async (a) => {
      const before = new Set((get().shots || []).map((x) => x.id));
      get().addShot({ scene: String(a.scene), duration: Number(a.duration) || 3, ...(Array.isArray(a.character_ids) ? { characterIds: a.character_ids.map(String) } : {}) });
      await settle(); // the studio gives the new shot its own id
      const made = (get().shots || []).find((x) => !before.has(x.id));
      return { id: made?.id, shots: (get().shots || []).length };
    }),
    t('storyboard_update_shot', 'Change a shot\'s scene, duration or characters.', 'write', { id: str(40), scene: str(2000), duration: { type: 'number', minimum: 1, maximum: 60 }, character_ids: { type: 'array', items: str(40), maxItems: 12 } }, ['id'], async (a) => {
      if (!(get().shots || []).some((s) => s.id === a.id)) fail('No shot with that id.');
      const patch = {};
      if (a.scene !== undefined) patch.scene = String(a.scene);
      if (a.duration !== undefined) patch.duration = Number(a.duration) || 3;
      if (a.character_ids !== undefined) patch.characterIds = a.character_ids.map(String);
      get().updateShot(a.id, patch); await settle(); return { updated: a.id };
    }),
    t('storyboard_move_shot', 'Move a shot from one position to another (0-based).', 'write', { from: { type: 'integer', minimum: 0 }, to: { type: 'integer', minimum: 0 } }, ['from', 'to'], async (a) => {
      const n = (get().shots || []).length;
      if (a.from >= n || a.to >= n) fail(`There are ${n} shots; positions run 0 to ${Math.max(n - 1, 0)}.`);
      get().moveShot(a.from, a.to); await settle(); return { shots: summary(get()).shots };
    }),
    t('storyboard_remove_shot', 'Remove a shot.', 'destructive', { id: str(40) }, ['id'], async (a) => {
      if (!(get().shots || []).some((s) => s.id === a.id)) fail('No shot with that id.');
      get().removeShot(a.id); await settle(); return { removed: a.id };
    }),
    t('storyboard_add_character', 'Add a character (name, optional description, optional reference image https URL).', 'write', { name: str(80), description: str(1000), reference_image_url: str(2000) }, ['name'], async (a) => {
      if (a.reference_image_url && !/^https:\/\//i.test(a.reference_image_url)) fail('reference_image_url must be an https link.');
      const before = new Set((get().characters || []).map((x) => x.id));
      get().addCharacterObject({ name: String(a.name), description: a.description, referenceImageUrl: a.reference_image_url });
      await settle();
      return { id: (get().characters || []).find((x) => !before.has(x.id))?.id, characters: summary(get()).characters };
    }),
    t('storyboard_update_character', 'Change a character.', 'write', { id: str(40), name: str(80), description: str(1000), reference_image_url: str(2000) }, ['id'], async (a) => {
      if (!(get().characters || []).some((x) => x.id === a.id)) fail('No character with that id.');
      if (a.reference_image_url && !/^https:\/\//i.test(a.reference_image_url)) fail('reference_image_url must be an https link.');
      const patch = {};
      if (a.name !== undefined) patch.name = String(a.name);
      if (a.description !== undefined) patch.description = String(a.description);
      if (a.reference_image_url !== undefined) patch.referenceImageUrl = a.reference_image_url;
      get().updateCharacter(a.id, patch); await settle(); return { updated: a.id };
    }),
    t('storyboard_remove_character', 'Remove a character.', 'destructive', { id: str(40) }, ['id'], async (a) => {
      if (!(get().characters || []).some((x) => x.id === a.id)) fail('No character with that id.');
      get().removeCharacter(a.id); await settle(); return { removed: a.id };
    }),
    t('storyboard_create_project', 'Start a new storyboard project (the current one stays in the project list).', 'write', {}, [], async () => { get().createProject(); await settle(); return summary(get()); }),
    t('storyboard_switch_project', 'Open another saved storyboard project.', 'write', { id: str(40) }, ['id'], async (a) => {
      if (!(get().projects || []).some((p) => p.id === a.id)) fail('No project with that id.');
      get().switchProject(a.id); await settle(); return summary(get());
    }),
    t('storyboard_delete_project', 'Delete a saved storyboard project.', 'destructive', { id: str(40) }, ['id'], async (a) => {
      if (!(get().projects || []).some((p) => p.id === a.id)) fail('No project with that id.');
      get().deleteProject(a.id); await settle(); return { deleted: a.id };
    }),
  ];
}
