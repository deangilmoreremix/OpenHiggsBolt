# Full Template Library Audit Report

**Generated:** 2026-09-11 15:03
**Source:** `data/canonical-template-audit.json`

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total source records (raw) | 2,541 |
| Duplicate records skipped | 80 |
| **Total unique templates** | **2,461** |
| English templates | 2,457 |
| Non-English templates | 4 |
| Featured templates | 17 |
| Landing page niches | 14 |

> **Note:** 80 duplicate records were found in seedance_2prompt (same slug listed twice). These were deduplicated, reducing the count from 2,541 to 2,461 unique templates.

## 2. Language Breakdown

| Language | Count | % |
|----------|-------|---|
| ENGLISH | 2,457 | 99.8% |
| NON_ENGLISH | 4 | 0.2% |
| **Total** | **2,461** | **100%** |

### Non-English Templates (excluded from default library)

| ID | Slug | Title | Source | Language |
|----|------|-------|--------|----------|
| 6 | `greenhouse-tea-isekai-anime` | Greenhouse tea isekai anime | minimax_h3 | NON_ENGLISH |
| 11 | `kintsugi-sword-seamless-loop` | Kintsugi Sword Seamless Loop | minimax_h3 | NON_ENGLISH |
| 22 | `ice-gunslinger-interactive-web-loop` | Ice Gunslinger Interactive Web Loop | minimax_h3 | NON_ENGLISH |
| 27 | `golden-guardian-web-hero-loop` | Golden Guardian Web Hero Loop | minimax_h3 | NON_ENGLISH |

> These 4 templates should be preserved in source inventory but excluded from the default English library. They can be offered in a localized section if needed.

## 3. Per-Source Breakdown

| Source | Total | English | Non-English | Featured | Primary Categories | Studio Tabs |
|--------|-------|---------|-------------|----------|-------------------|-------------|
| minimax_h3 | 30 | 26 | 4 | 15 | Commercial(7), Cinema(5), Fashion(5) | video(9), marketing(7) |
| seedance_25 | 50 | 50 | 0 | 1 | Cinema(13), Social(13), Action(10) | cinema(23), video(13) |
| seedance_1 | 14 | 14 | 0 | 1 | Animation(7), Cinema(3), Commercial(2) | ai-influencer(7), cinema(3) |
| promptfeed | 28 | 28 | 0 | 0 | Cinema(11), Animation(7), Commercial(6) | cinema(11), ai-influencer(7) |
| seedance_2prompt | 2339 | 2339 | 0 | 0 | Action(1044), Commercial(346), Animation(324) | cinema(1237), video(432) |

## 4. Per-Studio-Tab Breakdown

| Studio Tab | Total | English | Categories |
|-----------|-------|---------|------------|
| cinema | 1279 | 1279 | Action(1054), Cinema(225) |
| video | 460 | 459 | Fashion(177), Social(162), UGC(119) |
| marketing | 369 | 369 | Commercial(369) |
| ai-influencer | 349 | 346 | Animation(344), Fashion(5) |
| vfx-studio | 4 | 4 | Action(4) |

## 5. Category Breakdown

| Category | Count | % of English |
|----------|-------|-------------|
| Action | 1,058 | 43.1% |
| Commercial | 369 | 15.0% |
| Animation | 345 | 14.0% |
| Cinema | 225 | 9.2% |
| Fashion | 179 | 7.3% |
| Social | 162 | 6.6% |
| UGC | 119 | 4.8% |

## 6. Landing Page Niche Audit Results

This section audits each landing page niche against the canonical inventory.

### 6.1 Current vs. Proposed Assignments

| Niche | Current Count | Proposed Count | Correct | Incorrect | Missing | Notes |
|-------|--------------|----------------|---------|-----------|---------|-------|
| ecommerce | 30 | 12 | 6 | 24 | 6 | ⚠️ 24 current assignments may be incorrect |
| restaurants-food | 29 | 8 | 4 | 25 | 4 | ⚠️ 25 current assignments may be incorrect |
| real-estate | 10 | 1 | 1 | 9 | 0 | ⚠️ Only 1 genuine matches found in inventory |
| beauty | 30 | 9 | 3 | 27 | 6 | ⚠️ 27 current assignments may be incorrect |
| wellness-fitness | 30 | 5 | 5 | 25 | 0 | ⚠️ Only 5 genuine matches found in inventory |
| education | 30 | 6 | 4 | 26 | 2 | ⚠️ 26 current assignments may be incorrect |
| technology | 30 | 12 | 6 | 24 | 6 | ⚠️ 24 current assignments may be incorrect |
| finance | 30 | 4 | 3 | 27 | 1 | ⚠️ Only 4 genuine matches found in inventory |
| entertainment-media | 30 | 12 | 1 | 29 | 11 | ⚠️ 29 current assignments may be incorrect |
| automotive | 30 | 12 | 9 | 21 | 3 | ⚠️ 21 current assignments may be incorrect |
| travel-hospitality | 30 | 7 | 3 | 27 | 4 | ⚠️ 27 current assignments may be incorrect |
| sports-outdoors | 30 | 12 | 7 | 23 | 5 | ⚠️ 23 current assignments may be incorrect |
| general-business | 30 | 4 | 3 | 27 | 1 | ⚠️ Only 4 genuine matches found in inventory |
| viral-trending | 30 | 11 | 3 | 27 | 8 | ⚠️ 27 current assignments may be incorrect |

### 6.2 Recommended Replacements for Incorrect Matches

For each niche with incorrect current assignments, templates to remove and add:

#### ecommerce

