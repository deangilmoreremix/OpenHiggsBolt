# muapi-studio (vendored build)

Prebuilt output of the standalone `muapi-studio` package. It is deliberately NOT a pnpm workspace member and not a
dependency in `package.json`: `src/apps/muapi-studio/MuapiStudioPanel.jsx` imports it by relative path, so
`pnpm-lock.yaml` (frozen in CI) is untouched.

Do not edit by hand: rebuild the package and copy `dist/muapi-studio.js` to `index.js` and `dist/style.css` to
`style.css`.

Mounted as the "Muapi Studio" tab in `components/StandaloneShell.js`, using the signed-in user's own MuAPI key
through this app's `/api/v1` proxy.
