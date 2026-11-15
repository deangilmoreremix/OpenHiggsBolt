// Writes seed.json for the fake Supabase: two published pages, one draft, one contact.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const { defaultConfig } = await import(path.join(root, 'src/lib/landingPages/templates.js'));
const mk = (id, tpl, published = true) => ({ id, clerk_user_id: 'user_x', title: `Demo ${tpl}`, video_url: 'https://cdn.test/clip.webm', poster_url: null, duration: 4, source: {}, config: defaultConfig(tpl, { title: 'Demo' }), published, view_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
const pages = { SparkPage01: mk('SparkPage01', 'puck-spark'), StartPage01: mk('StartPage01', 'puck-starter'), DraftPage01: mk('DraftPage01', 'puck-starter', false) };
fs.writeFileSync(path.join(here, 'seed.json'), JSON.stringify({ pages, contacts: { contactMaya1: { id: 'contactMaya1', page_id: 'StartPage01', fields: { firstname: 'Maya', company: 'Brightline', email: 'maya@x.io' } } }, leads: [], events: [] }));
console.log('seed written:', Object.keys(pages).join(', '));