**Remove (incorrect matches):** 24 templates
- `15-second-cinematic-luxury-perfume-commercial` — *15 second cinematic luxury perfume commercial*
- `1507-15-second-hyper-realistic-cinematic-luxury-jewelry-commercia` — *15-second hyper-realistic cinematic luxury jewelry commercial featuring an East *
- `1521-luxury-diamond-ring-commercial-storyboard` — *Luxury Diamond Ring Commercial Storyboard*
- `3304-ultra-realistic-ugc-luxury-fashion-review-of-cap-and-shoes-i` — *Ultra-realistic UGC luxury fashion review of cap and shoes in golden hour bedroo*
- `a-ugc-video-for-a-skincare-brand-the` — *a ugc video for a skincare brand the*
- `chaotic-luxury-streetwear-fashion-film` — *chaotic luxury streetwear fashion film*
- `fashion-showcase-with-dynamic-styling-effects` — *fashion showcase with dynamic styling effects*
- `high-end-fashion-commercial-vertical-ad` — *high end fashion commercial vertical ad*
- `luxury-car-brand-teaser-video-prompt` — *luxury car brand teaser video prompt*
- `luxury-fashion-bag-unboxing` — *luxury fashion bag unboxing*
- ... and 14 more
**Add (better matches):** 6 templates
- `3052-kitkat-break-focus-commercial` (score 8) — *KitKat Break Focus Commercial*
- `bamboo-forest-wuxia-mystery` (score 8) — *Bamboo Forest Wuxia Mystery*
- `morning-lip-oil-ugc-testimonial` (score 16) — *Morning Lip Oil UGC Testimonial*
- `product-commercial-study-309837` (score 8) — *Product Commercial Study 309837*
- `ramen-bowl-ugc-taste-test` (score 14) — *Ramen Bowl UGC Taste Test*
- `yellow-sunglasses-in-a-black-studio` (score 14) — *Yellow Sunglasses in a Black Studio*

#### restaurants-food

**Remove (incorrect matches):** 25 templates
- `1-2-live-action-video-perfectly-recreating-a` — *1 2 live action video perfectly recreating a*
- `3030-surreal-tokyo-dessert-animation` — *Surreal Tokyo Dessert Animation*
- `360-panoramic-selfie-inside-gourmet-bakery` — *360 panoramic selfie inside gourmet bakery*
- `abstract-instant-noodles-eating-movements-expression` — *abstract instant noodles eating movements expression*
- `animated-burger-and-pizza-slice-characters-in-a` — *animated burger and pizza slice characters in a*
- `anime-style-matcha-roll-cake-baking-process` — *anime style matcha roll cake baking process*
- `blueberry-pie-baking-storyboard` — *blueberry pie baking storyboard*
- `cat-making-pancakes-cinematic-prompt` — *cat making pancakes cinematic prompt*
- `cat-ramen-chef-asmr-video-prompt-for-seedance-2-0` — *cat ramen chef asmr video prompt for seedance 2 0*
- `chef-ant-kitchen-chase-pixar` — *chef ant kitchen chase pixar*
- ... and 15 more
**Add (better matches):** 4 templates
- `2984-the-decadent-snap-artisanal-chocolate-bar-video-prompt` (score 8) — *The Decadent Snap - Artisanal Chocolate Bar Video Prompt*
- `cinematic-luxury-pizza-commercial` (score 10) — *cinematic luxury pizza commercial*
- `claymation-miniature-chef-prompt` (score 7) — *claymation miniature chef prompt*
- `youmind-714e8ab60957` (score 7) — *youmind 714e8ab60957*

#### real-estate

**Remove (incorrect matches):** 9 templates
- `a-dim-bedroom-lit-by-a-harsh-on` — *a dim bedroom lit by a harsh on*
- `a-man-walks-out-of-his-house-towards` — *a man walks out of his house towards*
- `create-a-30-second-ultra-realistic-documentary-home-video-of-620321` — *Create a 30-second ultra-realistic documentary/home-video of the SAME young*
- `first-person-male-perspective-on-the-living-room` — *first person male perspective on the living room*
- `luxury-mansion-sunset-retreat-ad` — *luxury mansion sunset retreat ad*
- `natural-bedroom-portrait-pretty-girl-winter-style` — *natural bedroom portrait pretty girl winter style*
- `scene-description-indoor-home-environment-suspected-modern-style` — *scene description indoor home environment suspected modern style*
- `subject-guangzhou-city-portrait-including-ancient-xiguan-mansions` — *subject guangzhou city portrait including ancient xiguan mansions*
- `white-horse-gallop-mansion-gate-winter` — *white horse gallop mansion gate winter*

#### beauty

**Remove (incorrect matches):** 27 templates
- `2082-tresemm-luxury-haircare-commercial` — *Tresemmé Luxury Haircare Commercial*
- `3275-glow-up-time` — *Glow-Up Time*
- `a-chinese-mythological-boy-with-two-bun-hairstyles` — *a chinese mythological boy with two bun hairstyles*
- `a-decade-of-refinement-glow-up` — *a decade of refinement glow up*
- `baseball-stadium-glamour-shot` — *baseball stadium glamour shot*
- `beat-driven-fashion-transformation-sequence` — *beat driven fashion transformation sequence*
- `beat-synced-outfit-transformation-dance` — *beat synced outfit transformation dance*
- `beauty-influencer-morning-routine` — *beauty influencer morning routine*
- `beauty-influencer-vlog-prompt` — *beauty influencer vlog prompt*
- `character-transformation-with-bruised-face-and-armor-reference` — *character transformation with bruised face and armor reference*
- ... and 17 more
**Add (better matches):** 6 templates
- `2783-premium-photorealistic-fashion-commercial-and-behind-the-sce` (score 10) — *Premium photorealistic fashion commercial and behind-the-scenes lookbook*
- `demolition-couture-avant-garde-fashion-prompt` (score 8) — *demolition couture avant garde fashion prompt*
- `low-angle-fashion-tracking-film` (score 8) — *Low-Angle Fashion Tracking Film*
- `luxury-streetwear-runway-fashion-film` (score 8) — *luxury streetwear runway fashion film*
- `style-hollywood-haute-couture-fantasy-blockbuster-8k-ultra` (score 8) — *style hollywood haute couture fantasy blockbuster 8k ultra*
- `yellow-sunglasses-in-a-black-studio` (score 10) — *Yellow Sunglasses in a Black Studio*

