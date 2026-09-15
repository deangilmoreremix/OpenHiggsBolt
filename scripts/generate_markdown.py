#!/usr/bin/env python3
"""
Generate all markdown deliverables from the saved audit data.
"""

import json
import pickle
from pathlib import Path
from datetime import datetime

BASE = Path("/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt")
DATA = BASE / "data"
DOCS = BASE / "docs"
DOCS_IDEAS = DOCS / "ideas"
DOCS.mkdir(exist_ok=True)
DOCS_IDEAS.mkdir(exist_ok=True)

with open("/tmp/audit_data.pkl", "rb") as f:
    d = pickle.load(f)

records = d["records"]
ENGLISH_RECORDS = d["ENGLISH_RECORDS"]
NON_ENGLISH_RECORDS = d["NON_ENGLISH_RECORDS"]
raw_records = d["raw_records"]
DUPLICATES_SKIPPED = d["DUPLICATES_SKIPPED"]
audit = d["audit"]
proposed_niche_registry = d["proposed_niche_registry"]
style_registry = d["style_registry"]
objective_registry = d["objective_registry"]
landing_niche_map = d["landing_niche_map"]
source_breakdown = d["source_breakdown"]
studio_tab_breakdown = d["studio_tab_breakdown"]
industry_niche_map = d["industry_niche_map"]

by_slug = {r["slug"]: r for r in records}

# ------------------------------------------------------------------ #
# Load current nicheDemos.ts assignments
# ------------------------------------------------------------------ #
import re

niche_demos_path = BASE / "src" / "data" / "nicheDemos.ts"
with open(niche_demos_path) as f:
    niche_demos_src = f.read()

# Extract current NICHE_DEMO_SLUGS
current_assignments = {}
for line in niche_demos_src.split("\n"):
    m = re.match(r"  '([^']+)': \[", line)
    if m:
        current_niche = m.group(1)
        # Find the list of slugs
        start_idx = niche_demos_src.index(line)
        bracket_start = niche_demos_src.index("[", start_idx)
        # Find matching closing bracket
        depth = 0
        for i in range(bracket_start, len(niche_demos_src)):
            if niche_demos_src[i] == "[":
                depth += 1
            elif niche_demos_src[i] == "]":
                depth -= 1
                if depth == 0:
                    bracket_end = i
                    break
        slug_list_str = niche_demos_src[bracket_start + 1 : bracket_end]
        slugs = re.findall(r"'([^']+)'", slug_list_str)
        current_assignments[current_niche] = slugs

print(f"Current assignments loaded: {len(current_assignments)} niches")
print(f"Total current demo assignments: {sum(len(v) for v in current_assignments.values())}")

# ------------------------------------------------------------------ #
# DOC 1: full-template-library-audit.md
# ------------------------------------------------------------------ #

