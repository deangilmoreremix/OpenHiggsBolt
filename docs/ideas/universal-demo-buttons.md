# Universal Demo Button Standardization

**Proposal:** Standardize all demo buttons across the Viral Studio and landing page to 3 consistent actions.

## The Problem

Currently, demo buttons across the platform are inconsistent:

- Some demos show 'Personalize This [Niche] Demo' (niche-specific)
- Others show different CTA text per niche
- Users see different button labels for the same core action
- The button set varies by studio tab and niche section
- Mobile vs desktop button treatments may differ

This inconsistency creates cognitive load and reduces conversion clarity.

## Proposed Standard: 3 Universal Buttons

Every demo card, everywhere in the platform, should show exactly these 3 buttons:

| # | Button Label | Action | When Visible |
|---|-------------|--------|-------------|
| 1 | **View Prompt** | Opens the full AI video generation prompt in a read-only modal | Always visible |
| 2 | **Personalize** | Opens the SmartVideo GO AI personalization flow (upload image/brand asset) | Always visible |
| 3 | **Create This Style** | Starts a new video generation using this template's style as a starting point | Always visible |

## Button Definitions

### 1. View Prompt

- **Label:** `View Prompt`
- **Icon:** Code bracket icon or prompt icon
- **Action:** Opens a modal/overlay showing the full text prompt used to generate the demo video
- **Content:** Full prompt text, model used, duration, aspect ratio, any reference images
- **Use case:** Users who want to understand the prompt structure, learn from it, or copy it for modification
- **Secondary action in modal:** Copy to clipboard button

### 2. Personalize

- **Label:** `Personalize`
- **Icon:** User/avatar icon or wand icon
- **Action:** Opens the SmartVideo GO AI personalization flow
- **Content:** Upload image/brand asset input, face swap option, brand customization panel
- **Use case:** Users who want to make this style their own with their own face/product/brand
- **Existing equivalent:** 'Personalize This [Niche] Demo' (consolidate to just 'Personalize')

### 3. Create This Style

- **Label:** `Create This Style`
- **Icon:** Play/create icon or sparkle icon
- **Action:** Starts new video generation pre-filled with this template's style parameters
- **Content:** Generation settings pre-populated with template's style, model, aspect ratio, duration
- **Use case:** Users who want to generate a new video in the same style with different content
- **Existing equivalent:** 'Create This Style' (already exists for some demos)

## Button Layout

### Desktop

```
[View Prompt]  [Personalize →]  [✨ Create This Style]
```

- Horizontal layout, equal height
- 'Personalize' is the primary CTA (filled style)
- 'Create This Style' has subtle visual emphasis (icon + text)
- 'View Prompt' is tertiary (outlined/ghost style)

### Mobile

```
[View Prompt]
[Personalize →]
[✨ Create This Style]
```

- Vertical stack, full-width buttons
- Same visual hierarchy as desktop

## Migration Path

### Phase 1: Update nicheDemos.ts

Replace all niche-specific button labels with the universal set:

```typescript
// BEFORE (niche-specific)
ctaButton: 'Personalize This AI Product Video Demo'
ctaButton: 'Personalize This Food Demo'
ctaButton: 'Personalize This Real Estate Demo'

// AFTER (universal)
buttons: {
  viewPrompt: 'View Prompt',
  personalize: 'Personalize',
  createStyle: 'Create This Style',
}
```

### Phase 2: Update nicheContent.ts

Remove `ctaButton` from NICHE_CONTENT (or repurpose as section-level CTA).
The button labels now come from the universal set, not from niche config.

### Phase 3: Update component

Update the demo card component to render the 3-button layout universally.
Add button visibility logic:
- All 3 buttons always visible on desktop
- All 3 buttons stacked on mobile
- Icon + label on desktop, icon + label on mobile

### Phase 4: A/B test

Test universal buttons vs. niche-specific buttons to measure:
- Personalize conversion rate
- Create This Style conversion rate
- View Prompt engagement rate
- Time to first action

## Benefits

1. **Consistency:** Users see the same 3 buttons everywhere, reducing cognitive load
2. **Clarity:** Each button has a distinct, universally understood action
3. **Scalability:** Adding new niches or templates doesn't require new button labels
4. **A/B testing:** Easier to test button variations across the entire platform
5. **Accessibility:** Screen readers announce consistent button labels
6. **Analytics:** Track 3 standard actions across all templates uniformly

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Loss of niche-specific context | Button tooltips preserve niche context |
| 'Personalize' is too generic | Tooltip: 'Personalize this [niche] demo with your brand' |
| Users don't understand 'Create This Style' | Add hover tooltip: 'Generate a new video in this style' |
| View Prompt is unused | Add copy-to-clipboard; show prompt character count |

## Open Questions

1. Should 'View Prompt' show the prompt before or after personalization?
2. Should 'Create This Style' pre-fill the prompt or just the style settings?
3. Do we need a 4th button for 'Download Video' or 'Share'?
4. Should button order change based on user segment (creator vs. business)?
5. Do 'featured' templates get any special button treatment?