#### wellness-fitness

**Remove (incorrect matches):** 25 templates
- `1980s-vhs-style-training-montage` — *1980s vhs style training montage*
- `3227-neo-seoul-overdrive-30-second-mecha-transformation` — *Neo-Seoul Overdrive: 30-Second Mecha Transformation*
- `a-30-second-cinematic-parkour-commercial-about-focus-movement-and-513060` — *A 30-second cinematic parkour commercial about focus, movement, and pushing beyond the edge.*
- `amazonian-warrior-animal-transformation` — *Amazonian Warrior Animal Transformation*
- `astronaut-transforms-on-frozen-alien-planet` — *astronaut transforms on frozen alien planet*
- `beat-synced-fitness-journey-arc` — *beat synced fitness journey arc*
- `chai-glass-to-futuristic-racing-pod-transformation` — *chai glass to futuristic racing pod transformation*
- `cinematic-wellness-yoga-flow-video` — *cinematic wellness yoga flow video*
- `clouds-transforming-into-ice-cream-on-plane-window` — *clouds transforming into ice cream on plane window*
- `comedic-character-transformation-into-bear-animation` — *comedic character transformation into bear animation*
- ... and 15 more

#### education

**Remove (incorrect matches):** 26 templates
- `another-experiment-with-a-30-second-cinematic-in-256736` — *Animation Study 256736*
- `cinematic-romance-atmosphere-in-a-beautiful-study-room` — *cinematic romance atmosphere in a beautiful study room*
- `cinematic-story-study-501840` — *Cinematic Story Study 501840*
- `classroom-gathering-and-group-photo` — *classroom gathering and group photo*
- `comedic-adhd-cat-teacher-short-film` — *comedic adhd cat teacher short film*
- `cross-era-dance-history-evolution` — *cross era dance history evolution*
- `elite-combat-forces-training-cinematic` — *elite combat forces training cinematic*
- `hyperrealism-pseudo-documentary-suspense-comedy-short` — *hyperrealism pseudo documentary suspense comedy short*
- `hyperrealistic-physics-inertia-momentum-effect` — *hyperrealistic physics inertia momentum effect*
- `iceberg-research-base-collapse-cinematic` — *iceberg research base collapse cinematic*
- ... and 16 more
**Add (better matches):** 2 templates
- `macaw-scream-in-extreme-slow-motion` (score 11) — *Macaw Scream in Extreme Slow Motion*
- `youmind-82a7c5b1914c` (score 11) — *youmind 82a7c5b1914c*

#### technology

**Remove (incorrect matches):** 24 templates
- `a-futuristic-promotional-video-for-kiri-engine-a` — *a futuristic promotional video for kiri engine a*
- `cgi-cyberpunk-assassin-city-fight` — *cgi cyberpunk assassin city fight*
- `cyberpunk-car-drift-time-freeze` — *cyberpunk car drift time freeze*
- `cyberpunk-city-rainy-night-video-prompt` — *cyberpunk city rainy night video prompt*
- `cyberpunk-f1-cinematic-sequence` — *cyberpunk f1 cinematic sequence*
- `cyberpunk-futuristic-female-agent-action-scene` — *cyberpunk futuristic female agent action scene*
- `cyberpunk-game-character-rotation-video` — *cyberpunk game character rotation video*
- `cyberpunk-influencer-live-stream-studio` — *cyberpunk influencer live stream studio*
- `cyberpunk-magical-girl-anime-video-prompt` — *cyberpunk magical girl anime video prompt*
- `cyberpunk-memory-hunter-hacker-neon-digital-space` — *cyberpunk memory hunter hacker neon digital space*
- ... and 14 more
**Add (better matches):** 6 templates
- `cybernetic-titan-cyberpunk-city-rain` (score 9) — *cybernetic titan cyberpunk city rain*
- `cyberpunk-anime-cinematic-fight-scene-prompt-for-seedance-2-0` (score 9) — *cyberpunk anime cinematic fight scene prompt for seedance 2 0*
- `cyberpunk-samurai-duel` (score 10) — *cyberpunk samurai duel*
- `cyberpunk-samurai-tokyo-neon-battle` (score 10) — *cyberpunk samurai tokyo neon battle*
- `hollywood-style-shanghai-city-montage-video-prompt-for-seedance-2-0` (score 10) — *hollywood style shanghai city montage video prompt for seedance 2 0*
- `seedance-2-0-ai-wedding-video-prompt-cinematic-night-scene` (score 10) — *seedance 2 0 ai wedding video prompt cinematic night scene*

#### finance

**Remove (incorrect matches):** 27 templates
- `90s-hong-kong-stock-exchange-drama-scene` — *90s hong kong stock exchange drama scene*
- `akshay-kumar-as-neo-in-matrix-corporate-hallway` — *akshay kumar as neo in matrix corporate hallway*
- `anime-style-bitcoin-power-up-federal-reserve-destruction` — *anime style bitcoin power up federal reserve destruction*
- `anthropomorphic-romantic-story-elite-executive` — *anthropomorphic romantic story elite executive*
- `bullet-time-falling-businessman` — *bullet time falling businessman*
- `business-bar-whisper-snack-gift-reveal` — *business bar whisper snack gift reveal*
- `day-in-the-life-of-a-salaryman-but` — *day in the life of a salaryman but*
- `epic-chinese-ceo-emotional-drama-reveal` — *epic chinese ceo emotional drama reveal*
- `epic-faceoff-michael-jackson-vs-hitler` — *epic faceoff michael jackson vs hitler*
- `genai-video-model-market-analysis-slide` — *genai video model market analysis slide*
- ... and 17 more
**Add (better matches):** 1 templates
- `high-speed-transition-video-prompt-for-seedance-2-0-omni` (score 5) — *high speed transition video prompt for seedance 2 0 omni*