def generate_full_audit():
    md = []
    md.append("# Full Template Library Audit Report")
    md.append("")
    md.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    md.append(f"**Source:** `data/canonical-template-audit.json`")
    md.append("")

    # Overview
    md.append("## 1. Executive Summary")
    md.append("")
    md.append(f"| Metric | Count |")
    md.append(f"|--------|-------|")
    md.append(f"| Total source records (raw) | {len(raw_records):,} |")
    md.append(f"| Duplicate records skipped | {DUPLICATES_SKIPPED:,} |")
    md.append(f"| **Total unique templates** | **{len(records):,}** |")
    md.append(f"| English templates | {len(ENGLISH_RECORDS):,} |")
    md.append(f"| Non-English templates | {len(NON_ENGLISH_RECORDS):,} |")
    md.append(f"| Featured templates | {sum(1 for r in records if r.get('featured')):,} |")
    md.append(f"| Landing page niches | 14 |")
    md.append("")
    md.append("> **Note:** 80 duplicate records were found in seedance_2prompt (same slug listed twice). "
               f"These were deduplicated, reducing the count from {len(raw_records):,} to {len(records):,} unique templates.")
    md.append("")

    # Language breakdown
    md.append("## 2. Language Breakdown")
    md.append("")
    md.append("| Language | Count | % |")
    md.append("|----------|-------|---|")
    en_count = len(ENGLISH_RECORDS)
    ne_count = len(NON_ENGLISH_RECORDS)
    total = len(records)
    md.append(f"| ENGLISH | {en_count:,} | {en_count/total*100:.1f}% |")
    md.append(f"| NON_ENGLISH | {ne_count:,} | {ne_count/total*100:.1f}% |")
    md.append(f"| **Total** | **{total:,}** | **100%** |")
    md.append("")
    md.append("### Non-English Templates (excluded from default library)")
    md.append("")
    md.append("| ID | Slug | Title | Source | Language |")
    md.append("|----|------|-------|--------|----------|")
    for r in NON_ENGLISH_RECORDS:
        md.append(f"| {r['id']} | `{r['slug']}` | {r['title']} | {r['sourceRepo']} | {r.get('language', 'NON_ENGLISH')} |")
    md.append("")
    md.append("> These 4 templates should be preserved in source inventory but excluded from the default English library. "
               "They can be offered in a localized section if needed.")
    md.append("")

    # Per-source breakdown
    md.append("## 3. Per-Source Breakdown")
    md.append("")
    md.append("| Source | Total | English | Non-English | Featured | Primary Categories | Studio Tabs |")
    md.append("|--------|-------|---------|-------------|----------|-------------------|-------------|")
    for src in ["minimax_h3", "seedance_25", "seedance_1", "promptfeed", "seedance_2prompt"]:
        if src not in source_breakdown:
            continue
        bd = source_breakdown[src]
        cats = ", ".join(f"{c}({n})" for c, n in bd["categories"].most_common(3))
        tabs = ", ".join(f"{t}({n})" for t, n in bd["studioTabs"].most_common(2))
        md.append(f"| {src} | {bd['total']} | {bd['english']} | {bd['nonEnglish']} | {bd['featured']} | {cats} | {tabs} |")
    md.append("")

    # Studio tab breakdown
    md.append("## 4. Per-Studio-Tab Breakdown")
    md.append("")
    md.append("| Studio Tab | Total | English | Categories |")
    md.append("|-----------|-------|---------|------------|")
    for tab in ["cinema", "video", "marketing", "ai-influencer", "vfx-studio"]:
        if tab not in studio_tab_breakdown:
            continue
        bd = studio_tab_breakdown[tab]
        cats = ", ".join(f"{c}({n})" for c, n in bd["categories"].most_common(3))
        md.append(f"| {tab} | {bd['total']} | {bd['english']} | {cats} |")
    md.append("")

    # Category breakdown
    md.append("## 5. Category Breakdown")
    md.append("")
    md.append("| Category | Count | % of English |")
    md.append("|----------|-------|-------------|")
    cat_counts = {}
    for r in ENGLISH_RECORDS:
        cat = r.get("category", "Unknown")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        md.append(f"| {cat} | {cnt:,} | {cnt/len(ENGLISH_RECORDS)*100:.1f}% |")
    md.append("")

    # Landing page niche audit
    md.append("## 6. Landing Page Niche Audit Results")
    md.append("")
    md.append("This section audits each landing page niche against the canonical inventory.")
    md.append("")

    # Current vs proposed comparison
    md.append("### 6.1 Current vs. Proposed Assignments")
    md.append("")
    md.append("| Niche | Current Count | Proposed Count | Correct | Incorrect | Missing | Notes |")
    md.append("|-------|--------------|----------------|---------|-----------|---------|-------|")

    landing_niche_ids = [
        "ecommerce", "restaurants-food", "real-estate", "beauty", "wellness-fitness",
        "education", "technology", "finance", "entertainment-media", "automotive",
        "travel-hospitality", "sports-outdoors", "general-business", "viral-trending"
    ]

    for niche_id in landing_niche_ids:
        current = current_assignments.get(niche_id, [])
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        proposed = proposed_data.get("templateSlugs", [])
        current_set = set(current)
        proposed_set = set(proposed)
        correct = len(current_set & proposed_set)
        incorrect = len(current_set - proposed_set)
        missing = len(proposed_set - current_set)

        # Notes based on count
        notes = ""
        if len(proposed) < 6:
            notes = f"⚠️ Only {len(proposed)} genuine matches found in inventory"
        elif incorrect > len(current) * 0.3:
            notes = f"⚠️ {incorrect} current assignments may be incorrect"
        else:
            notes = "✓ Good coverage"

        md.append(f"| {niche_id} | {len(current)} | {len(proposed)} | {correct} | {incorrect} | {missing} | {notes} |")
    md.append("")

    # Recommended replacements per niche
    md.append("### 6.2 Recommended Replacements for Incorrect Matches")
    md.append("")
    md.append("For each niche with incorrect current assignments, templates to remove and add:")
    md.append("")

    for niche_id in landing_niche_ids:
        current = current_assignments.get(niche_id, [])
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        proposed = proposed_data.get("templateSlugs", [])
        current_set = set(current)
        proposed_set = set(proposed)

        incorrect = current_set - proposed_set
        missing = proposed_set - current_set

        if incorrect or missing:
            md.append(f"#### {niche_id}")
            md.append("")
            if incorrect:
                md.append(f"**Remove (incorrect matches):** {len(incorrect)} templates")
                for slug in sorted(list(incorrect))[:10]:
                    r = by_slug.get(slug)
                    title = r["title"] if r else slug
                    md.append(f"- `{slug}` — *{title}*")
                if len(incorrect) > 10:
                    md.append(f"- ... and {len(incorrect) - 10} more")
            if missing:
                md.append(f"**Add (better matches):** {len(missing)} templates")
                for slug in sorted(list(missing))[:10]:
                    r = by_slug.get(slug)
                    title = r["title"] if r else slug
                    score = next((t["score"] for t in proposed_data.get("proposedTemplates", []) if t["slug"] == slug), "?")
                    md.append(f"- `{slug}` (score {score}) — *{title}*")
                if len(missing) > 10:
                    md.append(f"- ... and {len(missing) - 10} more")
            md.append("")

    # Final proposed template IDs per niche
    md.append("### 6.3 Final Proposed Template IDs per Niche")
    md.append("")
    md.append("Curated list of template IDs for each landing page niche, ordered by relevance score.")
    md.append("")

    for niche_id in landing_niche_ids:
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        templates = proposed_data.get("proposedTemplates", [])
        if not templates:
            continue
        md.append(f"#### {niche_id} ({len(templates)} templates)")
        md.append("")
        md.append("| # | Slug | Title | Score | Category | Source |")
        md.append("|---|------|-------|-------|----------|--------|")
        for i, t in enumerate(templates, 1):
            md.append(f"| {i} | `{t['slug']}` | {t['title'][:50]} | {t['score']} | {t['category']} | {t['sourceRepo']} |")
        md.append("")

    return "\n".join(md)

