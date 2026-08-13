# Character Consistency Checklist

> **SmartVideo GO AI Academy** — A reusable template from the SmartVideo GO AI course library. Fill it in, then launch it from the matching SmartVideo GO AI studio or Create-With-AI recipe.



From [Module 2: Character & Face Consistency](../02-character-consistency.md). Before delivering a batch, compare all generated shots of the same character against these.

## Filled example

Using the real anchor portrait from Module 2's Worked Example (woman, late 20s, brown hair, freckles), fed as a reference into `nano-banana-2-edit` for 3 actual generations — [car interior](../02-character-consistency.md), kitchen counter, walking outside:

| Check | Car interior | Kitchen counter | Walking outside |
|---|---|---|---|
| Facial structure matches anchor | ✅ | ✅ | ✅ |
| Apparent age consistent | ✅ | ✅ | ✅ |
| Freckles present | ✅ | ✅ | ✅ |
| Skin tone/lighting shift | Matches anchor | Matches anchor | Different (outdoor) lighting, identity still holds |
| Outfit continuity (if same scene) | n/a — different shots | n/a | n/a |

**Verdict:** no drift across any of the 3, including the outdoor shot with very different lighting from the anchor. This is what reference-image conditioning done right looks like — the reference image was passed to an *edit*-capable model (not a fresh text-only prompt), and the prompt described only the setting, never the face. If you see drift in your own attempts, check those two things first before assuming the model just can't hold identity.

## Blank checklist

- [ ] Facial structure matches across shots (face shape, eye spacing, nose)
- [ ] Apparent age is consistent
- [ ] Any distinguishing features (freckles, scars, specific hairstyle) appear in every shot
- [ ] Skin tone/lighting doesn't shift the apparent identity
- [ ] If outfit should stay the same across a scene, check continuity between cuts


---

### Use this template in SmartVideo GO AI

Open this template inside SmartVideo GO AI Academy and launch it with the matching Create-With-AI recipe — UGC Ad, UGC Campaign, Consistent Character, or AI Campaign Planner.
