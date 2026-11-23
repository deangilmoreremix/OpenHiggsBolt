// Bundle the server into dist/index.js (one file, shebang, Node 22+). Run by `npm run build` and before `npm pack` / `npm publish`.
import { build } from 'esbuild';
import { chmodSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
mkdirSync(path.join(root, 'dist'), { recursive: true });
// The app's data and helper code mention the upstream service by name (skill example prompts, an API base address, the recipe slug prefix).
// None of it is shown to MCP users and none of it is needed to run the tools, so it is rewritten out of the shipped file:
//   - skill registry: the "muapi-" slug prefix is dropped (the tools do that at runtime anyway) and prose mentions become the brand name;
//   - model lists: provider fields and sample-media addresses are dropped;
//   - any other app source: the upstream API address becomes an unusable placeholder;
//   - mcp/tools.js: the runtime prefix-stripping regex is written with a hex escape so the shipped text has no upstream name.
const BRAND = 'SmartVideo GO';
const scrub = {
  name: 'scrub-upstream-name',
  setup(b) {
    b.onLoad({ filter: /skills[\\/]registry\.json$/ }, (args) => {
      const data = JSON.parse(readFileSync(args.path, 'utf8'));
      for (const sk of data.skills || []) if (typeof sk.slug === 'string') sk.slug = sk.slug.replace(/^muapi-/i, '');
      const text = JSON.stringify(data).replace(/mu-?api(?:\s?app|\s?api)?/gi, BRAND);
      return { contents: text, loader: 'json' };
    });
    b.onLoad({ filter: /(?:packages[\\/]studio[\\/]src|src[\\/]lib)[\\/]models\.js$/ }, (args) => {
      const src = readFileSync(args.path, 'utf8')
        .replace(/^\s*"?provider(_name)?"?\s*:.*$/gm, '')
        .replace(/https?:\/\/[^\s"']*mu-?api[^\s"']*/gi, 'https://example.invalid/sample')
        .replace(/mu-?api(?:\s?app|\s?api)?/gi, BRAND); // sample prompts that name the service
      return { contents: src, loader: 'js' };
    });
    b.onLoad({ filter: /[\\/]mcp[\\/]tools\.js$/ }, (args) => {
      const src = readFileSync(args.path, 'utf8').replace('/^muapi-/i', '/^\\x6duapi-/i');
      return { contents: src, loader: 'js' };
    });
    b.onLoad({ filter: /[\\/]packages[\\/]studio[\\/]src[\\/].*\.(?:js|jsx)$/ }, (args) => {
      const src = readFileSync(args.path, 'utf8');
      if (!/mu-?api/i.test(src)) return undefined;
      return { contents: src.replace(/https?:\/\/api\.mu-?api\.ai/gi, 'https://api.invalid'), loader: args.path.endsWith('x') ? 'jsx' : 'js' };
    });
  },
};
await build({
  plugins: [scrub],
  entryPoints: [path.join(root, 'src/index.js')],
  outfile: path.join(root, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  minifyWhitespace: true, // also drops the source-path comments
  legalComments: 'none',
  banner: { js: '#!/usr/bin/env node\nimport { createRequire as __cr } from "node:module";\nconst require = __cr(import.meta.url);' },
  logLevel: 'warning',
});
chmodSync(path.join(root, 'dist/index.js'), 0o755);
