"""
Process raw seedance2prompt data into VideoDemo TypeScript format.
Reads: /tmp/seedance2prompt_raw.json
Writes: src/data/seedance2PromptDemos.ts
"""
import json
import re
import hashlib

RAW_FILE = "/tmp/seedance2prompt_raw.json"
OUTPUT_FILE = "src/data/seedance2PromptDemos.ts"

def generate_placeholder_svg(title):
    """Generate a simple SVG placeholder data URI with title initials."""
    initials = ''.join([c for c in title if c.isalnum()])[:2].upper() or '??'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect fill="#1e293b" width="640" height="360"/><text fill="#94a3b8" font-family="system-ui" font-size="24" font-weight="bold" text-anchor="middle" x="320" y="190">{initials}</text></svg>'
    import urllib.parse
    return f"data:image/svg+xml,{urllib.parse.quote(svg)}"

# Category inference based on prompt content keywords
CATEGORY_KEYWORDS = {
    "Action": [
        "fight", "chase", "flee", "battle", "combat", "escape", "parkour", "run", "jump",
        "crash", "explosion", "warrior", "sword", "spear", "weapon", "punch", "kick",
        "hunt", "attack", "defend", " martial", "action", "stunt", "pursuit", "gun",
        "fire", "shoot", "war", "military", "soldier", "ninja", "samurai", "dragon",
        "monster", "zombie", "apocalypse", "survival", "thriller", "horror", "intense",
        "dynamic", "fast-paced", "high-speed", "adventure", "quest", "journey"
    ],
    "Animation": [
        "cartoon", "animated", "3d", "illustration", "anime", "comic", "pixar",
        "disney", "fantasy", "magic", "dragon", "elf", "orc", "mythical", "creature",
        "toy", "lego", "animated", "stop motion", "claymation", "surreal", "dream",
        "abstract", "stylized", "whimsical", "storybook", "fairy", "princess", "robot",
        "space", "galaxy", "alien", "future", "sci-fi", "cyberpunk"
    ],
    "Commercial": [
        "product", "commercial", "ad", "brand", "marketing", "perfume", "bag",
        "bottle", "car", "vehicle", "supercar", "sneaker", "shoe", "watch", "jewelry",
        "cosmetics", "makeup", "food", "drink", "restaurant", "cafe", "store",
        "display", "showcase", "hero shot", "beauty", "luxury", "premium", "elegant",
        "advert", "promotion", "sponsor", "energy drink", "beverage"
    ],
    "Fashion": [
        "model", "fashion", "outfit", "dress", "runway", "supermodel", "style",
        "clothing", "garment", "textile", "fabric", "couture", "designer", "collection",
        "photoshoot", "portrait", "beauty", "makeup", "hair", "elegant", "glamour"
    ],
    "Social": [
        "concert", "music", "vlog", "social", "dance", "idol", "performance",
        "stage", "party", "celebration", "festival", "crowd", "fan", "audience",
        "live", "event", "gathering", "influencer", "content creator", "stream",
        "tiktok", "instagram", "youtube", "reel", "short"
    ],
    "UGC": [
        "ugc", "user generated", "homemade", "personal", "daily", "lifestyle",
        "home", "kitchen", "recipe", "cooking", "family", "friend", "casual",
        "authentic", "realistic", "natural", "documentary", "vlog", "tutorial",
        "review", "unboxing"
    ],
}

STUDIO_TAB_MAP = {
    "Action": "cinema",
    "Animation": "ai-influencer",
    "Cinema": "cinema",
    "Commercial": "marketing",
    "Fashion": "video",
    "Social": "video",
    "UGC": "video",
}

def infer_category(title, prompt):
    text = f"{title} {prompt}".lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        scores[cat] = score
    
    max_score = max(scores.values())
    if max_score == 0:
        return "Cinema"
    
    # Get all categories with max score
    best = [cat for cat, score in scores.items() if score == max_score]
    # Priority order for ties
    priority = ["Action", "Animation", "Commercial", "Fashion", "Social", "UGC", "Cinema"]
    for p in priority:
        if p in best:
            return p
    return best[0]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:80]

def generate_use_case(title, prompt):
    text = f"{title} {prompt}".lower()
    has_image = "image" in text or "@image" in text or "reference image" in text
    has_video = "video" in text or "@video" in text or "motion reference" in text
    
    if has_image and has_video:
        return "Text prompt, Image & video reference"
    elif has_image:
        return "Text prompt, Image reference"
    elif has_video:
        return "Text prompt, Video reference"
    return "Text prompt"

