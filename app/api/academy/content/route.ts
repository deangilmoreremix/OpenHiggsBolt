import { NextRequest, NextResponse } from 'next/server';
import { getLessonMarkdown, getTemplateMarkdown } from '@/lib/academyLessons';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const track = searchParams.get('track');
  const slug = searchParams.get('slug');
  const kind = searchParams.get('kind') || 'lesson';

  if (!track || !slug) {
    return NextResponse.json({ error: 'missing track or slug' }, { status: 400 });
  }

  const markdown =
    kind === 'template' ? getTemplateMarkdown(track, slug) : getLessonMarkdown(track, slug);

  return NextResponse.json({ markdown });
}