with open(DOCS / "full-template-library-audit.md", "w") as f:
    f.write(generate_full_audit())
print("✓ docs/full-template-library-audit.md")

# ------------------------------------------------------------------ #
# DOC 2: landing-niche-video-audit.md
# ------------------------------------------------------------------ #

def generate_landing_niche_audit():
    md = []
    md.append("# Landing Niche Video Audit")
    md.append("")
    md.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    md.append(f"**Purpose:** Audit current landing page video assignments against canonical inventory, propose corrections.")
    md.append("")

    landing_niche_ids = [
        "ecommerce", "restaurants-food", "real-estate", "beauty", "wellness-fitness",
        "education", "technology", "finance", "entertainment-media", "automotive",
        "travel-hospitality", "sports-outdoors", "general-business", "viral-trending"
    ]

    md.append("## Current Videos Per Niche")
    md.append("")
    md.append("| Niche | Current | Proposed | Correct | Incorrect | Quality |")
    md.append("|-------|---------|----------|---------|-----------|---------|")

    total_current = 0
    total_correct = 0
    total_incorrect = 0

    niche_quality = {}
    for niche_id in landing_niche_ids:
        current = current_assignments.get(niche_id, [])
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        proposed = proposed_data.get("templateSlugs", [])
        current_set = set(current)
        proposed_set = set(proposed)
        correct = current_set & proposed_set
        incorrect = current_set - proposed_set
        missing = proposed_set - current_set

        total_current += len(current)
        total_correct += len(correct)
        total_incorrect += len(incorrect)

        # Quality assessment
        if len(proposed) >= 8:
            quality = "✓ Strong"
        elif len(proposed) >= 5:
            quality = "~ Moderate"
        elif len(proposed) >= 3:
            quality = "⚠️ Limited"
        else:
            quality = "❌ Very thin"

        niche_quality[niche_id] = quality

        correct_pct = len(correct) / len(current) * 100 if current else 0
        md.append(f"| {niche_id} | {len(current)} | {len(proposed)} | {len(correct)} ({correct_pct:.0f}%) | {len(incorrect)} | {quality} |")

    md.append("")
    md.append(f"**Totals:** {total_current} current assignments, {total_correct} correct ({total_correct/total_current*100:.0f}%), {total_incorrect} potentially incorrect")
    md.append("")

    # Per-niche breakdown
    md.append("## Per-Niche Breakdown")
    md.append("")

    for niche_id in landing_niche_ids:
        current = current_assignments.get(niche_id, [])
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        proposed = proposed_data.get("templateSlugs", [])
        proposed_templates = proposed_data.get("proposedTemplates", [])
        current_set = set(current)
        proposed_set = set(proposed)
        correct = current_set & proposed_set
        incorrect = current_set - proposed_set
        missing = proposed_set - current_set

        md.append(f"### {niche_id}")
        md.append("")
        md.append(f"**Quality:** {niche_quality[niche_id]}  ")
        md.append(f"**Current:** {len(current)} demos  ")
        md.append(f"**Proposed:** {len(proposed)} templates  ")
        md.append("")

        # Correct matches
        if correct:
            md.append("#### Correctly Matched Templates (keep)")
            md.append("")
            md.append("| Slug | Title | Source |")
            md.append("|------|-------|--------|")
            for slug in sorted(correct)[:10]:
                r = by_slug.get(slug)
                title = r["title"] if r else slug
                src = r["sourceRepo"] if r else "?"
                md.append(f"| `{slug}` | {title[:50]} | {src} |")
            if len(correct) > 10:
                md.append(f"| ... | *and {len(correct) - 10} more* | |")
            md.append("")

        # Incorrect matches
        if incorrect:
            md.append("#### Incorrectly Matched Templates (remove or relocate)")
            md.append("")
            md.append("| Slug | Title | Reason | Suggested Niche |")
            md.append("|------|-------|--------|----------------|")
            for slug in sorted(incorrect)[:10]:
                r = by_slug.get(slug)
                title = r["title"] if r else slug
                cat = r["category"] if r else "?"
                # Suggest better niche
                best_niche = "general-business"
                best_score = 0
                for nid in landing_niche_ids:
                    nd = landing_niche_map["niches"].get(nid, {})
                    for t in nd.get("proposedTemplates", []):
                        if t["slug"] == slug and t["score"] > best_score:
                            best_score = t["score"]
                            best_niche = nid
                reason = f"Category: {cat}" if cat != "?" else "Low relevance score"
                if best_score > 0:
                    reason += f" (better fit: {best_niche}, score {best_score})"
                md.append(f"| `{slug}` | {title[:45]} | {reason} | {best_niche} |")
            if len(incorrect) > 10:
                md.append(f"| ... | *and {len(incorrect) - 10} more* | | |")
            md.append("")

        # Missing (recommended additions)
        if missing:
            md.append("#### Recommended Additions")
            md.append("")
            md.append("| Slug | Title | Score | Source |")
            md.append("|------|-------|-------|--------|")
            for slug in sorted(missing)[:10]:
                r = by_slug.get(slug)
                title = r["title"] if r else slug
                score = next((t["score"] for t in proposed_templates if t["slug"] == slug), "?")
                src = r["sourceRepo"] if r else "?"
                md.append(f"| `{slug}` | {title[:45]} | {score} | {src} |")
            if len(missing) > 10:
                md.append(f"| ... | *and {len(missing) - 10} more* | | |")
            md.append("")

    # Final ordered list
    md.append("## Final Proposed Ordered Template IDs Per Niche")
    md.append("")
    md.append("Ordered by relevance score (highest first). Templates should be used in this order on the landing page.")
    md.append("")

    for niche_id in landing_niche_ids:
        proposed_data = landing_niche_map["niches"].get(niche_id, {})
        templates = proposed_data.get("proposedTemplates", [])
        if not templates:
            continue
        md.append(f"### {niche_id} — Final Ordered List")
        md.append("")
        md.append("```")
        for i, t in enumerate(templates, 1):
            md.append(f"{i:2d}. {t['slug']}  ({t['score']}pts, {t['sourceRepo']})")
        md.append("```")
        md.append("")

    return "\n".join(md)

