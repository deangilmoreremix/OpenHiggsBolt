'use client';
import { DemoPromptProvider } from './DemoPromptModal';
import InteractiveStudioSection from './InteractiveStudioSection';
import MadeWithSmartVideo from './MadeWithSmartVideo';
import UGCDemoShowcase from './UGCDemoShowcase';
import AIVideoGallery from './AIVideoGallery';
import Seedance1Reel from './Seedance1Reel';
import SeedancePromptsHero from './SeedancePromptsHero';
import PromptFeedHero from './PromptFeedHero';
import { SEEDANCE_25_DEMOS } from '@/data/seedance25Demos';
import { SEEDANCE_1_DEMOS } from '@/data/seedance1Demos';
import { PROMPTFEED_DEMOS } from '@/data/promptFeedDemos';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';
import { type VideoDemo } from '@/data/types';
import { NICHE_CONTENT } from '@/data/nicheContent';
import NicheSection from './NicheSection';
import IndustryNav from './IndustryNav';
import NearViewport from './fx/NearViewport';

const COMBINED_DEMOS: VideoDemo[] = [
  ...MINIMAX_H3_DEMOS,
  ...SEEDANCE_25_DEMOS,
  ...SEEDANCE_1_DEMOS,
  ...PROMPTFEED_DEMOS,
];

/**
 * Single integration point for the SmartVideo GO AI video showcase. It wraps every
 * new section in the prompt-modal provider so "View Prompt" works anywhere, and
 * mounts the modal once. The existing LandingPage renders this as one block.
 */
export default function SmartVideoShowcase() {
  return (
    <DemoPromptProvider>
      <div id="smartvideo-showcase">
        <InteractiveStudioSection />
        <MadeWithSmartVideo />
        <UGCDemoShowcase />

        {/* Sticky industry jump bar scoped to the niche sections */}
        <div>
          <IndustryNav niches={NICHE_CONTENT} />
          {/* Each industry mounts as the visitor nears it; the wrapper keeps the anchor id. */}
          {NICHE_CONTENT.map((niche) => (
            <NearViewport key={niche.id} id={`niche-${niche.id}`}>
              <NicheSection niche={niche} withAnchor={false} />
            </NearViewport>
          ))}
        </div>

        {/* Seedance 2.5 — BeatAPI curated cinematic demos */}
        <NearViewport id="smartvideo-gallery-25">
          <AIVideoGallery
            demos={SEEDANCE_25_DEMOS}
            label="Full showcase"
            heading="Every SmartVideo GO AI Demo, On Demand"
            subtext="Browse the full library. Open any prompt or jump straight into the matching studio."
            sectionId="smartvideo-gallery-25"
            withAnchor={false}
          />
        </NearViewport>

        {/* Seedance 1 — ZeroLu community prompts with proof clips */}
        <NearViewport placeholderClassName="min-h-[940px]">
          <Seedance1Reel />
        </NearViewport>

        {/* Seedance 2.0 — HuyLe82US community-curated prompts. Its gallery had no
            demos to show, so only the hero is rendered for now. */}
        <SeedancePromptsHero />

        {/* Visual Prompt Feed — curated AI video demos from x.com */}
        <PromptFeedHero />
        <NearViewport id="smartvideo-gallery-pf">
          <AIVideoGallery
            demos={PROMPTFEED_DEMOS}
            label="Visual prompt feed"
            heading="AI Video Demos from the Community"
            subtext="Real prompts, real results. Open any to see the full prompt or create your own."
            sectionId="smartvideo-gallery-pf"
            withAnchor={false}
          />
        </NearViewport>

        {/* Combined gallery — all demos */}
        <NearViewport id="smartvideo-gallery-all">
          <AIVideoGallery
            demos={COMBINED_DEMOS}
            label="All demos"
            heading="Full Video Demo Library"
            subtext="Browse every AI video demo across all sources. Open any prompt or jump straight into the matching studio."
            sectionId="smartvideo-gallery-all"
            withAnchor={false}
          />
        </NearViewport>
      </div>
    </DemoPromptProvider>
  );
}
