/**
 * Netlify local plugin: sync the packaged Next.js SSR function into the
 * LINKED SITE's base directory.
 *
 * Why this exists
 * ---------------
 * `@netlify/plugin-nextjs` packages the SSR handler into
 *   <build dir>/.netlify/functions-internal/___netlify-server-handler
 * and `netlify.toml` lists that directory in
 *   [functions."___netlify-server-handler"] included_files
 *
 * `included_files`, however, is resolved by the deploy step against the
 * SITE BASE DIRECTORY, which has been observed to be the ROOT CHECKOUT when
 * the worktree is nested inside it (the CLI's repository-root detection uses
 * findUp('.git', { type: 'directory' }) and a worktree's .git is a FILE).
 * The deploy step therefore packages the ROOT checkout's copy of the
 * function, not the one this build just produced — unless that copy is
 * updated by this plugin BEFORE the deploy step runs.
 *
 * This plugin runs AFTER @netlify/plugin-nextjs's onPostBuild (plugin order
 * in netlify.toml) and copies this build's packaged function into the base
 * directory of every linked-site root we can find above the publish dir, so
 * whichever base the deploy step uses, the packaged tree is THIS build's.
 *
 * v2 fixes:
 *  - PUBLISH_DIR can be RELATIVE ('.next'). `path.dirname('.next')` is '.'
 *    and `path.dirname('.') === '.'` terminated the walk-up loop after a
 *    single iteration, so parent linked-site roots were never found and the
 *    root checkout kept its STALE copy (that is exactly what happened in
 *    preview v17). Everything is resolved to absolute paths now.
 *  - The sync is VERIFIED: the plugin re-hashes run-config.json in the
 *    destination and fails the build if any linked root still holds a
 *    stale copy, instead of silently deploying a mismatched function.
 *
 * In a normal CI build (base == checkout) the copy is a self-no-op.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const FUNCTION_NAME = '___netlify-server-handler';
const MARKER_FILE = 'run-config.json';

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

module.exports = {
  onPostBuild: async ({ constants, utils }) => {
    // PUBLISH_DIR may be relative (e.g. '.next'); make everything absolute.
    const publishDir = path.resolve(constants.PUBLISH_DIR);
    const src = path.join(publishDir, '..', '.netlify', 'functions-internal', FUNCTION_NAME);

    if (!fs.existsSync(src)) {
      console.log(`[sync-ssr-function] source function not found at ${src}; skipping`);
      return;
    }
    const srcSha = sha256(path.join(src, MARKER_FILE));
    console.log(`[sync-ssr-function] source ${src} (run-config ${srcSha.slice(0, 12)})`);

    // Walk up from the publish dir collecting every directory that is a
    // linked-site root (contains .netlify/state.json). The first one is the
    // build dir itself (self-copy -> no-op in CI); the ones above it are
    // parent checkouts whose stale bundles must be replaced.
    const targets = [];
    let dir = path.dirname(publishDir);
    for (let i = 0; i < 16; i++) {
      if (fs.existsSync(path.join(dir, '.netlify', 'state.json'))) {
        targets.push(path.join(dir, '.netlify', 'functions-internal'));
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    if (targets.length === 0) {
      console.log('[sync-ssr-function] no linked-site roots found; skipping');
      return;
    }

    let synced = 0;
    for (const destDir of targets) {
      const dest = path.join(destDir, FUNCTION_NAME);
      try {
        const destMarker = path.join(dest, MARKER_FILE);
        const alreadyCurrent =
          fs.existsSync(dest) &&
          fs.realpathSync(dest) === fs.realpathSync(src);
        if (alreadyCurrent) {
          console.log(`[sync-ssr-function] ${dest} is this build (no-op)`);
          synced++;
          continue;
        }
        const destShaBefore = fs.existsSync(destMarker) ? sha256(destMarker) : 'missing';
        fs.rmSync(dest, { recursive: true, force: true });
        fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: false });
        const destShaAfter = sha256(destMarker);
        if (destShaAfter !== srcSha) {
          utils.build.failBuild(
            `[sync-ssr-function] sync verification FAILED for ${dest}: run-config.json ${destShaAfter.slice(0, 12)} != source ${srcSha.slice(0, 12)}`,
          );
        }
        synced++;
        console.log(
          `[sync-ssr-function] synced ${src} -> ${dest} (run-config ${destShaBefore.slice(0, 12)} -> ${destShaAfter.slice(0, 12)})`,
        );
      } catch (err) {
        utils.build.failBuild(
          `[sync-ssr-function] could not sync to ${dest}: ${err.message}`,
        );
      }
    }

    if (synced === 0) {
      utils.build.failBuild('[sync-ssr-function] failed to sync the SSR function to any site base directory');
    }
  },
};