def generate_tags(title, prompt, category):
    text = f"{title} {prompt}".lower()
    tags = [category.lower()]
    
    # Add specific tags based on content
    tag_keywords = {
        "cinematic": "cinematic",
        "photorealistic": "photorealistic",
        "realistic": "realistic",
        "4k": "4k",
        "8k": "8k",
        "slow motion": "slow-motion",
        "time-lapse": "timelapse",
        "drone": "drone",
        "aerial": "aerial",
        "macro": "macro",
        "close-up": "closeup",
        "wide shot": "wide",
        "first-person": "pov",
        "pov": "pov",
        "handheld": "handheld",
        "cinematic lighting": "cinematic-lighting",
        "golden hour": "golden-hour",
        "night": "night",
        "underwater": "underwater",
        "space": "space",
        "nature": "nature",
        "urban": "urban",
        "fantasy": "fantasy",
        "sci-fi": "sci-fi",
    }
    
    for kw, tag in tag_keywords.items():
        if kw in text and tag not in tags:
            tags.append(tag)
    
    return tags[:5]  # Limit to 5 tags

def main():
    with open(RAW_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    
    print(f"Processing {len(raw_data)} prompts...")
    
    demos = []
    for idx, item in enumerate(raw_data, start=1):
        title = item.get("title", "").strip()
        prompt = item.get("prompt", "").strip()
        detail_href = item.get("detailHref", "")
        output_url = item.get("outputUrl", "")
        poster_src = item.get("posterSrc")
        source_lang = item.get("sourceLanguage")
        
        if not title or not prompt:
            continue
        
        # Filter out Japanese prompts
        if source_lang == "JA":
            continue
        
        # Filter out prompts containing CJK characters (Chinese/Japanese/Korean)
        # This catches entries that were mislabeled or had mixed-language prompts
        if any(ord(c) > 0x4E00 and ord(c) < 0x9FFF for c in prompt) or \
           any(ord(c) > 0x3400 and ord(c) < 0x4DBF for c in prompt):
            continue
        
        # Generate slug from detailHref or title
        if detail_href:
            slug = detail_href.replace("/prompts/", "").strip("/")
        else:
            slug = slugify(title)
        
        # Infer category
        category = infer_category(title, prompt)
        raw_category = category.lower()
        
        # Map to studio tab
        studio_tab = STUDIO_TAB_MAP.get(category, "video")
        
        # Generate use case
        use_case = generate_use_case(title, prompt)
        
        # Generate tags
        tags = generate_tags(title, prompt, category)
        
        # Build source URL
        source_url = f"https://www.seedance2prompt.com{detail_href}" if detail_href else None
        
        # Ensure posterSrc is always present
        if not poster_src:
            poster_src = generate_placeholder_svg(title)
        
        demo = {
            "id": idx,
            "slug": slug,
            "title": title,
            "category": category,
            "rawCategory": raw_category,
            "useCase": use_case,
            "videoSrc": output_url,
            "posterSrc": poster_src,
            "prompt": prompt,
            "studioTab": studio_tab,
            "tags": tags,
            "sourceUrl": source_url,
            "sourceRepo": "seedance2prompt",
        }
        demos.append(demo)
    
    print(f"Generated {len(demos)} demos")
    
    # Count by category
    cat_counts = {}
    for d in demos:
        cat_counts[d["category"]] = cat_counts.get(d["category"], 0) + 1
    print(f"Categories: {cat_counts}")
    
    # Count by studio tab
    tab_counts = {}
    for d in demos:
        tab_counts[d["studioTab"]] = tab_counts.get(d["studioTab"], 0) + 1
    print(f"Studio tabs: {tab_counts}")
    
    # Write TypeScript file
    write_ts(demos, OUTPUT_FILE)
    print(f"Written to {OUTPUT_FILE}")

def write_ts(demos, path):
    lines = [
        "// AUTO-GENERATED from seedance2prompt.com scrape",
        "// Source: https://www.seedance2prompt.com/prompts",
        "// 2,553 prompts scraped from 142 pages",
        "",
        'import { type VideoDemo } from "./types";',
        'export { DEMO_CATEGORIES } from "./types";',
        "",
        f"export const SEEDANCE_2PROMPT_DEMOS: VideoDemo[] = [",
    ]
    
    for demo in demos:
        lines.append("  {")
        for key, value in demo.items():
            if value is None:
                continue  # Skip null values for optional fields
            elif isinstance(value, str):
                escaped = value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
                lines.append(f'    {key}: "{escaped}",')
            elif isinstance(value, bool):
                lines.append(f"    {key}: {str(value).lower()},")
            else:
                lines.append(f"    {key}: {value},")
        lines.append("  },")
    
    lines.append("];")
    lines.append("")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    main()
