#!/usr/bin/env node
/**
 * Motion catalog ↔ card-registry bridge check.
 *
 * The Motion Studio card registry keys every demo card as `demo:<Stem>` while
 * the shot catalog uses `<category>/<slug>/<Component>`. This script loads both
 * real modules (through Vite's SSR loader, so TSX demo components resolve
 * exactly as they do in the app) and asserts that the bridge function
 * `motionCardId` maps every catalog shot onto a registered card.
 *
 *   node scripts/verify-motion-catalog-bridge.mjs
 *
 * Exit code 0 = every shot resolves.
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  resolve: { alias: [{ find: /^@\/(.*)$/, replacement: '/src/$1' }] },
  // Bundle the Remotion packages so their ESM entry points resolve.
  ssr: { noExternal: [/^remotion/, /^@remotion\//] },
});

let failed = false;
try {
  const { CARDS } = await server.ssrLoadModule('/src/apps/motion-studio/cards/registry.ts');
  const {
    MOTION_TEMPLATES,
    MOTION_TEMPLATE_CARDS,
    motionCardId,
    motionCardIdFor,
    resolveMotionTemplate,
  } = await server.ssrLoadModule('/src/data/motionRecipeCatalog.ts');

  const shots = MOTION_TEMPLATES;
  const missing = shots.filter((t) => !CARDS[motionCardId(t)]);

  console.log(`registered cards: ${Object.keys(CARDS).length}`);
  console.log(`catalog shots:    ${shots.length}`);
  console.log(`resolved:         ${shots.length - missing.length}/${shots.length}`);

  if (missing.length) {
    failed = true;
    console.error('\nUNRESOLVED SHOTS:');
    for (const t of missing) console.error(`  ${t.id} -> ${motionCardId(t)}`);
  }

  // The grouped cards (124) must resolve too — they are what the Templates
  // tab renders.
  const missingCards = MOTION_TEMPLATE_CARDS.filter((c) => !CARDS[motionCardId(c)]);
  console.log(`grouped cards:    ${MOTION_TEMPLATE_CARDS.length - missingCards.length}/${MOTION_TEMPLATE_CARDS.length}`);
  if (missingCards.length) {
    failed = true;
    console.error('\nUNRESOLVED GROUPED CARDS:');
    for (const c of missingCards) console.error(`  ${c.id} -> ${motionCardId(c)}`);
  }

  // Spot-check the identifier flavours the UI can hand us.
  const sample = shots.find((t) => t.slug === 'crash-zoom-punch' && t.componentName === 'CrashZoomReal');
  const flavours = [
    ['shot id', sample.id],
    ['grouped id', 'camera/crash-zoom-punch'],
    ['slug', 'crash-zoom-punch'],
    ['component name', 'CrashZoomReal'],
  ];
  for (const [label, id] of flavours) {
    const cardId = motionCardIdFor(id);
    const ok = Boolean(cardId && CARDS[cardId]);
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(14)} ${id} -> ${cardId ?? 'unresolved'}`);
    if (!ok) failed = true;
  }
  const resolved = resolveMotionTemplate('camera/crash-zoom-punch');
  console.log(`  ok   grouped id resolves to slug "${resolved?.slug}"`);

  if (!failed) {
    console.log('\nBRIDGE OK — every catalog shot maps to a registered card.');
  } else {
    console.error('\nBRIDGE BROKEN — see the list above.');
  }
} finally {
  await server.close();
}

process.exit(failed ? 1 : 0);
