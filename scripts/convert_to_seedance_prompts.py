"""
Convert raw seedance2prompt scraped data to SeedancePrompt JSON format.
Writes to /tmp/seedance_prompts.json for the go-ai-viral API.
"""
import json
import re

RAW_FILE = "/tmp/seedance2prompt_raw.json"
OUTPUT_FILE = "/tmp/seedance_prompts.json"


def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:80]


def main():
    with open(RAW_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    
    print(f"Converting {len(raw_data)} prompts to SeedancePrompt format...")
    
    records = []
    for item in raw_data:
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
        
        # Generate slug from detailHref or title
        if detail_href:
            slug = detail_href.replace("/prompts/", "").strip("/")
        else:
            slug = slugify(title)
        
        # Build full detail URL
        full_detail_href = f"https://www.seedance2prompt.com{detail_href}" if detail_href else None
        
        record = {
            "slug": slug,
            "prompt": prompt,
            "fullPrompt": prompt,
            "sourceLanguage": source_lang if source_lang else None,
            "detailHref": full_detail_href,
            "outputUrl": output_url if output_url else None,
            "categories": [],
            "tags": [],
            "recommendedModel": "seedance",
            "sourceModels": ["seedance"],
            "language": source_lang if source_lang else None,
            "thumbnail": poster_src if poster_src else None,
            "author": None,
            "publishedAt": None,
            "engagement": None,
        }
        records.append(record)
    
    print(f"Converted {len(records)} records")
    
    # Stats
    with_video = sum(1 for r in records if r.get("outputUrl"))
    with_prompt = sum(1 for r in records if r.get("prompt"))
    with_detail = sum(1 for r in records if r.get("detailHref"))
    langs = {}
    for r in records:
        l = r.get("sourceLanguage") or "unknown"
        langs[l] = langs.get(l, 0) + 1
    print(f"With video: {with_video}")
    print(f"With prompt: {with_prompt}")
    print(f"With detailHref: {with_detail}")
    print(f"Languages: {langs}")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
