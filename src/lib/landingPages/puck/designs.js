import d0 from './designs/01-leadiq.js';
import d1 from './designs/02-lead.js';
import d2 from './designs/03-reach.js';
import d3 from './designs/04-persona.js';
import d4 from './designs/05-spark.js';
import d5 from './designs/06-mono.js';
import d6 from './designs/07-poster.js';
import d7 from './designs/08-local.js';
import d8 from './designs/09-enterprise.js';
import d9 from './designs/10-neon.js';
import d10 from './designs/11-pb-agent.js';
import d11 from './designs/12-pb-eats.js';
import d12 from './designs/13-pb-auto.js';
import d13 from './designs/14-pb-health.js';
import d14 from './designs/15-pb-creator.js';
import d15 from './designs/16-pb-pro.js';
import d16 from './designs/17-pb-agency.js';
import d17 from './designs/18-pb-shop.js';
import d18 from './designs/19-pb-enterprise.js';
import d19 from './designs/20-pb-analytics.js';
import d20 from './designs/21-pa-estate.js';
import d21 from './designs/22-pa-bistro.js';
import d22 from './designs/23-pa-motors.js';
import d23 from './designs/24-pa-business.js';
import d24 from './designs/25-pa-travel.js';
import d25 from './designs/26-pa-fitness.js';
import d26 from './designs/27-pa-learn.js';
import d27 from './designs/28-pa-local.js';
import d28 from './designs/29-pa-spa.js';
import d29 from './designs/30-pa-creative.js';
import d30 from './designs/31-results.js';
import d31 from './designs/32-realtor.js';
import d32 from './designs/33-dreamhome.js';
import d33 from './designs/34-pc-plumbing.js';
import d34 from './designs/35-pc-pest.js';
import d35 from './designs/36-pc-landscape.js';
import d36 from './designs/37-pc-cleaning.js';
import d37 from './designs/38-pc-vet.js';
import d38 from './designs/39-pc-vision.js';
import d39 from './designs/40-pc-insurance.js';
import d40 from './designs/41-pc-preschool.js';
import d41 from './designs/42-pc-moving.js';
import d42 from './designs/43-pc-solar.js';
import d43 from './designs/44-pd-dental.js';
import d44 from './designs/45-pd-chiro.js';
import d45 from './designs/46-pd-medspa.js';
import d46 from './designs/47-pd-salon.js';
import d47 from './designs/48-pd-restaurant.js';
import d48 from './designs/49-pc-roofing.js';
import d49 from './designs/50-pc-hvac.js';
import d50 from './designs/51-pc-detailing.js';
import d51 from './designs/52-pc-realestate.js';
import d52 from './designs/53-pc-gym.js';
import d53 from './designs/54-pc-septic-long.js';
import d54 from './designs/55-pc-septic-short.js';
import d55 from './designs/56-pc-radon-long.js';
import d56 from './designs/57-pc-radon-short.js';
import d57 from './designs/58-pc-crawl-long.js';
import d58 from './designs/59-pc-crawl-short.js';
import d59 from './designs/60-pc-tub-long.js';
import d60 from './designs/61-pc-tub-short.js';
import d61 from './designs/62-pc-pool-long.js';
import d62 from './designs/63-pc-pool-short.js';
import d63 from './designs/64-pc-drone-short.js';
import d64 from './designs/65-pc-grooming-short.js';
import d65 from './designs/66-pd-drone-long.js';
import d66 from './designs/67-pd-grooming-long.js';
import d67 from './designs/68-pd-bees-long.js';
import d68 from './designs/69-pd-grease-long.js';
import d69 from './designs/70-pd-backflow-long.js';

/**
 * Editable-page templates: plain data (no React) so templates.js can list them.
 * `puckData` is the initial Puck page; every component prop in it is editable in the studio.
 */
