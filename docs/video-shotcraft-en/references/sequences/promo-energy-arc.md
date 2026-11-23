---
name: promo-energy-arc
一句话: Whole-video energy skeleton — low-key brand open → a single hero gets its origin story → a feature climb punctuated by breathing title cards → a launch-event peak finale
适用: The default whole-video structure for a 30–60s promo of a multi-feature web product (in the storyboard stage, fill in the skeleton first, then pick cards)
段数: 4 segment slots + 2–4 breathing title cards
---

## Intent

Merge the rhythm rules scattered across R1–R3/Q5/Q8/P4 into a single whole-video curve that can be filled in directly.
The template video's final cut (1085f) and two independent reproductions (900f each) — three tabulations — all converged on the same
skeleton. It is a default, not a mandate: each project may deliberately deviate, and deviations are written into the project spec.

## Segment table

| Segment | Share of duration | Energy | Role | Candidate recipe cards |
|------|----------|------|------|------------|
| ① Brand open | 8–12% (30s video); open + origin story together can reach 20% (template video) | Low | Wordmark stamp + hold ≥1s (R1), hands off to the product page | brand-ink-open |
| ② Single-hero origin story | 12–15% | Medium (highest polish, slowest rhythm) | One hero, one complete action arc ≥3s (Q5/R3), establishing the product's atomic unit | spotlight-hero-card (+ the Q2 high-res rasterize technique in aesthetic-rules.md) |
| ③ Feature climb | 55–65% | Medium-high ⇄ low, alternating | Each shot is bound to one unique feature, and each technique is the star only once (P4); insert breathing title cards between shots as needed | deck-deal-flyin / type-and-filter / list-stack-press / row-embed / document-typewriter-reveal |
| ④ Launch-event finale | 13–16% | Peak (highest of the whole video) | Each feature already shown sends a representative element into a group photo surrounding the wordmark (Q8), sign-off hold ≥1s (R1) | outro-group-photo-launch |

Breathing title card (paper-title-card) rules: insert one after every 1–2 feature shots, each
50–55f (≈1.8s), 2–4 in the whole video; use one as a lead-in title card before an important feature appears (C2).
In the template video, title cards take 4 of the 10 shots; in each of the two reproductions they take 2 — choose the density according to the number of feature shots.

## Fill-in procedure (replaces ad-hoc derivation)

1. List the product's features (P4) and count the number of feature shots N.
2. Allocate total frames according to the segment table: first deduct the budgets for ①②④ and the title cards, and split the remainder evenly across ③.
   Within each shot's budget, **carve out the hold/rest frames first** (R1 landing ≥30f, batch wrap-up 15f, R3),
   then lay out the motion — not lay out the motion and then look for gaps.
3. Alternate energy in segment ③: high-energy shots (card dealing/stacking) and steady-rhythm shots (interaction/reading fields)
   are interleaved, and the shot with the highest information density (document/report type) is placed right before the peak finale —
   the template video and both reproductions placed the document/report-type shot 2nd–3rd from last.
4. Scan the shots/ frontmatter slot by slot to pick cards, and read the full text of the chosen cards.
5. After the shots are arranged, choose a transition style for each seam (the three-style selection of the shot-transitions technique card),
   and write it into the "key motion" column of the storyboard table — transition frames are carved out of the adjacent shots' budgets.

## Known pitfalls

- Applying the skeleton globally as a style mandate: the segment shares are single-instance evidence from the template video (label: single-instance precedent);
  a 15s short or a single-feature product should boldly merge segments, but the two ends — the ① hold and the ④ peak — cannot be dropped.
- Stacking only high-energy shots in segment ③: consecutive high energy reads as noisy; the alternation and the title cards are the rhythm itself.
- Writing the breathing title cards as a second pass of the tagline: if a title card repeats the outro copy, delete it (P4 precedent:
  outro tagline deduplication).

## Reference implementation

The segment table in AIFL_SHOTS in template/src/aifl/Main.tsx (sum=1085f).