#### entertainment-media

**Remove (incorrect matches):** 29 templates
- `2904-30-second-ultra-realistic-cinematic-horror-comedy-ad-for-phi` — *30-second ultra-realistic cinematic horror-comedy ad for Philosophy Fresh Cream *
- `a-15-second-cinematic-cg-short-film-the` — *a 15 second cinematic cg short film the*
- `cinematic-2d-anime-scene-prompt` — *cinematic 2d anime scene prompt*
- `cinematic-anime-scene-stormy-seaside-promenade` — *cinematic anime scene stormy seaside promenade*
- `cinematic-dark-fantasy-animation-prompt` — *cinematic dark fantasy animation prompt*
- `cinematic-evolution-of-the-qipao-short-film` — *cinematic evolution of the qipao short film*
- `cinematic-fantasy-action-scene` — *cinematic fantasy action scene*
- `cinematic-fantasy-battle-trailer-eldrath-vs-vespera` — *cinematic fantasy battle trailer eldrath vs vespera*
- `cinematic-fantasy-overgrown-ruins-animation` — *cinematic fantasy overgrown ruins animation*
- `cinematic-manga-romance-confession-on-an-overpass` — *cinematic manga romance confession on an overpass*
- ... and 19 more
**Add (better matches):** 11 templates
- `1-male-a-male-peacock-spirit-long-bob` (score 11) — *1 male a male peacock spirit long bob*
- `2291-pixar-style-30-second-3d-animated-short-of-a-beggar-and-a-cr` (score 13) — *Pixar-style 30-second 3D animated short of a beggar and a crow*
- `3d-fantasy-animation-prompt` (score 13) — *3d fantasy animation prompt*
- `blue-haired-hero-and-spirit-fox-escape` (score 11) — *Blue-Haired Hero and Spirit Fox Escape*
- `cinematic-schoolgirl-action-short` (score 10) — *cinematic schoolgirl action short*
- `cinematic-time-freeze-sports-bar-prompt` (score 10) — *cinematic time freeze sports bar prompt*
- `cinematic-time-freeze-thriller` (score 10) — *cinematic time freeze thriller*
- `male-peacock-spirit-anime-character-design` (score 11) — *male peacock spirit anime character design*
- `male-peacock-spirit-anime-style-video` (score 11) — *male peacock spirit anime style video*
- `napoleon-historical-biopic-animation` (score 14) — *napoleon historical biopic animation*
- ... and 1 more

#### automotive

**Remove (incorrect matches):** 21 templates
- `action-movie-car-chase-realism` — *action movie car chase realism*
- `cinematic-bullet-train-speed-racing-through-countryside` — *cinematic bullet train speed racing through countryside*
- `cinematic-night-rainy-racing-veteran-driver` — *cinematic night rainy racing veteran driver*
- `faceless-riders-highway-chase` — *Faceless Riders Highway Chase*
- `futuristic-creature-high-speed-race-multi-angles` — *futuristic creature high speed race multi angles*
- `futuristic-hypercar-racing-sports-broadcast` — *futuristic hypercar racing sports broadcast*
- `high-speed-car-chase-gear-shift-video` — *high speed car chase gear shift video*
- `high-speed-motorcycle-action` — *high speed motorcycle action*
- `high-speed-motorcycle-chase-city-action` — *high speed motorcycle chase city action*
- `motorcycle-night-ride-neon-city` — *motorcycle night ride neon city*
- ... and 11 more
**Add (better matches):** 3 templates
- `alpine-avalanche-escape-stunt-storyboard` (score 6) — *alpine avalanche escape stunt storyboard*
- `luxury-electric-suv-commercial` (score 8) — *luxury electric suv commercial*
- `unveiling-pure-luxury-the-ultimate-red-ferrari-e-698838` (score 8) — *Unveiling Pure Luxury: The Ultimate Red Ferrari Experience*

#### travel-hospitality

**Remove (incorrect matches):** 27 templates
- `15-shot-cinematic-travel-sequence` — *15 shot cinematic travel sequence*
- `3155-young-traveler-hikes-through-lush-mountain-forest-to-hidden-` — *Young traveler hikes through lush mountain forest to hidden waterfall*
- `a-cinematic-adventure-scene-set-in-a-hidden` — *a cinematic adventure scene set in a hidden*
- `a-rugged-mountain-traveller-crosses-a-snow-covered` — *a rugged mountain traveller crosses a snow covered*
- `action-chase-blonde-woman-lion-tropical-jungle` — *action chase blonde woman lion tropical jungle*
- `adventure-energy-columbus-looks-at-his-phone-s` — *adventure energy columbus looks at his phone s*
- `burj-khalifa-sunset-to-night-tour` — *burj khalifa sunset to night tour*
- `comic-strip-to-video-journey-to-west` — *comic strip to video journey to west*
- `epic-temple-adventure-sequence` — *epic temple adventure sequence*
- `fantasy-anime-forest-adventure-sequence` — *fantasy anime forest adventure sequence*
- ... and 17 more
**Add (better matches):** 4 templates
- `2781-30-second-photorealistic-smartphone-travel-vlog-of-a-japanes` (score 6) — *30-second photorealistic smartphone travel vlog of a Japanese woman at a summer *
- `boyfriend-pov-travel-vlog-prompt-for-seedance-2-0` (score 6) — *boyfriend pov travel vlog prompt for seedance 2 0*
- `handheld-phone-selfie-slight-camera-shake-authentic-travel` (score 6) — *handheld phone selfie slight camera shake authentic travel*
- `seedance-2-0-travel-vlog-prompt-venice` (score 6) — *seedance 2 0 travel vlog prompt venice*

