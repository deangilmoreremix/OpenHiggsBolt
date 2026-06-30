import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const S3_PROXY_TIMEOUT_MS = 60_000;

export async function POST(request) {
    try {
        const formData = await request.formData();

        // Extract the original S3 target URL
        const targetUrlRaw = formData.get('x-proxy-target-url');
        const targetUrl = typeof targetUrlRaw === 'string' ? targetUrlRaw.trim() : '';

        if (!targetUrl) {
            return NextResponse.json(
                { error: 'Missing x-proxy-target-url field' },
                { status: 400 }
            );
        }

        const s3FormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (key !== 'x-proxy-target-url') {
                s3FormData.append(key, value);
            }
        }

        const contentLength = request.headers.get('content-length');
        const forwardHeaders = {};
        if (contentLength) {
            forwardHeaders['Content-Length'] = contentLength;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), S3_PROXY_TIMEOUT_MS);

        let s3Response;
        try {
            s3Response = await fetch(targetUrl, {
                method: 'POST',
                body: s3FormData,
                headers: forwardHeaders,
                signal: controller.signal,
            });
        } catch (err) {
            clearTimeout(timeoutId);
            const aborted = err?.name === 'AbortError';
            console.error('S3 Proxy Fetch Error:', err);
            return NextResponse.json(
                {
                    error: aborted
                        ? 'S3 upload timed out'
                        : 'S3 upload failed',
                    status: aborted ? 504 : 502,
                },
                { status: aborted ? 504 : 502 }
            );
        }
        clearTimeout(timeoutId);

        if (s3Response.ok || s3Response.status === 204) {
            return new Response(null, { status: 204 });
        }

        const errorText = await s3Response.text();
        console.error('S3 Proxy Error:', errorText);
        return NextResponse.json(
            { error: 'S3 upload failed', status: s3Response.status },
            { status: 502 }
        );
    } catch (error) {
        console.error('Upload Proxy Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
