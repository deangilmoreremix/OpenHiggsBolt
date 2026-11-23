# Export benchmark

Measures how long the web renderer needs per frame for each Motion Director recipe
(`demosrc/_generated/exportCost.ts` is generated from it).

1. Copy `harness.tsx`, `index.html`, `vite.config.mjs` into a scratch folder with a `public/home.png`,
   symlink the repo's `node_modules`, and `vite build` it (the paths in `harness.tsx` assume the repo is at
   `/home/user/OpenHiggsBolt` — adjust them).
2. Serve the build (`python3 -m http.server`) with `public/motion-studio` linked in.
3. Run 3 shards: `node shard.cjs K 3 PORT results-K.jsonl` (K = 0, 1, 2).
4. `node scripts/gen-export-cost.mjs results-*.jsonl`.

Each recipe renders 0.6 s of 1080p with a 40 s limit; numbers are a ranking on one headless CPU core
(a recipe stopped at the limit is "at least this slow"), not a prediction for a real machine.