#### sports-outdoors

**Remove (incorrect matches):** 23 templates
- `3d-animation-kung-fu-soccer-cinematic-sequence` — *3d animation kung fu soccer cinematic sequence*
- `aew-wrestling-championship-cinematic-video` — *aew wrestling championship cinematic video*
- `chinese-motivational-success-seminar-video` — *brutal womens kickboxing fight video*
- `cinematic-wingsuit-flight-snowy-mountain-dawn` — *cinematic wingsuit flight snowy mountain dawn*
- `early-2000s-europe-snowy-rally-race-scene` — *early 2000s europe snowy rally race scene*
- `figure-1-vs-figure-2-martial-arts-tournament` — *Figure 1 vs Figure 2 Martial Arts Tournament*
- `football-stadium-broadcast-fan-portrait` — *football stadium broadcast fan portrait*
- `football-stadium-fan-reaction-broadcast` — *football stadium fan reaction broadcast*
- `martial-arts-tournament-figure-1-vs-2` — *martial arts tournament figure 1 vs 2*
- `mountain-biker-action-sequence` — *mountain biker action sequence*
- ... and 13 more
**Add (better matches):** 5 templates
- `hyper-realistic-football-strike-sequence` (score 6) — *hyper realistic football strike sequence*
- `hyperrealistic-rugby-match-humans-vs-gorillas` (score 9) — *hyperrealistic rugby match humans vs gorillas*
- `live-football-broadcast-video-prompt` (score 8) — *live football broadcast video prompt*
- `manchester-united-fan-video` (score 8) — *manchester united fan video*
- `pro-soccer-goal-action-sequence` (score 10) — *pro soccer goal action sequence*

#### general-business

**Remove (incorrect matches):** 27 templates
- `a-steampunk-robot-becomes-a-michelin-three-star` — *a steampunk robot becomes a michelin three star*
- `arknights-endfield-gugu-gaga-shopping-scene` — *arknights endfield gugu gaga shopping scene*
- `barbershop-haircut-cinematic-storyboard` — *barbershop haircut cinematic storyboard*
- `cinematic-grocery-shopping-sequence` — *cinematic grocery shopping sequence*
- `cinematic-rainy-city-sidewalk-meeting` — *cinematic rainy city sidewalk meeting*
- `classic-1920s-harlem-barbershop-scene-with-color-popping-barber-pole` — *classic 1920s harlem barbershop scene with color popping barber pole*
- `cozy-rainy-coffee-shop` — *cozy rainy coffee shop*
- `earth-zoom-futuristic-robotics-workshop` — *earth zoom futuristic robotics workshop*
- `eastern-wuxia-bamboo-forest-swordsmen` — *eastern wuxia bamboo forest swordsmen*
- `i-am-a-product-manager-who-doesn-t` — *i am a product manager who doesn t*
- ... and 17 more
**Add (better matches):** 1 templates
- `a-futuristic-promotional-video-for-kiri-engine-a` (score 8) — *a futuristic promotional video for kiri engine a*

#### viral-trending

**Remove (incorrect matches):** 27 templates
- `1523-handheld-16mm-gym-vlog-pov-of-chase-in-an-evening-gym` — *Handheld 16mm gym vlog POV of CHASE in an evening gym*
- `cinematic-arena-duel-showdown` — *cinematic arena duel showdown*
- `cinematic-gaming-short-with-seamless-transitions` — *cinematic gaming short with seamless transitions*
- `cinematic-mermaid-to-dragonfly-transformation` — *cinematic mermaid to dragonfly transformation*
- `cinematic-schoolgirl-action-short` — *cinematic schoolgirl action short*
- `continuous-shot-magical-bird-transformation-flying` — *continuous shot magical bird transformation flying*
- `desert-to-oasis-timelapse-transformation` — *desert to oasis timelapse transformation*
- `fantasy-map-reality-transformation` — *fantasy map reality transformation*
- `first-person-pov-hangzhou-dining-prank` — *first person pov hangzhou dining prank*
- `first-person-rollercoaster-one-shot-transition` — *first person rollercoaster one shot transition*
- ... and 17 more
**Add (better matches):** 8 templates
- `2690-cinematic-korean-convenience-store-snack-challenge-vlog` (score 8) — *Cinematic Korean Convenience Store Snack Challenge Vlog*
- `continuous-shot-downhill-longboard-run` (score 6) — *continuous shot downhill longboard run*
- `dust-devil-playground-viral-video` (score 6) — *dust devil playground viral video*
- `giant-koi-park-incident` (score 6) — *Giant koi park incident*
- `giant-orange-cat-meme-style` (score 6) — *Giant Orange Cat Meme Style*
- `melodramatic-rainy-night-heartbreak-scene` (score 6) — *melodramatic rainy night heartbreak scene*
- `melodramatic-rainy-night-neon-short-drama` (score 6) — *melodramatic rainy night neon short drama*
- `rucker-park-slam-dunk-viral-video` (score 6) — *rucker park slam dunk viral video*

### 6.3 Final Proposed Template IDs per Niche

Curated list of template IDs for each landing page niche, ordered by relevance score.

