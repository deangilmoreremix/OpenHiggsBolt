import { type VoiceHealth } from '@/shared/voice/voiceService';

export const runtime = 'edge';

const MODAL_SERVICE_URL = process.env.VOICE_MODAL_SERVICE_URL?.replace(/\/$/, '') || '';

export async function GET() {
  if (!MODAL_SERVICE_URL) {
    return Response.json(
      {
        status: 'error',
        service: 'smartvideo-voice',
        version: '0.1.0',
        provider: 'modal',
        detail: 'VOICE_MODAL_SERVICE_URL is not configured',
      } satisfies VoiceHealth,
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${MODAL_SERVICE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      // ignore parse error
    }

    const status = (data.status as VoiceHealth['status']) || 'error';
    const provider = (data.provider as VoiceHealth['provider']) || 'modal';

    return Response.json({
      status,
      service: (data.service as string) || 'smartvideo-voice',
      version: (data.version as string) || '0.1.0',
      provider,
      detail: res.ok ? undefined : `Modal service responded with ${res.status}`,
    } satisfies VoiceHealth);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reach Modal voice service';
    return Response.json(
      {
        status: 'error',
        service: 'smartvideo-voice',
        version: '0.1.0',
        provider: 'modal',
        detail: message,
      } satisfies VoiceHealth,
      { status: 502 }
    );
  }
}
