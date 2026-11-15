/**
 * Reseller Academy content model.
 *
 * Every lesson follows LEARN -> FOLLOW ALONG -> COMPLETE -> VERIFY.
 * Text fields are plain strings; `code` spans use backticks and are rendered
 * by a tiny safe renderer (no HTML, no markdown library, no raw links in text).
 *
 * Content rules (enforced by tests):
 *  - never contain secret-looking values (sk_live_, whsec_ real values, JWTs)
 *  - external facts that vary by country/UI are phrased as "check the official page"
 *  - app-specific facts (env var names, webhook path, packs) are NOT written
 *    here: lessons set `appPanel` and the UI reads src/data/resellerAppFacts.json
 */

export type AppPanelKind =
  | 'overview'
  | 'accounts'
  | 'muapi'
  | 'database'
  | 'envvars'
  | 'stripe'
  | 'webhook'
  | 'plans'
  | 'branding'
  | 'launch';

export interface ResourceLink {
  label: string;
  url: string;
  kind: 'account' | 'docs' | 'repo' | 'tool';
}

export interface FollowStep {
  /** One instruction. Numbered by the UI. */
  text: string;
  /** Optional official page this step happens on. */
  link?: ResourceLink;
  /** Optional NON-SECRET text the learner may copy (commands, placeholders). */
  copy?: { label: string; value: string };
  /** Optional "expected result" shown under the step. */
  expect?: string;
}

export interface Lesson {
  id: string; // e.g. "7.2"
  title: string;
  minutes: number;
  /** One-sentence outcome shown on the dashboard. */
  outcome: string;
  learn: string[];
  follow: FollowStep[];
  /** Self-reported checklist. Never labelled "verified". */
  complete: string[];
  /** How to confirm it worked, from the learner's own screen. */
  verify: string[];
  mistakes: string[];
  troubleshooting: { problem: string; fix: string }[];
  resources: ResourceLink[];
  glossary: string[]; // glossary keys
  /** Optional collapsible deeper explanation. */
  advanced?: string[];
  /** Render the selected app's verified facts for this lesson. */
  appPanel?: AppPanelKind;
}

export interface Module {
  id: number;
  title: string;
  outcome: string;
  lessons: Lesson[];
}