#### ecommerce (12 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `morning-lip-oil-ugc-testimonial` | Morning Lip Oil UGC Testimonial | 16 | UGC | minimax_h3 |
| 2 | `2477-30-second-vertical-ai-ugc-product-commercial-for-premium-cof` | 30-second vertical AI UGC product commercial for p | 14 | UGC | promptfeed |
| 3 | `blackberry-vanilla-soda-ugc-vlog` | Blackberry Vanilla Soda UGC Vlog | 14 | UGC | minimax_h3 |
| 4 | `emerald-bio-serum-product-film` | Emerald Bio-Serum Product Film | 14 | Commercial | minimax_h3 |
| 5 | `ramen-bowl-ugc-taste-test` | Ramen Bowl UGC Taste Test | 14 | UGC | minimax_h3 |
| 6 | `yellow-sunglasses-in-a-black-studio` | Yellow Sunglasses in a Black Studio | 14 | Commercial | minimax_h3 |
| 7 | `black-and-gold-perfume-commercial` | Black-and-Gold Perfume Commercial | 10 | Commercial | minimax_h3 |
| 8 | `luxury-skincare-storyboard-commercial` | Luxury Skincare Storyboard Commercial | 10 | Commercial | minimax_h3 |
| 9 | `luxury-perfume-commercial` | Luxury perfume commercial | 10 | Commercial | minimax_h3 |
| 10 | `bamboo-forest-wuxia-mystery` | Bamboo Forest Wuxia Mystery | 8 | Commercial | minimax_h3 |
| 11 | `3052-kitkat-break-focus-commercial` | KitKat Break Focus Commercial | 8 | Commercial | promptfeed |
| 12 | `product-commercial-study-309837` | Product Commercial Study 309837 | 8 | Commercial | seedance_25 |

#### restaurants-food (8 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `cinematic-luxury-pizza-commercial` | cinematic luxury pizza commercial | 10 | Commercial | seedance_2prompt |
| 2 | `fast-food-restaurant-cinematic` | fast food restaurant cinematic | 10 | Commercial | seedance_2prompt |
| 3 | `chef-spicy-food-prank-pov` | chef spicy food prank pov | 9 | Action | seedance_2prompt |
| 4 | `3310-handheld-selfie-vlog-eating-oden-in-hotel-room` | Handheld selfie vlog eating oden in hotel room | 8 | Commercial | promptfeed |
| 5 | `2984-the-decadent-snap-artisanal-chocolate-bar-video-prompt` | The Decadent Snap - Artisanal Chocolate Bar Video  | 8 | Commercial | promptfeed |
| 6 | `serious-chef-cat-cooking-video` | serious chef cat cooking video | 8 | UGC | seedance_2prompt |
| 7 | `claymation-miniature-chef-prompt` | claymation miniature chef prompt | 7 | Action | seedance_2prompt |
| 8 | `youmind-714e8ab60957` | youmind 714e8ab60957 | 7 | Commercial | seedance_2prompt |

#### real-estate (1 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `rider-galloping-white-horse-vancouver-mansion` | rider galloping white horse vancouver mansion | 5 | Commercial | seedance_2prompt |

#### beauty (9 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `cinematic-grwm-fashion-editorial` | cinematic grwm fashion editorial | 12 | Fashion | seedance_2prompt |
| 2 | `high-fashion-editorial-glow-up` | high fashion editorial glow up | 12 | Fashion | seedance_2prompt |
| 3 | `1530-cinematic-vertical-beauty-vlog-for-skincare-product` | Cinematic vertical beauty vlog for skincare produc | 10 | Cinema | promptfeed |
| 4 | `2783-premium-photorealistic-fashion-commercial-and-behind-the-sce` | Premium photorealistic fashion commercial and behi | 10 | Cinema | promptfeed |
| 5 | `yellow-sunglasses-in-a-black-studio` | Yellow Sunglasses in a Black Studio | 10 | Commercial | minimax_h3 |
| 6 | `low-angle-fashion-tracking-film` | Low-Angle Fashion Tracking Film | 8 | Fashion | minimax_h3 |
| 7 | `demolition-couture-avant-garde-fashion-prompt` | demolition couture avant garde fashion prompt | 8 | Fashion | seedance_2prompt |
| 8 | `luxury-streetwear-runway-fashion-film` | luxury streetwear runway fashion film | 8 | Animation | seedance_2prompt |
| 9 | `style-hollywood-haute-couture-fantasy-blockbuster-8k-ultra` | style hollywood haute couture fantasy blockbuster  | 8 | Fashion | seedance_2prompt |

#### wellness-fitness (5 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `fitness-aesthetic-gym-montage` | fitness aesthetic gym montage | 11 | Commercial | seedance_2prompt |
| 2 | `industrial-gym-fitness-montage` | industrial gym fitness montage | 11 | Commercial | seedance_2prompt |
| 3 | `boxing-training-montage` | boxing training montage | 9 | Commercial | seedance_2prompt |
| 4 | `female-boxing-training-montage` | female boxing training montage | 9 | Cinema | seedance_2prompt |
| 5 | `fitness-athlete-calisthenics-cinematic` | fitness athlete calisthenics cinematic | 6 | Commercial | seedance_2prompt |

#### education (6 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `macaw-scream-in-extreme-slow-motion` | Macaw Scream in Extreme Slow Motion | 11 | Cinema | minimax_h3 |
| 2 | `ultra-realistic-wildlife-documentary-footage` | ultra realistic wildlife documentary footage | 11 | UGC | seedance_2prompt |
| 3 | `wildlife-documentary-lion-elephant-rescue` | wildlife documentary lion elephant rescue | 11 | UGC | seedance_2prompt |
| 4 | `wildlife-documentary-wolf-deer-chase` | wildlife documentary wolf deer chase | 11 | UGC | seedance_2prompt |
| 5 | `youmind-82a7c5b1914c` | youmind 82a7c5b1914c | 11 | UGC | seedance_2prompt |
| 6 | `nature-documentary-otter-piloting-airplane` | nature documentary otter piloting airplane | 7 | UGC | seedance_2prompt |

