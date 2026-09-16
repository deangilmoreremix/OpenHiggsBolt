import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const htmlPath = path.join(process.cwd(), 'public', 'voice-studio', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Rewrite asset paths to be relative to /studio/voice
  html = html.replace(/href="\/assets\//g, 'href="/voice-studio/assets/');
  html = html.replace(/src="\/assets\//g, 'src="/voice-studio/assets/');
  html = html.replace(/href="\/favicon.svg"/g, 'href="/voice-studio/favicon.svg"');

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
  });
}