with open(DOCS / "landing-niche-video-audit.md", "w") as f:
    f.write(generate_landing_niche_audit())
print("✓ docs/landing-niche-video-audit.md")

# ------------------------------------------------------------------ #
# DOC 3: viral-studio-library-plan.md
# ------------------------------------------------------------------ #

def generate_viral_studio_plan():
    md = []
    md.append("# Viral Studio Library Plan")
    md.append("")
    md.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    md.append(f"**Purpose:** Strategic plan for the Viral Studio massive template library expansion.")
    md.append("")

    # Template counts
    md.append("## Template Count Summary")
    md.append("")
    md.append("| Dimension | Count |")
    md.append("|-----------|-------|")

    # Per industry
    md.append("")
    md.append("### Per Industry")
    md.append("")
    md.append("| Industry | Total Templates | Niches | Featured Niches |")
    md.append("|----------|----------------|--------|----------------|")
    total_industry = 0
    for industry, data in proposed_niche_registry["industries"].items():
        niche_count = len(data["niches"])
        featured_count = sum(1 for v in data["niches"].values() if v["visibility"] == "featured")
        md.append(f"| {industry} | {data['totalTemplates']} | {niche_count} | {featured_count} |")
        total_industry += data["totalTemplates"]
    md.append(f"| **Total** | **{total_industry}** | | |")
    md.append("")

    # Per niche
    md.append("### Per Niche (Top 20)")
    md.append("")
    md.append("| Niche | Industry | Templates | Visibility |")
    md.append("|-------|----------|-----------|------------|")
    all_niches = []
    for industry, data in proposed_niche_registry["industries"].items():
        for niche, ndata in data["niches"].items():
            all_niches.append((niche, industry, ndata["templateCount"], ndata["visibility"]))
    for niche, industry, count, vis in sorted(all_niches, key=lambda x: -x[2])[:20]:
        md.append(f"| {niche} | {industry} | {count} | {vis} |")
    md.append("")

    # Per style
    md.append("### Per Style (Top 15)")
    md.append("")
    md.append("| Style | Template Count |")
    md.append("|-------|---------------|")
    for style, data in sorted(style_registry["styles"].items(), key=lambda x: -x[1]["templateCount"])[:15]:
        if data["templateCount"] > 0:
            md.append(f"| {style} | {data['templateCount']} |")
    md.append("")

    # Per objective
    md.append("### Per Business Objective (Top 10)")
    md.append("")
    md.append("| Objective | Template Count |")
    md.append("|-----------|---------------|")
    for obj, data in sorted(objective_registry["objectives"].items(), key=lambda x: -x[1]["templateCount"])[:10]:
        if data["templateCount"] > 0:
            md.append(f"| {obj} | {data['templateCount']} |")
    md.append("")

    # Navigation hierarchy proposal
    md.append("## Navigation Hierarchy Proposal")
    md.append("")
    md.append("### Viral Studio Structure")
    md.append("")
    md.append("The Viral Studio should be the massive template library, separate from the curated landing page demos.")
    md.append("")
    md.append("```")
    md.append("Viral Studio")
    md.append("├── Browse by Industry")
    md.append("│   ├── Food & Beverage (190 templates)")
    md.append("│   │   ├── Restaurants & Cafes [featured]")
    md.append("│   │   ├── Coffee Shops [browse]")
    md.append("│   │   ├── Bakeries [browse]")
    md.append("│   │   ├── Food Brands [searchable]")
    md.append("│   │   └── Beverage Brands [searchable]")
    md.append("│   ├── Ecommerce & Products (185 templates)")
    md.append("│   │   ├── Skincare & Beauty Products [featured]")
    md.append("│   │   ├── Fashion & Apparel [featured]")
    md.append("│   │   ├── Jewelry & Watches [featured]")
    md.append("│   │   ├── Perfume & Fragrance [browse]")
    md.append("│   │   ├── Consumer Electronics [searchable]")
    md.append("│   │   └── Home & Lifestyle Products [searchable]")
    md.append("│   ├── Real Estate (81 templates)")
    md.append("│   │   ├── Residential Listings [featured]")
    md.append("│   │   ├── Luxury Properties [featured]")
    md.append("│   │   └── Property Tours [searchable]")
    md.append("│   ├── Beauty & Fashion (354 templates)")
    md.append("│   │   ├── Makeup & Cosmetics [featured]")
    md.append("│   │   ├── Hair & Styling [featured]")
    md.append("│   │   ├── GRWM & Vlogs [featured]")
    md.append("│   │   ├── Skincare Routines [browse]")
    md.append("│   │   ├── Fashion Editorial [browse]")
    md.append("│   │   └── Influencer Content [browse]")
    md.append("│   ├── Fitness & Wellness (67 templates)")
    md.append("│   │   ├── Gym & Training [featured]")
    md.append("│   │   ├── Yoga & Mindfulness [browse]")
    md.append("│   │   └── Sports Performance [browse]")
    md.append("│   ├── Education & Training (18 templates)")
    md.append("│   │   ├── Documentary [featured]")
    md.append("│   │   ├── STEM & Science [browse]")
    md.append("│   │   └── Tutorials & How-To [searchable]")
    md.append("│   ├── Technology (472 templates)")
    md.append("│   │   ├── SaaS & Software [featured]")
    md.append("│   │   ├── AI & Machine Learning [featured]")
    md.append("│   │   ├── Cyberpunk & Sci-Fi [featured]")
    md.append("│   │   ├── Consumer Tech [browse]")
    md.append("│   │   └── Gaming [browse]")
    md.append("│   ├── Finance & Professional Services (23 templates)")
    md.append("│   │   ├── Business & Corporate [featured]")
    md.append("│   │   └── Financial Services [searchable]")
    md.append("│   ├── Entertainment & Media (620 templates)")
    md.append("│   │   ├── Short Films [featured]")
    md.append("│   │   ├── Animation & Anime [featured]")
    md.append("│   │   ├── Viral & Social Content [featured]")
    md.append("│   │   ├── Character & Story [featured]")
    md.append("│   │   └── Music Videos [browse]")
    md.append("│   ├── Automotive (159 templates)")
    md.append("│   │   ├── Racing & Motorsport [featured]")
    md.append("│   │   ├── EV & Future Tech [featured]")
    md.append("│   │   ├── Luxury & Supercars [browse]")
    md.append("│   │   └── Motorcycles [browse]")
    md.append("│   ├── Travel & Hospitality (20 templates)")
    md.append("│   │   ├── Destinations & Tourism [browse]")
    md.append("│   │   ├── Adventure & Outdoor [browse]")
    md.append("│   │   └── Hotels & Resorts [searchable]")
    md.append("│   ├── Sports & Outdoors (47 templates)")
    md.append("│   │   ├── Team Sports [featured]")
    md.append("│   │   ├── Combat Sports [browse]")
    md.append("│   │   ├── Action & Extreme [browse]")
    md.append("│   │   ├── Olympics & Competition [browse]")
    md.append("│   │   └── Outdoor Adventure [searchable]")
    md.append("│   ├── Professional Services (9 templates)")
    md.append("│   │   └── [various niches]")
    md.append("│   ├── Home Services (0 templates)")
    md.append("│   ├── General Business (139 templates)")
    md.append("│   │   └── Brand Promotions [featured]")
    md.append("│   └── Viral & Trending (80 templates)")
    md.append("│       ├── POV & Trending [featured]")
    md.append("│       ├── Comedy & Skits [browse]")
    md.append("│       ├── Transformation [browse]")
    md.append("│       └── Meme & Challenge [searchable]")
    md.append("├── Browse by Style")
    md.append("│   ├── UGC Ad")
    md.append("│   ├── Product Demo / Product Commercial")
    md.append("│   ├── Cinematic Commercial")
    md.append("│   ├── Social Ad")
    md.append("│   ├── POV / Vlog")
    md.append("│   ├── Talking Presenter / Spokesperson")
    md.append("│   ├── Before & After / Transformation")
    md.append("│   ├── Food Close-Up / Restaurant Promo")
    md.append("│   ├── Beauty Routine / Fashion Editorial")
    md.append("│   ├── Property Showcase / Vehicle Showcase")
    md.append("│   ├── Tutorial / Explainer")
    md.append("│   ├── Storytelling / Brand Film / Short Film")
    md.append("│   ├── VFX / Character Video")
    md.append("│   ├── Trend / Meme / Comedy")
    md.append("│   ├── Action Sequence / Gameplay")
    md.append("│   ├── Documentary / Music Video")
    md.append("│   ├── Anime & Animation")
    md.append("│   └── [30+ additional styles]")
    md.append("├── Browse by Business Objective")
    md.append("│   ├── Promote Product")
    md.append("│   ├── Promote Service")
    md.append("│   ├── Generate Leads")
    md.append("│   ├── Launch Product")
    md.append("│   ├── Announce Offer / Limited-Time Promotion")
    md.append("│   ├── Build Brand Awareness")
    md.append("│   ├── Introduce Business / Founder")
    md.append("│   ├── Show Product Features")
    md.append("│   ├── Show Before & After")
    md.append("│   ├── Promote Menu Item / Property / Vehicle / Event")
    md.append("│   ├── Educate Customer")
    md.append("│   ├── Create Paid Ad / Organic Social Content")
    md.append("│   ├── Show Testimonial")
    md.append("│   └── [10+ additional objectives]")
    md.append("└── Search")
    md.append("    └── Full-text search across all 2,457 templates")
    md.append("```")
    md.append("")

    # Key metrics
    md.append("## Key Metrics")
    md.append("")
    md.append("| Metric | Value |")
    md.append("|--------|-------|")
    md.append(f"| Total unique English templates | {len(ENGLISH_RECORDS):,} |")
    md.append(f"| Total industries | 14 |")
    md.append(f"| Total niches | {sum(len(data['niches']) for data in proposed_niche_registry['industries'].values())} |")
    md.append(f"| Featured niches (8+ templates) | {sum(1 for data in proposed_niche_registry['industries'].values() for v in data['niches'].values() if v['visibility'] == 'featured')} |")
    md.append(f"| Dedicated-browse niches (3-7 templates) | {sum(1 for data in proposed_niche_registry['industries'].values() for v in data['niches'].values() if v['visibility'] == 'dedicated-browse')} |")
    md.append(f"| Searchable niches (1-2 templates) | {sum(1 for data in proposed_niche_registry['industries'].values() for v in data['niches'].values() if v['visibility'] == 'searchable')} |")
    md.append(f"| Video styles defined | {len(style_registry['styles'])} |")
    md.append(f"| Business objectives defined | {len(objective_registry['objectives'])} |")
    md.append(f"| Non-English templates (excluded) | {len(NON_ENGLISH_RECORDS)} |")
    md.append("")

    # Implementation notes
    md.append("## Implementation Notes")
    md.append("")
    md.append("1. **Landing Page vs Viral Studio:** The landing page remains curated with 14 niche sections. "
               "Each section shows 6-12 of the best-matching templates. The Viral Studio is the massive library "
               "with all 2,457 templates accessible via industry/niche/style/objective browsing.")
    md.append("")
    md.append("2. **Visibility Rules:** Niches with 8+ templates get a dedicated browse section. "
               "Niches with 3-7 templates are searchable. Niches with 1-2 templates are hidden from browse but searchable.")
    md.append("")
    md.append("3. **Non-English Templates:** 4 templates (all from minimax_h3) are non-English and excluded from "
               "the default English library. They should be preserved in source inventory for potential localized sections.")
    md.append("")
    md.append("4. **Duplicate Handling:** 80 seedance_2prompt records had duplicate slugs. These were deduplicated "
               "keeping the first occurrence. The canonical audit shows 2,541 raw records; the working set is 2,461 unique.")
    md.append("")
    md.append("5. **Style Classification:** Templates can belong to multiple styles (up to 8 per template). "
               "The most common styles are Cinematic Story (1,438), Action Sequence (376), and Anime & Animation (308).")
    md.append("")
    md.append("6. **Objective Classification:** Templates can belong to multiple objectives. "
               "Build Brand Awareness (2,299) and Promote Product (1,592) are the most common objectives.")
    md.append("")
    md.append("7. **Gap Analysis:** Some landing page niches have limited inventory (real-estate: 1, finance: 4, "
               "general-business: 4, wellness-fitness: 5). Consider adding more targeted templates in these areas.")
    md.append("")

    return "\n".join(md)