#### technology (12 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `robotic-dinosaur-cyberpunk-city-attack` | robotic dinosaur cyberpunk city attack | 15 | Action | seedance_2prompt |
| 2 | `cyberpunk-digital-ruins-ai-captivity-visualization` | cyberpunk digital ruins ai captivity visualization | 13 | Animation | seedance_2prompt |
| 3 | `cyber-ronin-nanotech-transformation-video` | cyber ronin nanotech transformation video | 12 | Action | seedance_2prompt |
| 4 | `cyberpunk-futuristic-female-warrior` | cyberpunk futuristic female warrior | 12 | Action | seedance_2prompt |
| 5 | `cyberpunk-futuristic-portrait-young-woman` | cyberpunk futuristic portrait young woman | 12 | Fashion | seedance_2prompt |
| 6 | `cyberpunk-monitor-screen-breach-pov` | cyberpunk monitor screen breach pov | 11 | Fashion | seedance_2prompt |
| 7 | `cyberpunk-samurai-duel` | cyberpunk samurai duel | 10 | Action | seedance_2prompt |
| 8 | `cyberpunk-samurai-tokyo-neon-battle` | cyberpunk samurai tokyo neon battle | 10 | Action | seedance_2prompt |
| 9 | `hollywood-style-shanghai-city-montage-video-prompt-for-seedance-2-0` | hollywood style shanghai city montage video prompt | 10 | Animation | seedance_2prompt |
| 10 | `seedance-2-0-ai-wedding-video-prompt-cinematic-night-scene` | seedance 2 0 ai wedding video prompt cinematic nig | 10 | Animation | seedance_2prompt |
| 11 | `cybernetic-titan-cyberpunk-city-rain` | cybernetic titan cyberpunk city rain | 9 | Animation | seedance_2prompt |
| 12 | `cyberpunk-anime-cinematic-fight-scene-prompt-for-seedance-2-0` | cyberpunk anime cinematic fight scene prompt for s | 9 | Action | seedance_2prompt |

#### finance (4 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `a-15-second-inspirational-business-speech-short-video` | a 15 second inspirational business speech short vi | 7 | Social | seedance_2prompt |
| 2 | `professional-woman-workspace-success-scene` | professional woman workspace success scene | 6 | Animation | seedance_2prompt |
| 3 | `cinematic-office-scene-video-prompt` | cinematic office scene video prompt | 5 | Social | seedance_2prompt |
| 4 | `high-speed-transition-video-prompt-for-seedance-2-0-omni` | high speed transition video prompt for seedance 2  | 5 | Action | seedance_2prompt |

#### entertainment-media (12 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `napoleon-historical-biopic-animation` | napoleon historical biopic animation | 14 | Animation | seedance_2prompt |
| 2 | `3d-fantasy-animation-prompt` | 3d fantasy animation prompt | 13 | Animation | seedance_2prompt |
| 3 | `2291-pixar-style-30-second-3d-animated-short-of-a-beggar-and-a-cr` | Pixar-style 30-second 3D animated short of a begga | 13 | Animation | promptfeed |
| 4 | `1-male-a-male-peacock-spirit-long-bob` | 1 male a male peacock spirit long bob | 11 | Animation | seedance_2prompt |
| 5 | `blue-haired-hero-and-spirit-fox-escape` | Blue-Haired Hero and Spirit Fox Escape | 11 | Cinema | minimax_h3 |
| 6 | `male-peacock-spirit-anime-character-design` | male peacock spirit anime character design | 11 | Animation | seedance_2prompt |
| 7 | `male-peacock-spirit-anime-style-video` | male peacock spirit anime style video | 11 | Fashion | seedance_2prompt |
| 8 | `studio-ghibli-style-animation-scene` | studio ghibli style animation scene | 11 | Animation | seedance_2prompt |
| 9 | `anime-game-cinematic-animation` | anime game cinematic animation | 10 | Animation | seedance_2prompt |
| 10 | `cinematic-schoolgirl-action-short` | cinematic schoolgirl action short | 10 | Action | seedance_2prompt |
| 11 | `cinematic-time-freeze-sports-bar-prompt` | cinematic time freeze sports bar prompt | 10 | Social | seedance_2prompt |
| 12 | `cinematic-time-freeze-thriller` | cinematic time freeze thriller | 10 | Action | seedance_2prompt |

#### automotive (12 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `seedance-2-0-supercar-showcase-video-prompt` | seedance 2 0 supercar showcase video prompt | 10 | Commercial | seedance_2prompt |
| 2 | `unveiling-pure-luxury-the-ultimate-red-ferrari-e-698838` | Unveiling Pure Luxury: The Ultimate Red Ferrari Ex | 8 | Cinema | seedance_25 |
| 3 | `commercial-sports-car-photography-video-prompt` | commercial sports car photography video prompt | 8 | Commercial | seedance_2prompt |
| 4 | `high-octane-f1-car-chase-drift-explosion` | high octane f1 car chase drift explosion | 8 | Action | seedance_2prompt |
| 5 | `luxury-car-commercial-transition` | luxury car commercial transition | 8 | Commercial | seedance_2prompt |
| 6 | `luxury-electric-suv-commercial` | luxury electric suv commercial | 8 | Commercial | seedance_2prompt |
| 7 | `alpine-avalanche-escape-stunt-storyboard` | alpine avalanche escape stunt storyboard | 6 | Action | seedance_2prompt |
| 8 | `cadillac-formula-one-racing-car-2026-video` | cadillac formula one racing car 2026 video | 6 | Commercial | seedance_2prompt |
| 9 | `cinematic-sports-car-dark-void` | cinematic sports car dark void | 6 | Commercial | seedance_2prompt |
| 10 | `formula-race-warzone-sequence` | formula race warzone sequence | 6 | Action | seedance_2prompt |
| 11 | `multi-shot-high-speed-car-chase` | multi shot high speed car chase | 6 | Commercial | seedance_2prompt |
| 12 | `post-apocalyptic-war-car-racing-desert` | post apocalyptic war car racing desert | 6 | Action | seedance_2prompt |

