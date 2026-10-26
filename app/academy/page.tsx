import AcademyCourse from '@/components/academy/AcademyCourse';
import { getAllTracks } from '@/lib/academyLessons';
import manifest from '@/data/academyMediaManifest.json';
import { DemoPersonalizeProvider } from '@/shared/personalization';
import PersonalizeVideoAction from '@/components/PersonalizeVideoAction';
import type { StudioPersonalizeOptions } from '@/shared/personalization/studioEntry';

export const metadata = {
  title: 'Academy — AI Video Ads & UGC · SmartVideo GO AI',
  description:
    'Imported course tracks on AI UGC video ads and more: rebranded for SmartVideo GO AI. Lessons, example media, and interactive templates wired into the Create-With-AI recipes.',
};

/**
 * Academy — the Personalize trigger.
 *
 * The Academy route is rendered OUTSIDE `components/StandaloneShell.js`, so it
 * needs its OWN `DemoPersonalizeProvider` mount (exactly one per trigger) and
 * its own trigger. The provider wraps the course content, and the trigger
 * personalizes the first bundled example media of the course manifest —
 * the same real, app-served asset a learner sees in the "See" step.
 */
export default function AcademyPage() {
  const tracks = getAllTracks();

  const manifestEntries = manifest as Array<{
    track: string;
    trackTitle: string;
    type: 'image' | 'gif' | 'video';
    src: string;
    file: string;
  }>;
  const firstMedia = manifestEntries[0] || null;

  const studioPersonalizeOptions: StudioPersonalizeOptions | null = firstMedia
    ? {
        originStudio: 'academy',
        studioProjectId: `${firstMedia.track} : ${firstMedia.file}`,
        title: `${firstMedia.trackTitle} example media`,
        category: 'academy',
        media: {
          mediaType: firstMedia.type === 'video' ? 'video' : 'image',
          url: firstMedia.src,
          poster: null,
        },
        prompt: { text: `${firstMedia.trackTitle} example media (${firstMedia.type}).` },
      }
    : null;

  return (
    <DemoPersonalizeProvider>
      <AcademyCourse tracks={tracks} />
      {studioPersonalizeOptions && (
        <div className="fixed bottom-4 left-4 z-40">
          <PersonalizeVideoAction
            options={studioPersonalizeOptions}
            className="px-3 py-2 rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm text-xs font-semibold text-white/80 hover:text-white hover:border-[#22d3ee]/60 transition-colors"
          >
            Personalize
          </PersonalizeVideoAction>
        </div>
      )}
    </DemoPersonalizeProvider>
  );
}
