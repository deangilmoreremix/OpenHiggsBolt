'use client';

/**
 * The app-root Personalization trigger for a studio.
 *
 * WHY THIS FILE EXISTS
 * -------------------
 * `packages/studio` is published standalone: its `package.json` has
 * `main`/`module` = `src/index.js` and `files: ["src", "dist"]`, so its
 * `src/` directory IS the published entry point. A studio that imported the
 * app's `src/shared/personalization/studioEntry` module directly would ship
 * that repo-only path into the published tarball.
 *
 * So the studios take a `renderPersonalizeAction` render prop instead, and
 * the app root — which owns the shared module — injects the trigger through
 * this component.
 *
 * The shared module is imported through the `@/` alias here because the app
 * root has alias resolution; the studio package does not.
 */

import { PersonalizeStep } from '@/shared/personalization/studioEntry';

/**
 * Renders the shared Personalization Modal trigger for one studio.
 *
 * @param {object} props
 * @param {import('@/shared/personalization/studioEntry').StudioPersonalizeOptions} props.options
 *   The hand-off payload the studio built.
 * @param {string} [props.className]
 *   The classes of the trigger button.
 * @param {React.ReactNode} [props.children]
 *   The button label. Defaults to "Personalize".
 */
export default function PersonalizeVideoAction({ options, className, children }) {
  return (
    <PersonalizeStep options={options} className={className}>
      {children ?? 'Personalize'}
    </PersonalizeStep>
  );
}