with open(DOCS / "viral-studio-library-plan.md", "w") as f:
    f.write(generate_viral_studio_plan())
print("✓ docs/viral-studio-library-plan.md")

# ------------------------------------------------------------------ #
# DOC 4: universal-demo-buttons.md
# ------------------------------------------------------------------ #

def generate_demo_buttons():
    md = []
    md.append("# Universal Demo Button Standardization")
    md.append("")
    md.append("**Proposal:** Standardize all demo buttons across the Viral Studio and landing page to 3 consistent actions.")
    md.append("")
    md.append("## The Problem")
    md.append("")
    md.append("Currently, demo buttons across the platform are inconsistent:")
    md.append("")
    md.append("- Some demos show 'Personalize This [Niche] Demo' (niche-specific)")
    md.append("- Others show different CTA text per niche")
    md.append("- Users see different button labels for the same core action")
    md.append("- The button set varies by studio tab and niche section")
    md.append("- Mobile vs desktop button treatments may differ")
    md.append("")
    md.append("This inconsistency creates cognitive load and reduces conversion clarity.")
    md.append("")
    md.append("## Proposed Standard: 3 Universal Buttons")
    md.append("")
    md.append("Every demo card, everywhere in the platform, should show exactly these 3 buttons:")
    md.append("")
    md.append("| # | Button Label | Action | When Visible |")
    md.append("|---|-------------|--------|-------------|")
    md.append("| 1 | **View Prompt** | Opens the full AI video generation prompt in a read-only modal | Always visible |")
    md.append("| 2 | **Personalize** | Opens the SmartVideo GO AI personalization flow (upload image/brand asset) | Always visible |")
    md.append("| 3 | **Create This Style** | Starts a new video generation using this template's style as a starting point | Always visible |")
    md.append("")
    md.append("## Button Definitions")
    md.append("")
    md.append("### 1. View Prompt")
    md.append("")
    md.append("- **Label:** `View Prompt`")
    md.append("- **Icon:** Code bracket icon or prompt icon")
    md.append("- **Action:** Opens a modal/overlay showing the full text prompt used to generate the demo video")
    md.append("- **Content:** Full prompt text, model used, duration, aspect ratio, any reference images")
    md.append("- **Use case:** Users who want to understand the prompt structure, learn from it, or copy it for modification")
    md.append("- **Secondary action in modal:** Copy to clipboard button")
    md.append("")
    md.append("### 2. Personalize")
    md.append("")
    md.append("- **Label:** `Personalize`")
    md.append("- **Icon:** User/avatar icon or wand icon")
    md.append("- **Action:** Opens the SmartVideo GO AI personalization flow")
    md.append("- **Content:** Upload image/brand asset input, face swap option, brand customization panel")
    md.append("- **Use case:** Users who want to make this style their own with their own face/product/brand")
    md.append("- **Existing equivalent:** 'Personalize This [Niche] Demo' (consolidate to just 'Personalize')")
    md.append("")
    md.append("### 3. Create This Style")
    md.append("")
    md.append("- **Label:** `Create This Style`")
    md.append("- **Icon:** Play/create icon or sparkle icon")
    md.append("- **Action:** Starts new video generation pre-filled with this template's style parameters")
    md.append("- **Content:** Generation settings pre-populated with template's style, model, aspect ratio, duration")
    md.append("- **Use case:** Users who want to generate a new video in the same style with different content")
    md.append("- **Existing equivalent:** 'Create This Style' (already exists for some demos)")
    md.append("")
    md.append("## Button Layout")
    md.append("")
    md.append("### Desktop")
    md.append("")
    md.append("```")
    md.append("[View Prompt]  [Personalize →]  [✨ Create This Style]")
    md.append("```")
    md.append("")
    md.append("- Horizontal layout, equal height")
    md.append("- 'Personalize' is the primary CTA (filled style)")
    md.append("- 'Create This Style' has subtle visual emphasis (icon + text)")
    md.append("- 'View Prompt' is tertiary (outlined/ghost style)")
    md.append("")
    md.append("### Mobile")
    md.append("")
    md.append("```")
    md.append("[View Prompt]")
    md.append("[Personalize →]")
    md.append("[✨ Create This Style]")
    md.append("```")
    md.append("")
    md.append("- Vertical stack, full-width buttons")
    md.append("- Same visual hierarchy as desktop")
    md.append("")
    md.append("## Migration Path")
    md.append("")
    md.append("### Phase 1: Update nicheDemos.ts")
    md.append("")
    md.append("Replace all niche-specific button labels with the universal set:")
    md.append("")
    md.append("```typescript")
    md.append("// BEFORE (niche-specific)")
    md.append("ctaButton: 'Personalize This AI Product Video Demo'")
    md.append("ctaButton: 'Personalize This Food Demo'")
    md.append("ctaButton: 'Personalize This Real Estate Demo'")
    md.append("")
    md.append("// AFTER (universal)")
    md.append("buttons: {")
    md.append("  viewPrompt: 'View Prompt',")
    md.append("  personalize: 'Personalize',")
    md.append("  createStyle: 'Create This Style',")
    md.append("}")
    md.append("```")
    md.append("")
    md.append("### Phase 2: Update nicheContent.ts")
    md.append("")
    md.append("Remove `ctaButton` from NICHE_CONTENT (or repurpose as section-level CTA).")
    md.append("The button labels now come from the universal set, not from niche config.")
    md.append("")
    md.append("### Phase 3: Update component")
    md.append("")
    md.append("Update the demo card component to render the 3-button layout universally.")
    md.append("Add button visibility logic:")
    md.append("- All 3 buttons always visible on desktop")
    md.append("- All 3 buttons stacked on mobile")
    md.append("- Icon + label on desktop, icon + label on mobile")
    md.append("")
    md.append("### Phase 4: A/B test")
    md.append("")
    md.append("Test universal buttons vs. niche-specific buttons to measure:")
    md.append("- Personalize conversion rate")
    md.append("- Create This Style conversion rate")
    md.append("- View Prompt engagement rate")
    md.append("- Time to first action")
    md.append("")
    md.append("## Benefits")
    md.append("")
    md.append("1. **Consistency:** Users see the same 3 buttons everywhere, reducing cognitive load")
    md.append("2. **Clarity:** Each button has a distinct, universally understood action")
    md.append("3. **Scalability:** Adding new niches or templates doesn't require new button labels")
    md.append("4. **A/B testing:** Easier to test button variations across the entire platform")
    md.append("5. **Accessibility:** Screen readers announce consistent button labels")
    md.append("6. **Analytics:** Track 3 standard actions across all templates uniformly")
    md.append("")
    md.append("## Risks & Mitigations")
    md.append("")
    md.append("| Risk | Mitigation |")
    md.append("|------|------------|")
    md.append("| Loss of niche-specific context | Button tooltips preserve niche context |")
    md.append("| 'Personalize' is too generic | Tooltip: 'Personalize this [niche] demo with your brand' |")
    md.append("| Users don't understand 'Create This Style' | Add hover tooltip: 'Generate a new video in this style' |")
    md.append("| View Prompt is unused | Add copy-to-clipboard; show prompt character count |")
    md.append("")
    md.append("## Open Questions")
    md.append("")
    md.append("1. Should 'View Prompt' show the prompt before or after personalization?")
    md.append("2. Should 'Create This Style' pre-fill the prompt or just the style settings?")
    md.append("3. Do we need a 4th button for 'Download Video' or 'Share'?")
    md.append("4. Should button order change based on user segment (creator vs. business)?")
    md.append("5. Do 'featured' templates get any special button treatment?")
    md.append("")

    return "\n".join(md)

with open(DOCS_IDEAS / "universal-demo-buttons.md", "w") as f:
    f.write(generate_demo_buttons())
print("✓ docs/ideas/universal-demo-buttons.md")

print()
print("=== ALL DELIVERABLES GENERATED ===")
print("JSON files:")
print("  ✓ data/proposed-niche-registry.json")
print("  ✓ data/proposed-viral-style-registry.json")
print("  ✓ data/proposed-business-objective-registry.json")
print("  ✓ data/proposed-landing-niche-map.json")
print("Markdown files:")
print("  ✓ docs/full-template-library-audit.md")
print("  ✓ docs/landing-niche-video-audit.md")
print("  ✓ docs/viral-studio-library-plan.md")
print("  ✓ docs/ideas/universal-demo-buttons.md")