const id = (n) => `${n}-starter`;
const hero = {
  type: 'Hero',
  props: {
    id: id('hero'),
    variant: 'copy-video-form',
    eyebrow: 'A video made for you',
    headline: 'Hi {{firstname|there}}, here is a smarter way to [[grow your business.]]',
    subhead: 'Press play for a short video, then tell us what you think.',
    bullets: [{ text: 'Made for {{company|your team}}' }, { text: 'Takes two minutes' }],
    buttons: [],
    chip: 'Hi {{firstname|there}}!',
    photo: '',
    showForm: 'yes',
    formTitle: 'Want to talk it through?',
    formSubtitle: 'Leave your details and we will be in touch.',
    formFields: [{ key: 'name', label: 'Your Name', type: 'text', required: true }, { key: 'email', label: 'Your Email', type: 'email', required: true }, { key: 'company', label: 'Your Company', type: 'text', required: false }],
    submitLabel: 'Send',
    privacy: '',
  },
};
const nav = { type: 'NavBar', props: { id: id('nav'), brand: 'Your brand', logo: '', links: [{ label: 'Product', url: '' }, { label: 'Pricing', url: '' }, { label: 'Resources', url: '' }], loginLabel: 'Log In', loginUrl: '', ctaLabel: 'Book a Demo' } };
const strip = { type: 'Strip', props: { id: id('strip'), kind: 'logos', title: 'Trusted by growth-focused teams', items: [{ title: 'Acme', text: '', value: '', icon: '' }, { title: 'Globex', text: '', value: '', icon: '' }, { title: 'Initech', text: '', value: '', icon: '' }] } };
const grid = {
  type: 'Grid',
  props: {
    id: id('grid'),
    columns: 3,
    items: [
      { type: 'LeadMagnetCard', props: { id: id('magnet'), columns: 1, tag: 'FREE RESOURCE', title: 'Get the free playbook', cover: 'The Personalized Video Playbook', text: 'A short guide with templates and scripts.', placeholder: 'Enter your email', buttonLabel: 'Send me the playbook' } },
      { type: 'FeaturesCard', props: { id: id('feats'), columns: 1, title: 'Key features', items: [{ icon: 'video', title: 'Personalized video', text: 'One-to-one videos in minutes.' }, { icon: 'chart', title: 'Insights', text: 'Track views and replies.' }] } },
      { type: 'QuoteCard', props: { id: id('quote'), columns: 1, heading: 'What people say', quotes: [{ text: 'Add a quote you have permission to use.', name: 'Name', role: 'Role, Company' }] } },
    ],
  },
};
const band = { type: 'Band', props: { id: id('band'), brand: '', tagline: '', title: 'Get tips and updates in your inbox', text: '', placeholder: 'Enter your email', buttonLabel: 'Subscribe', social: '' } };
const footer = { type: 'Footer', props: { id: id('footer'), text: 'Sent by {{sender|us}}', links: [] } };

const STARTER = [
  {
    id: 'puck-starter',
    name: 'Editable landing page',
    description: 'A responsive landing page you edit visually: add, remove and reorder sections and change every word, image and link.',
    theme: { mode: 'light', accent: '#2563eb', highlight: '#2563eb', bg: '#ffffff', text: '#0f172a', font: 'system' },
    layout: 'puck',
    puck: true,
    radius: 14,
    puckData: { root: { props: { design: 'clean', accent: '#2563eb', background: '#ffffff', text: '#0f172a', surface: '' } }, content: [nav, hero, strip, grid, band, footer], zones: {} },
  },
];

// One file per converted design (puck/designs/NN-name.js, default export = a template object).
const EXTRA = [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16, d17, d18, d19, d20, d21, d22, d23, d24, d25, d26, d27, d28, d29, d30, d31, d32, d33, d34, d35, d36, d37, d38, d39, d40, d41, d42, d43, d44, d45, d46, d47, d48, d49, d50, d51, d52, d53, d54, d55, d56, d57, d58, d59, d60, d61, d62, d63, d64, d65, d66, d67, d68, d69].filter(Boolean);

// A design that never mentions the person gets the greeting strip, so a personal link is always visibly personal
// (generic visitors never see it). Designs that already greet by name are left alone.
const DEFAULT_GREETING = 'A personal video for {{firstname|you}}';
const greets = (data) => /\{\{\s*(firstname|company|custom[12])\b/.test(JSON.stringify(data));
const withGreeting = (t) => {
  if (!t?.puckData?.root || greets(t.puckData)) return t;
  return { ...t, puckData: { ...t.puckData, root: { ...t.puckData.root, props: { ...(t.puckData.root.props || {}), greeting: t.puckData.root.props?.greeting || DEFAULT_GREETING } } } };
};

export const PUCK_TEMPLATES = [...STARTER, ...EXTRA].map(withGreeting);
