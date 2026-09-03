"""
Scrape all Seedance2Prompt prompts from seedance2prompt.com/prompts
Outputs: /tmp/seedance2prompt_raw.json
"""
from playwright.sync_api import sync_playwright
import json
import time
import sys
import re

BASE_URL = "https://www.seedance2prompt.com/prompts"
OUTPUT_FILE = "/tmp/seedance2prompt_raw.json"


def extract_articles(page):
    """Extract all prompt articles from the current page."""
    articles = page.locator("article").all()
    results = []
    for article in articles:
        try:
            # Title from aria-label of the preview button
            title = None
            preview_btn = article.locator('button[aria-label^="Preview output video:"]').first
            if preview_btn.count() > 0:
                aria = preview_btn.get_attribute("aria-label") or ""
                title = aria.replace("Preview output video:", "").strip()

            if not title:
                recreate_btn = article.locator('button[aria-label^="Recreate:"]').first
                if recreate_btn.count() > 0:
                    aria = recreate_btn.get_attribute("aria-label") or ""
                    title = aria.replace("Recreate:", "").strip()

            # Prompt text from the line-clamp-5 div
            prompt_text = ""
            prompt_div = article.locator('div.line-clamp-5').first
            if prompt_div.count() > 0:
                prompt_text = prompt_div.inner_text().strip()

            # Detail href
            detail_href = None
            detail_link = article.locator('a[href*="/prompts/"]').first
            if detail_link.count() > 0:
                detail_href = detail_link.get_attribute("href")

            # Source language from aria-label
            source_lang = None
            lang_btn = article.locator('button[aria-label^="Original language:"]').first
            if lang_btn.count() > 0:
                aria = lang_btn.get_attribute("aria-label") or ""
                match = re.search(r'Original language:\s*(\w+)', aria)
                if match:
                    source_lang = match.group(1)[:2].upper()

            # Video output URL
            output_url = None
            video_poster = None
            video_el = article.locator("video").first
            if video_el.count() > 0:
                output_url = video_el.get_attribute("src") or video_el.get_attribute("data-src")
                video_poster = video_el.get_attribute("poster")

            # Poster image - prefer img element, fallback to video poster
            poster_src = None
            img_el = article.locator("img").first
            if img_el.count() > 0:
                poster_src = img_el.get_attribute("src")
            
            if not poster_src:
                poster_src = video_poster

            results.append({
                "title": title or "",
                "prompt": prompt_text,
                "detailHref": detail_href,
                "sourceLanguage": source_lang,
                "outputUrl": output_url,
                "posterSrc": poster_src,
            })
        except Exception as e:
            print(f"Error extracting article: {e}", file=sys.stderr)
            continue
    return results


def main():
    all_prompts = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })

        print(f"Navigating to {BASE_URL}...")
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("article", timeout=30000)
        time.sleep(3)

        # Get total count
        total_el = page.locator("text=/TOTAL:\\s*\\d+/").first
        total_text = total_el.inner_text() if total_el.count() > 0 else ""
        print(f"Total indicator: {total_text}")

        # Get total pages from pagination
        pagination_text = page.locator("nav[aria-label='Prompt pagination']").inner_text()
        print(f"Pagination: {pagination_text}")

        # Extract first page
        print("Extracting page 1...")
        articles = extract_articles(page)
        print(f"  Found {len(articles)} prompts")
        all_prompts.extend(articles)

        # Navigate through remaining pages
        page_num = 2
        max_pages = 150
        while page_num <= max_pages:
            next_btn = page.locator('button:has-text("Next")')
            if next_btn.count() == 0 or next_btn.first.is_disabled():
                print("No more pages.")
                break

            print(f"Navigating to page {page_num}...")
            next_btn.first.click()
            page.wait_for_selector("article", timeout=30000)
            time.sleep(2)

            print(f"Extracting page {page_num}...")
            articles = extract_articles(page)
            print(f"  Found {len(articles)} prompts")
            if not articles:
                print("No articles found, stopping.")
                break
            all_prompts.extend(articles)
            page_num += 1

        browser.close()

    print(f"\nTotal prompts scraped: {len(all_prompts)}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_prompts, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
