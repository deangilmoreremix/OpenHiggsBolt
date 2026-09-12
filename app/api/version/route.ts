import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const data = {
    app: 'SmartVideo GO',
    environment: process.env.CONTEXT || process.env.NODE_ENV,
    commit: process.env.COMMIT_REF || null,
    branch: process.env.BRANCH || null,
    deployId: process.env.DEPLOY_ID || null,
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
