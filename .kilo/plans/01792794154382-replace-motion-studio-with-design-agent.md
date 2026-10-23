# MOTION STUDIO DESIGN REPLACEMENT AND DESIGN AGENT MODAL

## 1. Source Files Inspected

- `src/apps/design-agent/DesignAgent.tsx`: Main Design Agent component with complete interface structure
- `src/apps/design-agent/ErrorBoundary.tsx`: Error boundary component for design agent
- `src/shared/styles/designTokens.ts`: Design tokens used throughout the application
- `src/apps/video-studio/VideoGenerate.tsx`: Current Motion Studio homepage
- `src/apps/video-studio/VideoEditor.tsx`: Current Motion Studio editor interface
- `src/apps/video-studio/VideoLibrary.tsx`: Project browsing interface

## 2. Components Reused

### Design Agent Components
- `DesignAgent` component: Complete interface with chat, templates, brand kit, attachments
- `ErrorBoundary`: Error handling for design agent UI
- `ModeControls`: Mode switching (agent/generate/edit)
- `AttachmentStrip`: Reference attachment management
- `TemplateModal`: Template selection interface
- `BrandKitModal`: Brand kit management
- `AssetModal`: Asset preview and editing modal

### Motion Studio Components (Preserved)
- ShotCraft engine and recipes
- Remotion player
- Workbench interface
- Storyboarding functionality
- Project persistence
- Export functionality

## 3. Old Motion Studio UI Replaced

### Homepage (VideoGenerate)
- **Before**: Simple prompt input with model selection, duration, aspect ratio, and basic generate button
- **After**: DesignAgent-style homepage with:
  - Large centered AI prompt composer
  - Media/reference attachment controls
  - Brand Kit access
  - Motion templates selection
  - Recent projects display
  - Dark premium design theme

### Active-Project Interface (VideoEditor)
- **Before**: Basic video editing with simple duration slider and effects buttons
- **After**: DesignAgent chat workspace with:
  - Persistent AI Director conversation
  - Storyboard proposals and scene assets
  - Real Remotion film preview
  - Expandable Motion Workbench
  - Conversational scene editing
  - Workbench opening from chat

## 4. Design Agent Chat Implementation

### Integration Approach
- Create a new component that integrates DesignAgent with Motion Studio's project system
- Use existing DesignAgent chat patterns but adapt to Motion Studio's project context
- Implement smallest secure adapter connecting chat to real ShotCraft operations
- Preserve all existing ShotCraft functionality and ShotCraft recipes

### Key Features
- Create film-production plans through conversation
- Product/page capture requests
- Storyboard generation
- Real ShotCraft shot selection
- Remotion composition creation
- Scene revision and media replacement
- Brand and title changes
- Timing and audio adjustments
- Rendering and export requests

## 5. Storyboarding Integration

- Reuse existing storyboard infrastructure
- Editable storyboard cards with scene details
- Approval workflow using DesignAgent-style controls
- Real composition assembly on approval

## 6. Real Motion Preview Playback Fix

- Repair issues in `src/data/motionRecipeCatalog.ts` and `src/shared/personalization/guided/TemplateBrowser.tsx`
- Ensure proper preview/poster URL handling
- Maintain selectable animated previews
- Avoid loading hundreds of full videos simultaneously

## 7. Design Agent Personalization Popup

### Integration Approach
- Add DesignAgent as a popup within existing PersonalizationModal
- Use existing modal architecture for consistency
- Support context-aware editing for personalization assets
- Preserve free Business Asset Finder functionality

### Required Features
- Open directly from selected personalization assets
- Show selected source asset in DesignAgent
- Pass relevant brand/context when supported
- DesignAgent chat with reference attachments
- Template selection and generation
- Result preview and selection
- Apply result to correct personalization target
- Open full DesignAgent for advanced work

## 8. Quality Gates

- Run TypeScript compilation
- Run relevant unit tests
- Run Design Agent regression tests
- Run Personalization tests
- Run Motion Studio tests
- Run browser E2E tests
- Verify production build
- Verify preview deployment

## 9. Reporting

- Create `docs/MOTION_STUDIO_DESIGN_REPLACEMENT_AND_DESIGN_AGENT_MODAL.md` with:
  - Source files inspected
  - Components reused
  - Old UI replaced
  - Functions preserved
  - Implementation details
  - Asset handoff mapping
  - Storyboard and Workbench behavior
  - Real video preview results
  - Before-and-after screenshots
  - E2E results
  - Performance issues
  - Security findings
  - Remaining defects
  - Tested commit
  - Netlify deploy preview
  - Production-readiness decision

## 10. Final Acceptance Criteria

- Motion Studio interface replaced with Design Agent visual experience
- User can create and revise actual ShotCraft film through conversation
- Personalization user can open DesignAgent popup, generate/edit assets, preview, and apply
- Original Design Agent, Motion Studio engine, and Personalization functionality remain working
- No automatic deployment to production