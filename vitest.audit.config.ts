import base from './vitest.config';

// Runs only the tooltip coverage audit (scripts/audit-tooltip-coverage.audit.jsx), which is deliberately kept out of the normal
// `vitest run` include list: it is a report, not a pass/fail test.   npm run audit:tooltips
export default {
  ...base,
  test: {
    ...base.test,
    include: ['scripts/audit-tooltip-coverage.audit.jsx'],
    testTimeout: 90000,
  },
};
