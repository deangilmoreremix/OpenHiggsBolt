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

        {NICHE_CONTENT.map((niche) => (
          <NicheSection key={niche.id} niche={niche} />
        ))}

        {/* Seedance 2.5 — BeatAPI curated cinematic demos */}
        <AIVideoGallery
          demos={SEEDANCE_25_DEMOS}
          label="Full showcase"
          heading="Every SmartVideo GO AI Demo, On Demand"
          subtext="Browse the full library. Open any prompt or jump straight into the matching studio."
          sectionId="smartvideo-gallery-25"
          initialCount={1000}
        />

        {/* Seedance 1 — ZeroLu community prompts with proof clips */}
        <Seedance1Reel />

        {/* Seedance 2.0 — HuyLe82US community-curated prompts */}
        <SeedancePromptsHero />
        <AIVideoGallery
          demos={[]}
          label="Community prompts"
          heading="Community-Curated Seedance Prompts"
          subtext="Hand-picked prompts from the AI video generation community."
          sectionId="smartvideo-gallery-prompts"
        />

        {/* Visual Prompt Feed — curated AI video demos from x.com */}
        <PromptFeedHero />
        <AIVideoGallery
          demos={PROMPTFEED_DEMOS}
          label="Visual prompt feed"
          heading="AI Video Demos from the Community"
          subtext="Real prompts, real results. Open any to see the full prompt or create your own."
          sectionId="smartvideo-gallery-pf"
          initialCount={1000}
        />

        {/* Combined gallery — all demos */}
        <AIVideoGallery
          demos={COMBINED_DEMOS}
          label="All demos"
          heading="Full Video Demo Library"
          subtext="Browse every AI video demo across all sources. Open any prompt or jump straight into the matching studio."
          sectionId="smartvideo-gallery-all"
          initialCount={1000}
        />
      </div>
    </DemoPromptProvider>
  );
}
