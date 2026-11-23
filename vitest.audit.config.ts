import { transformWithEsbuild } from 'vite';
import base from './vitest.config';

// Runs only the tooltip coverage audit (scripts/audit-tooltip-coverage.audit.jsx), which is deliberately kept out of the normal
// `vitest run` include list: it is a report, not a pass/fail test.   npm run audit:tooltips
//
// The shell and some studios are .js files that contain JSX (Next compiles them that way); Vite only parses JSX in .jsx/.tsx, so this
// config treats .js under components/, app/ and packages/studio/src as JSX for the audit run only.
const jsAsJsx = {
  name: 'audit-js-as-jsx',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('node_modules') && /\/(components|app|packages\/studio\/src)\/[^?]*\.js$/.test(id)) {
      return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
    }
    return null;
  },
};

export default {
  ...base,
  plugins: [...((base as { plugins?: unknown[] }).plugins ?? []), jsAsJsx],
  test: {
    ...base.test,
    include: ['scripts/audit-tooltip-coverage.audit.jsx'],
    testTimeout: 90000,
  },
};
