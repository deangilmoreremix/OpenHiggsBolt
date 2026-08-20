'use client';
import { DemoPromptProvider } from './DemoPromptModal';
import CinematicVideoHero from './CinematicVideoHero';
import InteractiveStudioSection from './InteractiveStudioSection';
import MadeWithSmartVideo from './MadeWithSmartVideo';
import UGCDemoShowcase from './UGCDemoShowcase';
import AIVideoGallery from './AIVideoGallery';

/**
 * Single integration point for the SmartVideo GO AI video showcase. It wraps every
 * new section in the prompt-modal provider so "View Prompt" works anywhere, and
 * mounts the modal once. The existing LandingPage renders this as one block.
 */
export default function SmartVideoShowcase() {
  return (
    <DemoPromptProvider>
      <div id="smartvideo-showcase">
        <CinematicVideoHero />
        <InteractiveStudioSection />
        <MadeWithSmartVideo />
        <UGCDemoShowcase />
        <AIVideoGallery />
      </div>
    </DemoPromptProvider>
  );
}