#### travel-hospitality (7 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `2781-30-second-photorealistic-smartphone-travel-vlog-of-a-japanes` | 30-second photorealistic smartphone travel vlog of | 6 | Social | promptfeed |
| 2 | `boyfriend-pov-travel-vlog-prompt-for-seedance-2-0` | boyfriend pov travel vlog prompt for seedance 2 0 | 6 | UGC | seedance_2prompt |
| 3 | `cinematic-tokyo-travel-film-intro` | cinematic tokyo travel film intro | 6 | Commercial | seedance_2prompt |
| 4 | `handheld-phone-selfie-slight-camera-shake-authentic-travel` | handheld phone selfie slight camera shake authenti | 6 | Social | seedance_2prompt |
| 5 | `high-energy-paris-travel-vlog` | high energy paris travel vlog | 6 | Social | seedance_2prompt |
| 6 | `rome-travel-vlog-japanese-dialogue` | rome travel vlog japanese dialogue | 6 | Social | seedance_2prompt |
| 7 | `seedance-2-0-travel-vlog-prompt-venice` | seedance 2 0 travel vlog prompt venice | 6 | Social | seedance_2prompt |

#### sports-outdoors (12 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `olympic-hammer-throw-broadcast-simulation` | olympic hammer throw broadcast simulation | 14 | Commercial | seedance_2prompt |
| 2 | `glamorous-woman-soccer-stadium` | glamorous woman soccer stadium | 12 | Social | seedance_2prompt |
| 3 | `pro-soccer-goal-action-sequence` | pro soccer goal action sequence | 10 | Action | seedance_2prompt |
| 4 | `hyperrealistic-rugby-match-humans-vs-gorillas` | hyperrealistic rugby match humans vs gorillas | 9 | Action | seedance_2prompt |
| 5 | `cinematic-wwe-wrestling-match-with-shocking-twist` | cinematic wwe wrestling match with shocking twist | 8 | Commercial | seedance_2prompt |
| 6 | `live-football-broadcast-video-prompt` | live football broadcast video prompt | 8 | Social | seedance_2prompt |
| 7 | `manchester-united-fan-video` | manchester united fan video | 8 | Social | seedance_2prompt |
| 8 | `photorealistic-sports-broadcast-stadium` | photorealistic sports broadcast stadium | 8 | Commercial | seedance_2prompt |
| 9 | `cinematic-soccer-stadium-intimate-whisper-scene` | cinematic soccer stadium intimate whisper scene | 6 | Commercial | seedance_2prompt |
| 10 | `hyper-realistic-football-strike-sequence` | hyper realistic football strike sequence | 6 | Commercial | seedance_2prompt |
| 11 | `maltese-dog-winter-olympics-highlights` | maltese dog winter olympics highlights | 6 | Social | seedance_2prompt |
| 12 | `njpw-womens-wrestling-match-sequence` | njpw womens wrestling match sequence | 6 | UGC | seedance_2prompt |

#### general-business (4 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `muji-brand-promotional-video` | MUJI Brand Promotional Video | 16 | Commercial | seedance_1 |
| 2 | `a-futuristic-promotional-video-for-kiri-engine-a` | a futuristic promotional video for kiri engine a | 8 | Animation | seedance_2prompt |
| 3 | `iphone-promotional-video-prompt-seedance-2-0` | iphone promotional video prompt seedance 2 0 | 8 | Commercial | seedance_2prompt |
| 4 | `new-chinese-style-cinematic-quality-promotional-video-the` | new chinese style cinematic quality promotional vi | 8 | Commercial | seedance_2prompt |

#### viral-trending (11 templates)

| # | Slug | Title | Score | Category | Source |
|---|------|-------|-------|----------|--------|
| 1 | `2690-cinematic-korean-convenience-store-snack-challenge-vlog` | Cinematic Korean Convenience Store Snack Challenge | 8 | Cinema | promptfeed |
| 2 | `giant-orange-cat-meme-style` | Giant Orange Cat Meme Style | 6 | Social | seedance_1 |
| 3 | `giant-koi-park-incident` | Giant koi park incident | 6 | Social | minimax_h3 |
| 4 | `boyfriend-pov-travel-vlog-prompt-for-seedance-2-0` | boyfriend pov travel vlog prompt for seedance 2 0 | 6 | UGC | seedance_2prompt |
| 5 | `continuous-shot-downhill-longboard-run` | continuous shot downhill longboard run | 6 | Action | seedance_2prompt |
| 6 | `contrast-transformation-video-prompt-office-worker-to-gothic-queen` | contrast transformation video prompt office worker | 6 | UGC | seedance_2prompt |
| 7 | `downhill-pov-cycling-chaos-prompt` | downhill pov cycling chaos prompt | 6 | Action | seedance_2prompt |
| 8 | `dust-devil-playground-viral-video` | dust devil playground viral video | 6 | Action | seedance_2prompt |
| 9 | `melodramatic-rainy-night-heartbreak-scene` | melodramatic rainy night heartbreak scene | 6 | Fashion | seedance_2prompt |
| 10 | `melodramatic-rainy-night-neon-short-drama` | melodramatic rainy night neon short drama | 6 | Fashion | seedance_2prompt |
| 11 | `rucker-park-slam-dunk-viral-video` | rucker park slam dunk viral video | 6 | Commercial | seedance_2prompt |
