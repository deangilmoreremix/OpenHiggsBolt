import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

function readBuildInfo() {
  const buildInfoPath = path.join(process.cwd(), 'src', 'generated', 'build-info.json');
  try {
    const raw = fs.readFileSync(buildInfoPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  const buildInfo = readBuildInfo();

  const data = {
    app: 'SmartVideo GO',
    environment: buildInfo?.context || process.env.CONTEXT || process.env.NODE_ENV || 'local',
    commit: buildInfo?.commit || process.env.COMMIT_REF || null,
    branch: buildInfo?.branch || process.env.BRANCH || null,
    context: buildInfo?.context || process.env.CONTEXT || 'local',
    deployId: buildInfo?.deployId || process.env.DEPLOY_ID || null,
    buildId: buildInfo?.buildId || process.env.BUILD_ID || null,
    deployUrl: buildInfo?.deployUrl || process.env.DEPLOY_URL || null
  };

  return NextResponse.json(data);
}
