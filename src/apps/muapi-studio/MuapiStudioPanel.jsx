'use client';

// Muapi Studio tab: a muapi.ai/studio-style studio (Image, Video, Audio, Avatar, 3D, Tools, Text, More) that can
// generate with any model in the MuAPI catalog. The component is the prebuilt package in packages/muapi-studio,
// imported by relative path so the frozen pnpm lockfile is untouched.
//
// Auth and network: the signed-in user's OWN MuAPI key is sent to this app's /api/v1 proxy
// (app/api/v1/[...slug]/route.ts), which applies the SMARTVIDEO_GO entitlement exactly as for every other studio.
// With no key the studio shows "Connect your MuAPI key" and the button opens the app's own key modal.
//
// Two things that proxy does not provide are switched off here instead of failing at runtime:
//   - the media library (/app/media-library is not under /api/v1);
//   - deleting generated files (the proxy only allows DELETE for social accounts).
// Everything else the studio uses (model catalog and schemas, cost estimates, submit, polling, history, balance and
// uploads) is forwarded by the proxy.

import { MuapiStudio } from '../../../packages/muapi-studio/index.js';
import '../../../packages/muapi-studio/style.css';

const FEATURES = { library: false, deleteMedia: false };

export default function MuapiStudioPanel({ apiKey, onRequestApiKey }) {
  return (
    <div className="h-full w-full">
      <MuapiStudio
        apiBase=""
        apiKey={apiKey || ''}
        onRequestApiKey={onRequestApiKey}
        theme="cyan"
        layout="tabs"
        showHeader={false}
        features={FEATURES}
      />
    </div>
  );
}
