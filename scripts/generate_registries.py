#!/usr/bin/env python3
"""
Generate all deliverables for the template library audit.
Deduplicates by (sourceRepo, slug) since 80 seedance_2prompt records are duplicated.
Uses weighted keyword scoring to avoid double-counting.
"""

import json
from collections import defaultdict, Counter
from pathlib import Path

BASE = Path("/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt")
DATA = BASE / "data"
DOCS = BASE / "docs"
DOCS_IDEAS = DOCS / "ideas"

with open(DATA / "canonical-template-audit.json") as f:
    audit = json.load(f)

raw_records = audit["records"]

# Deduplicate by (sourceRepo, slug)
seen = set()
records = []
for r in raw_records:
    key = (r["sourceRepo"], r["slug"])
    if key not in seen:
        seen.add(key)
        records.append(r)

DUPLICATES_SKIPPED = len(raw_records) - len(records)
ENGLISH_RECORDS = [r for r in records if r.get("language") == "ENGLISH"]
NON_ENGLISH_RECORDS = [r for r in records if r.get("language") != "ENGLISH"]

# ------------------------------------------------------------------ #
# INDUSTRY / NICHE CLASSIFICATION
# ------------------------------------------------------------------ #

INDUSTRIES = {
    "Food & Beverage": {
        "keywords": ["food", "drink", "beverage", "restaurant", "cafe", "coffee", "tea", "bakery",
                      "burger", "pizza", "ramen", "sushi", "chef", "kitchen", "cooking", "meal",
                      "dessert", "cocktail", "wine", "beer", "soda", "matcha", "chocolate", "ice cream",
                      "ramadan", "iftar", "menu", "gourmet", "dining", "food-drink"],
        "niches": {
            "Restaurants & Cafes": ["restaurant", "cafe", "dining", "menu", "chef", "kitchen", "food-drink"],
            "Coffee Shops": ["coffee", "cafe", "barista", "latte", "espresso", "kopi"],
            "Bakeries": ["bakery", "bread", "pastry", "cake", "croissant", "dessert"],
            "Food Brands": ["food brand", "product food", "packaged food", "snack", "kellogg"],
            "Beverage Brands": ["beverage", "drink", "soda", "cocktail", "juice", "tea brand", "coffee brand"],
            "Catering & Events": ["catering", "buffet", "banquet", "wedding food"],
        },
    },
    "Ecommerce & Products": {
        "keywords": ["product", "ecommerce", "shop", "unboxing", "haul", "review", "skincare",
                      "cosmetic", "perfume", "jewelry", "fashion product", "watch", "bag", "shoes",
                      "serum", "lotion", "cream", "lipstick", "mascara", "nail", "haircare",
                      "diamond", "gold", "silver", "luxury product", "macro product", "product commercial",
                      "product film", "ugc review", "product ads"],
        "niches": {
            "Skincare & Beauty Products": ["skincare", "serum", "lotion", "cream", "cosmetic", "lipstick", "mascara", "beauty product"],
            "Fashion & Apparel": ["fashion", "clothing", "outfit", "dress", "shoes", "bag", "apparel", "fashion product"],
            "Jewelry & Watches": ["jewelry", "watch", "diamond", "gold", "necklace", "ring"],
            "Perfume & Fragrance": ["perfume", "fragrance", "scent", "cologne"],
            "Consumer Electronics": ["electronics", "phone", "tablet", "gadget", "device"],
            "Home & Lifestyle Products": ["home", "decor", "furniture", "lifestyle product"],
        },
    },
    "Real Estate": {
        "keywords": ["real estate", "property", "home", "house", "apartment", "mansion", "villa",
                      "listing", "interior", "bedroom", "living room", "kitchen home", "neighborhood",
                      "residential", "commercial property", "luxury home", "property promo", "home tour"],
        "niches": {
            "Residential Listings": ["home", "house", "apartment", "residential", "bedroom", "living room"],
            "Luxury Properties": ["luxury home", "mansion", "villa", "penthouse", "estate"],
            "Commercial Real Estate": ["commercial property", "office", "retail space"],
            "Property Tours": ["tour", "walkthrough", "walk-through", "home tour", "showcase"],
            "Agent & Broker": ["agent", "broker", "realtor"],
        },
    },
    "Beauty & Fashion": {
        "keywords": ["beauty", "fashion", "makeup", "skincare", "hair", "nails", "runway",
                      "editorial", "model", "glow-up", "grwm", "routine", "lipstick", "mascara",
                      "hairstyle", "outfit", "wardrobe", "style", "influencer beauty", "fashion film",
                      "beauty routine", "fashion commercial"],
        "niches": {
            "Makeup & Cosmetics": ["makeup", "lipstick", "mascara", "eyeshadow", "cosmetics"],
            "Skincare Routines": ["skincare routine", "morning routine", "night routine", "serum"],
            "Hair & Styling": ["hair", "hairstyle", "haircare", "styling"],
            "Fashion Editorial": ["editorial", "runway", "fashion film", "campaign", "fashion commercial"],
            "GRWM & Vlogs": ["grwm", "get ready with me", "beauty vlog", "routine", "fashion vlog"],
            "Influencer Content": ["beauty influencer", "influencer", "collab"],
        },
    },
    "Fitness & Wellness": {
        "keywords": ["fitness", "workout", "gym", "exercise", "training", "yoga", "wellness",
                      "athlete", "sports training", "calisthenics", "boxing", "parkour", "run",
                      "marathon", "meditation", "health", "coaching", "personal trainer"],
        "niches": {
            "Gym & Training": ["gym", "workout", "training", "calisthenics", "weight"],
            "Yoga & Mindfulness": ["yoga", "meditation", "mindfulness", "wellness"],
            "Sports Performance": ["athlete", "sports training", "performance", "competition"],
            "Transformation": ["transformation", "before after", "fitness journey"],
            "Coaching & Motivation": ["coaching", "motivation", "inspirational", "mentor"],
        },
    },
    "Education & Training": {
        "keywords": ["education", "training", "tutorial", "explainer", "lesson", "classroom", "lecture",
                      "course", "instructor", "teacher", "professor", "how-to", "documentary",
                      "wildlife documentary", "history", "science", "lab", "chalkboard"],
        "niches": {
            "Online Courses": ["course", "online class", "lesson", "module"],
            "Tutorials & How-To": ["tutorial", "how-to", "step by step", "guide"],
            "Corporate Training": ["corporate training", "onboarding", "employee training"],
            "Documentary": ["documentary", "wildlife documentary", "nature documentary", "history"],
            "STEM & Science": ["science", "lab", "stem", "physics", "chemistry"],
        },
    },
    "Technology": {
        "keywords": ["tech", "technology", "software", "app", "saas", "digital", "ai",
                      "cyberpunk", "futuristic", "robot", "gadget", "device", "screen",
                      "interface", "data", "code", "programming", "startup", "product tech",
                      "cyber", "hologram", "neural"],
        "niches": {
            "SaaS & Software": ["saas", "software", "app", "platform", "dashboard"],
            "AI & Machine Learning": ["ai", "artificial intelligence", "machine learning", "neural"],
            "Consumer Tech": ["consumer tech", "gadget", "device", "phone", "tablet"],
            "Gaming": ["game", "gaming", "gameplay", "gamer", "esports"],
            "Cyberpunk & Sci-Fi": ["cyberpunk", "sci-fi", "futuristic", "robot", "hologram"],
        },
    },
    "Finance & Professional Services": {
        "keywords": ["finance", "bank", "investment", "stock", "business", "corporate",
                      "office", "professional", "executive", "ceo", "entrepreneur", "lawyer",
                      "consultant", "advisor", "financial", "market", "trading"],
        "niches": {
            "Financial Services": ["finance", "bank", "investment", "stock", "trading", "financial"],
            "Business & Corporate": ["business", "corporate", "office", "executive", "ceo"],
            "Legal & Consulting": ["lawyer", "legal", "consultant", "consulting", "advisor"],
            "Real Estate Professional": ["realtor", "real estate agent", "broker"],
        },
    },
    "Entertainment & Media": {
        "keywords": ["entertainment", "movie", "film", "cinematic", "trailer", "music video",
                      "short film", "character", "story", "drama", "comedy", "animation",
                      "anime", "fantasy", "viral", "meme", "creator", "content creator",
                      "cinematic story", "brand film"],
        "niches": {
            "Short Films": ["short film", "independent film", "narrative"],
            "Music Videos": ["music video", "mv", "music visual"],
            "Animation & Anime": ["animation", "anime", "cartoon", "3d animation"],
            "Viral & Social Content": ["viral", "meme", "trending", "social content", "viral content"],
            "Character & Story": ["character", "story", "narrative", "protagonist"],
        },
    },
    "Automotive": {
        "keywords": ["car", "vehicle", "automotive", "supercar", "racing", "motorcycle",
                      "driving", "dealership", "luxury car", "sports car", "truck", "suv",
                      "electric car", "ev", "rally", "formula", "f1", "drift", "car commercial",
                      "car showcase", "superbike"],
        "niches": {
            "Luxury & Supercars": ["supercar", "luxury car", "exotic", "premium car"],
            "Racing & Motorsport": ["racing", "motorsport", "f1", "formula", "rally", "drift"],
            "Dealership & Sales": ["dealership", "car sales", "showroom"],
            "EV & Future Tech": ["electric car", "ev", "autonomous", "future car"],
            "Motorcycles": ["motorcycle", "bike", "superbike", "motorbike"],
        },
    },
    "Travel & Hospitality": {
        "keywords": ["travel", "hotel", "resort", "destination", "vacation", "adventure",
                      "journey", "tourism", "landmark", "beach", "mountain", "city tour",
                      "hospitality", "airline", "cruise", "hostel", "villa", "getaway",
                      "travel vlog", "travel film", "destination promo"],
        "niches": {
            "Hotels & Resorts": ["hotel", "resort", "suite", "hospitality"],
            "Destinations & Tourism": ["destination", "tourism", "landmark", "travel"],
            "Adventure & Outdoor": ["adventure", "hiking", "outdoor", "expedition"],
            "Airlines & Transport": ["airline", "cruise", "transport"],
        },
    },
    "Sports & Outdoors": {
        "keywords": ["sports", "athlete", "olympic", "football", "basketball", "soccer",
                      "wrestling", "boxing", "ufc", "mma", "baseball", "tennis", "golf",
                      "surfing", "skateboard", "snowboard", "ski", "climb", "outdoor",
                      "extreme sports", "stadium", "championship", "sports broadcast",
                      "action sports", "athletic"],
        "niches": {
            "Team Sports": ["football", "soccer", "basketball", "baseball", "team sports"],
            "Combat Sports": ["boxing", "ufc", "mma", "wrestling", "martial arts"],
            "Action & Extreme": ["extreme sports", "skateboard", "surfing", "parkour", "climbing"],
            "Olympics & Competition": ["olympic", "championship", "tournament", "competition"],
            "Outdoor Adventure": ["outdoor", "hiking", "mountain", "wilderness"],
        },
    },
    "Professional Services": {
        "keywords": ["consulting", "lawyer", "attorney", "accountant", "accounting",
                      "architect", "designer", "agency", "firm", "professional service",
                      "b2b", "enterprise", "coaching", "mentoring", "advisor"],
        "niches": {
            "Consulting": ["consulting", "strategy", "management"],
            "Legal": ["lawyer", "attorney", "legal", "law firm"],
            "Financial Advisory": ["advisor", "wealth", "financial advisory"],
            "Design & Creative": ["designer", "creative", "studio", "agency"],
        },
    },
    "Home Services": {
        "keywords": ["plumber", "electrician", "cleaning", "lawn", "landscaping", "painting",
                      "contractor", "handyman", "repair", "maintenance", "home improvement",
                      "pest control", "roofing", "hvac"],
        "niches": {
            "Cleaning Services": ["cleaning", "maid", "housekeeping"],
            "Maintenance & Repair": ["repair", "maintenance", "handyman", "contractor"],
            "Landscaping": ["landscaping", "lawn", "garden", "outdoor home"],
            "Improvement & Reno": ["renovation", "remodel", "improvement", "painting"],
        },
    },
    "General Business": {
        "keywords": ["business", "brand", "corporate", "company", "promotion", "service",
                      "promotional", "branding", "marketing", "campaign", "ugc", "social ad",
                      "product commercial", "explainer", "talking presenter", "spokesperson",
                      "promotional video"],
        "niches": {
            "Brand Promotions": ["brand", "promotional", "branding", "campaign", "promotional video"],
            "Service Promotions": ["service", "promotion", "offering"],
            "Corporate Communications": ["corporate", "internal", "announcement", "update"],
            "Event Marketing": ["event", "launch", "activation", "promotion"],
        },
    },
    "Viral & Trending": {
        "keywords": ["viral", "trending", "meme", "challenge", "pov", "vlog", "social",
                      "transformation", "trend", "pov", "fyp", "viral short", "impossible",
                      "seamless", "first-person", "mrbeast", "viral video", "trending video"],
        "niches": {
            "POV & Trending": ["pov", "trending", "viral", "fyp", "tiktok", "viral video"],
            "Comedy & Skits": ["comedy", "skit", "prank", "funny"],
            "Transformation": ["transformation", "glow-up", "before after"],
            "Meme & Challenge": ["meme", "challenge", "trending challenge"],
        },
    },
}

def classify_industry_and_niche(record):
    text = " ".join([
        record.get("title", ""),
        record.get("slug", ""),
        record.get("useCase", ""),
        record.get("prompt", "")[:500],
        " ".join(record.get("tags", []))
    ]).lower()

    best_industry = "General Business"
    best_niche = "Brand Promotions"
    best_score = 0

    for industry, cfg in INDUSTRIES.items():
        score = sum(1 for kw in cfg["keywords"] if kw.lower() in text)
        if score > best_score:
            best_score = score
            best_industry = industry
            best_niche_score = 0
            for niche, niche_kws in cfg["niches"].items():
                ns = sum(1 for kw in niche_kws if kw.lower() in text)
                if ns > best_niche_score:
                    best_niche_score = ns
                    best_niche = niche

    if best_score == 0:
        return "General Business", "Brand Promotions"
    return best_industry, best_niche

industry_niche_map = defaultdict(lambda: defaultdict(list))
for r in ENGLISH_RECORDS:
    ind, niche = classify_industry_and_niche(r)
    industry_niche_map[ind][niche].append(r["slug"])

# ------------------------------------------------------------------ #
# NICHE REGISTRY
# ------------------------------------------------------------------ #

def visibility_rule(count):
    if count >= 8:
        return "featured"
    elif count >= 3:
        return "dedicated-browse"
    elif count >= 1:
        return "searchable"
    return "hidden"

proposed_niche_registry = {
    "generatedAt": "2026-09-11",
    "note": f"Generated from {len(ENGLISH_RECORDS)} English templates. {len(NON_ENGLISH_RECORDS)} NON_ENGLISH templates excluded. {DUPLICATES_SKIPPED} duplicate records skipped.",
    "description": "Visibility: 1+=searchable, 3+=dedicated browse, 8+=featured.",
    "industries": {}
}

for industry in sorted(INDUSTRIES.keys()):
    cfg = INDUSTRIES[industry]
    niches_map = industry_niche_map.get(industry, {})
    all_niche_names = list(cfg["niches"].keys())
    niches_data = {}
    for nn in all_niche_names:
        slugs = sorted(niches_map.get(nn, []))
        count = len(slugs)
        if count == 0:
            continue
        related = [n for n in all_niche_names if n != nn and niches_map.get(n, [])]
        niches_data[nn] = {
            "templateSlugs": slugs[:60],
            "templateCount": count,
            "visibility": visibility_rule(count),
            "relatedNiches": related[:5],
        }
    if not niches_data:
        continue
    total_ind = sum(len(v) for v in niches_map.values())
    proposed_niche_registry["industries"][industry] = {
        "niches": niches_data,
        "totalTemplates": total_ind,
    }

with open(DATA / "proposed-niche-registry.json", "w") as f:
    json.dump(proposed_niche_registry, f, indent=2)
print("✓ data/proposed-niche-registry.json")

# ------------------------------------------------------------------ #
# VIRAL STYLE REGISTRY
# ------------------------------------------------------------------ #

STYLE_KEYWORDS = {
    "UGC Ad": ["ugc ad", "ugc review", "ugc testimonial", "ugc vlog", "ugc style"],
    "Product Demo": ["product demo", "demo ", "showcase product", "product showcase", "product film"],
    "Product Reveal": ["reveal", "unveiling", "product reveal", "hero product"],
    "Unboxing": ["unboxing", "haul ", "opening box"],
    "Product Commercial": ["product commercial", "product-ads", "product ads", "brand film product"],
    "Cinematic Commercial": ["cinematic commercial", "luxury commercial", "brand film", "advertising & commercial branding"],
    "Social Ad": ["social ad", "advertisement content", "social media ad", "short-form ad", "ad content"],
    "POV": [" pov", "pov ", "first-person", "first person", "point of view", "fpv"],
    "Vlog": [" vlog", "vlog ", "selfie vlog", "day in the life", "diary vlog"],
    "Talking Presenter": ["talking presenter", "presenter", "host ", "anchor"],
    "Spokesperson": ["spokesperson", "brand ambassador"],
    "Testimonial": ["testimonial", "customer review", "client testimonial", "user testimonial"],
    "Before & After": ["before after", "before & after", "before-and-after"],
    "Transformation": ["transformation", "transforming", "transform ", "morph ", "metamorphosis"],
    "Luxury Ad": ["luxury ad", "luxury commercial", "high-end", "premium commercial"],
    "Food Close-Up": ["food close-up", "macro food", "food macro", "food-drink close"],
    "Restaurant Promo": ["restaurant promo", "restaurant ad", "food promo", "dining promo", "food commercial"],
    "Beauty Routine": ["beauty routine", "skincare routine", "morning routine", "makeup routine", "beauty vlog"],
    "Fashion Editorial": ["fashion editorial", "editorial ", "fashion film", "runway", "fashion showcase"],
    "Property Showcase": ["property showcase", "home showcase", "listing video", "real estate video", "home tour"],
    "Vehicle Showcase": ["vehicle showcase", "car showcase", "supercar", "car commercial", "vehicle commercial"],
    "Tutorial": ["tutorial", "how-to", "step by step", "guide video"],
    "Explainer": ["explainer", "educational", "lesson video", "instructional"],
    "Storytelling": ["storytelling", "narrative", "story ", "short story"],
    "Brand Film": ["brand film", "brand video", "brand story", "branding film"],
    "Short Film": ["short film", "short ", "narrative film", "independent film"],
    "VFX": [" vfx", " vfx ", "visual effects", "visual effect", " cg ", " cgi ", "special effects"],
    "Character Video": ["character video", "character ", "avatar ", "persona video"],
    "Trend": ["trend", "trending", "viral trend", "trending challenge"],
    "Meme": ["meme ", " meme", "funny video", "parody", "satirical"],
    "Comedy": ["comedy", "comedy skit", "funny ", "humor", "parody"],
    "Cinematic Story": ["cinematic story", "cinematic ", "cinematic scene", "cinematic story"],
    "Action Sequence": ["action sequence", "action scene", "chase ", "fight ", "battle ", "combat "],
    "Gameplay": ["gameplay", "gaming", "fps ", "gta ", "esports"],
    "Documentary": ["documentary", "docu ", "nature documentary", "wildlife documentary"],
    "Music Video": ["music video", " mv ", "music visual", "concert"],
    "Anime & Animation": ["anime", "animation", "animated ", "cartoon ", "2d ", "3d animation"],
    "Travel Vlog": ["travel vlog", "travel ", "journey ", "destination ", "travel film"],
    "Event Coverage": ["event ", "wedding ", "conference ", "ceremony "],
    "Product Launch": ["product launch", "launching", "new product", "launch video"],
    "Promo": ["promo", "promotional", "promotion"],
    "Commercial": ["commercial", "advertisement", "branded"],
    "Social Content": ["social content", "social media", "shorts", "reels", "tiktok"],
    "Fashion Film": ["fashion film", "fashion ", "fashion editorial"],
    "Cinematic Portrait": ["cinematic portrait", "portrait ", "character portrait"],
    "Drama": ["drama", "dramatic", "emotional ", "melodrama"],
    "Horror": ["horror", "scary ", "thriller", "suspense"],
    "Sci-Fi": ["sci-fi", "science fiction", "futuristic"],
    "Fantasy": ["fantasy", "magical", "mythical", "supernatural"],
    "Sports Highlight": ["sports highlight", "highlight ", "best moments", "athletic"],
    "Inspirational": ["inspirational", "motivational", "uplifting", "encouraging"],
    "Educational": ["educational", "learning", "teach ", "lesson video"],
    "Corporate": ["corporate", "business ", "professional ", "enterprise"],
    "Livestream": ["livestream", "live stream", "streaming", "broadcast"],
    "Aesthetic": ["aesthetic", "lo-fi", "lofi", "vibe ", "mood "],
    "Viral Short": ["viral short", "short form", "vertical video"],
    "News & Commentary": ["news ", "commentary", "analysis ", "report "],
}

def classify_styles(record):
    text = " ".join([
        record.get("title", ""),
        record.get("slug", ""),
        record.get("useCase", ""),
        record.get("prompt", "")[:800],
        " ".join(record.get("tags", []))
    ]).lower()
    matched = []
    for style, kws in STYLE_KEYWORDS.items():
        if any(kw in text for kw in kws):
            matched.append(style)
    if not matched:
        matched = ["Cinematic Story"]
    return list(dict.fromkeys(matched))[:8]

style_registry = {
    "generatedAt": "2026-09-11",
    "description": "Viral/video style registry. Each style lists matching template slugs.",
    "totalUniqueEnglishTemplates": len(ENGLISH_RECORDS),
    "totalStyles": len(STYLE_KEYWORDS),
    "styles": {}
}
for style in sorted(STYLE_KEYWORDS.keys()):
    style_registry["styles"][style] = {"templateSlugs": [], "templateCount": 0}

for r in ENGLISH_RECORDS:
    styles = classify_styles(r)
    for s in styles:
        if s in style_registry["styles"]:
            style_registry["styles"][s]["templateSlugs"].append(r["slug"])
            style_registry["styles"][s]["templateCount"] += 1

for s in style_registry["styles"]:
    style_registry["styles"][s]["templateSlugs"] = sorted(style_registry["styles"][s]["templateSlugs"])
    style_registry["styles"][s]["templateSlugs"] = style_registry["styles"][s]["templateSlugs"][:100]

with open(DATA / "proposed-viral-style-registry.json", "w") as f:
    json.dump(style_registry, f, indent=2)
print("✓ data/proposed-viral-style-registry.json")

# ------------------------------------------------------------------ #
# BUSINESS OBJECTIVE REGISTRY
# ------------------------------------------------------------------ #

OBJECTIVE_KEYWORDS = {
    "Promote Product": ["product promotion", "product showcase", "product film", "product commercial"],
    "Promote Service": ["service promotion", "promote service", "service ad"],
    "Generate Leads": ["lead generation", "lead gen", "generate leads", "conversion"],
    "Launch Product": ["product launch", "launching ", "new product", "launch video"],
    "Announce Offer": ["announce offer", "promotion ", "limited offer", "special offer", "flash sale"],
    "Build Brand Awareness": ["brand awareness", "brand building", "brand identity", "branding "],
    "Introduce Business": ["introduce business", "company intro", "about us", "brand intro"],
    "Introduce Founder": ["founder intro", "ceo intro", "founder ", "about founder", "personal brand"],
    "Show Product Features": ["product features", "feature showcase", "product demo", "feature highlight"],
    "Show Before & After": ["before after", "before & after", "before-and-after"],
    "Promote Menu Item": ["menu item", "dish promo", "food promotion", "menu showcase", "special dish"],
    "Promote Property": ["property promo", "listing promo", "real estate promo", "home promo"],
    "Promote Vehicle": ["vehicle promo", "car promo", "automotive promo", "car showcase"],
    "Promote Event": ["event promotion", "event promo", "event marketing", "launch event"],
    "Educate Customer": ["educate", "educational ", "tutorial", "how-to", "explainer", "lesson video"],
    "Build Authority": ["authority", "thought leader", "expert ", "credibility"],
    "Create Paid Ad": ["paid ad", "paid social", "paid campaign", "ad campaign", "paid advertisement"],
    "Create Organic Social Content": ["organic ", "social content", "social media", "organic content", "organic social"],
    "Show Testimonial": ["testimonial", "customer review", "client testimonial", "user testimonial"],
    "Limited-Time Promotion": ["limited time", "24 hours", "limited offer", "countdown"],
    "Promote Course": ["course promotion", "course ad", "education promo"],
    "Recruitment & Hiring": ["recruitment", "hiring", "careers ", "join our team"],
    "Fundraising": ["fundraising", "donation ", "nonprofit", "charity "],
    "Internal Communications": ["internal ", "company update", "all-hands"],
    "Seasonal Campaign": ["seasonal ", "holiday campaign", "christmas ", "halloween ", "summer campaign"],
}

def classify_objectives(record):
    text = " ".join([
        record.get("title", ""),
        record.get("slug", ""),
        record.get("useCase", ""),
        record.get("prompt", "")[:600],
        " ".join(record.get("tags", []))
    ]).lower()
    matched = []
    for obj, kws in OBJECTIVE_KEYWORDS.items():
        if any(kw in text for kw in kws):
            matched.append(obj)
    if not matched:
        cat = record.get("category", "")
        if cat == "Commercial":
            matched = ["Promote Product", "Create Paid Ad", "Build Brand Awareness"]
        elif cat == "UGC":
            matched = ["Create Organic Social Content", "Show Testimonial"]
        elif cat == "Social":
            matched = ["Create Organic Social Content", "Build Brand Awareness"]
        elif cat == "Cinema":
            matched = ["Build Brand Awareness", "Storytelling"]
        elif cat == "Action":
            matched = ["Build Brand Awareness", "Promote Product"]
        elif cat == "Fashion":
            matched = ["Promote Product", "Build Brand Awareness"]
        elif cat == "Animation":
            matched = ["Build Brand Awareness", "Create Organic Social Content"]
        else:
            matched = ["Build Brand Awareness"]
    return list(dict.fromkeys(matched))[:6]

objective_registry = {
    "generatedAt": "2026-09-11",
    "description": "Business objective registry. Each objective lists matching template slugs.",
    "totalObjectives": len(OBJECTIVE_KEYWORDS),
    "objectives": {}
}
for obj in sorted(OBJECTIVE_KEYWORDS.keys()):
    objective_registry["objectives"][obj] = {"templateSlugs": [], "templateCount": 0}

for r in ENGLISH_RECORDS:
    objs = classify_objectives(r)
    for o in objs:
        if o in objective_registry["objectives"]:
            objective_registry["objectives"][o]["templateSlugs"].append(r["slug"])
            objective_registry["objectives"][o]["templateCount"] += 1

for o in objective_registry["objectives"]:
    objective_registry["objectives"][o]["templateSlugs"] = sorted(objective_registry["objectives"][o]["templateSlugs"])
    objective_registry["objectives"][o]["templateSlugs"] = objective_registry["objectives"][o]["templateSlugs"][:100]

with open(DATA / "proposed-business-objective-registry.json", "w") as f:
    json.dump(objective_registry, f, indent=2)
print("✓ data/proposed-business-objective-registry.json")

# ------------------------------------------------------------------ #
# LANDING NICHE MAP
# ------------------------------------------------------------------ #

LANDING_NICHES = [
    "ecommerce", "restaurants-food", "real-estate", "beauty", "wellness-fitness",
    "education", "technology", "finance", "entertainment-media", "automotive",
    "travel-hospitality", "sports-outdoors", "general-business", "viral-trending"
]

LANDING_CONFIG = {
    "ecommerce": {
        "weighted_keywords": {
            "product commercial": 4, "product film": 4, "ugc review": 4, "product ads": 4, "ugc product": 4,
            "product": 2, "commercial": 2, "ugc": 2, "skincare": 2, "perfume": 2, "jewelry": 2,
            "fashion": 2, "watch": 2, "beauty": 2, "luxury product": 2, "macro product": 2,
        },
        "exclude": ["gameplay", "warfare", "action scene", "parkour", "anime scene", "cyberpunk scene",
                     "horror", "fantasy battle", "car ", "racing ", "futuristic hypercar", "pizza ", "burger "],
        "min_score": 7,
    },
    "restaurants-food": {
        "weighted_keywords": {
            "food-drink": 4, "food commercial": 4, "restaurant": 4, "chef": 3, "baking": 3, "cooking": 3,
            "food": 2, "drink": 2, "kitchen": 2, "dessert": 2, "bakery": 2, "ramen": 2, "burger": 2,
            "pizza": 2, "menu": 2, "gourmet": 2, "dining": 2,
        },
        "exclude": ["gameplay", "warfare", "car ", "racing ", "fashion runway", "anime", "cyberpunk", "fantasy", "futuristic",
                     "wildlife", "giant koi", "documentary feeling", "social viral", "ugc video script", "treehouse",
                     "penguin", "dancing", "cat salon", "makeover video", "coffee shop", "coffee vlog", "coffee ugc",
                     "ice cream commercial", "parkour ", "boxing ", "ufc ", "olympic ", "sports ", "football ", "basketball ",
                     "soccer ", "nba ", "wrestling", "finance", "business speech", "professional woman", "corporate",
                     "cyberpunk ", "futuristic ", "robot ", "ai ", "digital ", "hologram "],
        "min_score": 7,
    },
    "real-estate": {
        "weighted_keywords": {
            "real estate": 5, "property": 4, "home tour": 4, "property tour": 4, "home showcase": 4,
            "listing": 3, "interior design": 3, "residential": 3, "modern home": 3, "home ": 2,
            "house": 2, "apartment": 2, "interior": 2, "bedroom": 2, "living room": 2,
            "villa": 2, "mansion": 2, "walk-through": 2,
        },
        "exclude": ["gameplay", "warfare", "car ", "racing ", "fashion runway", "anime", "fantasy", "cyberpunk", "horror",
                     "wildlife", "documentary ", "ugc video script", "treehouse", "character girl", "character-in-image",
                     "fbi agent", "alien at a party", "girl s image", "multi-shot-cinematic-scene", "coffee ugc",
                     "coffee vlog", "coffee shop", "indonesian coffee", "parkour ", "boxing ", "wrestling", "ufc ",
                     "olympic ", "sports ", "football ", "basketball ", "soccer ", "nba ", "giant koi", "koi park",
                     "viral giant", "cat salon", "pet makeover", "dessert animation", "surreal tokyo", "pizza ",
                     "burger ", "fast food", "restaurant ", "chef ", "kitchen ", "baking", "cooking ", "food delivery",
                     "futuristic hypercar", "supercar ", "car commercial", "vehicle ", "motorcycle ", "racing ", "drift",
                     "rally ", "cyberpunk ", "futuristic ", "anime ", "fantasy ", "sci-fi ", "robot ", "ai ", "digital ",
                     "hologram ", "fashion ", "editorial ", "runway", "makeup ", "lipstick", "mascara", "beauty ", "grwm",
                     "glow-up", "yoga ", "meditation", "fitness ", "workout", "gym ", "athlete", "training ", "calisthenics",
                     "cinematic story", "short film", "drama", "brand film", "comedy", "parody", "meme ", "skit",
                     "viral ", "trending", "transformation", "pov ", "fpv ", "first-person", "mrbeast", "home-video",
                     "vhs home", "home movie", "cozy high-rise", "couple argument", "barbershop", "space colony",
                     "hand-drawn sketch", "coffee shop", "coffee vlog", "coffee ugc"],
        "min_score": 5,
    },
    "beauty": {
        "weighted_keywords": {
            "beauty commercial": 4, "fashion commercial": 4, "fashion editorial": 4, "fashion film": 4,
            "beauty routine": 4, "grwm": 4, "skincare routine": 4, "beauty vlog": 4,
            "beauty": 2, "fashion": 2, "skincare": 2, "makeup ": 2, "model": 2, "hair": 2,
            "lipstick": 2, "mascara": 2, "haircare": 2, "editorial": 2, "runway": 2,
            "glow-up": 2, "influencer": 2,
        },
        "exclude": ["gameplay", "warfare", "car ", "racing ", "horror", "action battle", "cyberpunk", "futuristic",
                     "olive oil ad", "wrestling documentary", "futuristic sci-fi", "coffee shop", "coffee vlog",
                     "pizza ", "burger ", "fast food", "restaurant ", "chef ", "kitchen ", "cooking ", "baking"],
        "min_score": 7,
    },
    "wellness-fitness": {
        "weighted_keywords": {
            "fitness": 2, "workout": 2, "gym": 2, "yoga": 2, "athlete": 2, "training": 2,
            "boxing": 2, "wellness": 2, "calisthenics": 2, "olympic": 2, "marathon": 2,
            "exercise": 2, "parkour": 2, "fitness montage": 3, "fitness aesthetic": 3,
            "fitness transformation": 3, "boxing training": 3, "boxing montage": 3,
        },
        "exclude": ["gameplay", "warfare", "fashion runway", "beauty commercial", "anime", "cyberpunk", "futuristic",
                     "coffee shop", "coffee vlog", "coffee ugc", "pizza ", "burger ", "fast food", "chef ", "cooking "],
        "min_score": 6,
    },
    "education": {
        "weighted_keywords": {
            "documentary": 4, "wildlife documentary": 5, "educational": 3, "tutorial": 3, "science": 3,
            "lab ": 3, "explainer": 3, "how-to": 3, "lesson": 2, "classroom": 2, "professor": 2,
            "training ": 2, "course": 2, "history": 2, "wildlife": 2, "nature documentary": 3,
        },
        "exclude": ["gameplay", "warfare", "car ", "fashion runway", "beauty commercial", "ugc ad", "product commercial",
                     "giant koi", "park incident", "viral giant", "stop wasting credits", "surreal tokyo dessert",
                     "dessert animation", "social viral", "ugc video script", "treehouse", "coffee shop", "coffee vlog",
                     "coffee ugc", "cat salon", "makeover video", "pizza ", "burger ", "fast food", "chef ", "cooking ",
                     "baking", "food delivery", "supercar ", "car commercial", "vehicle ", "racing ", "f1 ", "formula ",
                     "cyberpunk ", "futuristic ", "anime ", "fantasy ", "sci-fi ", "makeup ", "lipstick", "mascara",
                     "yoga ", "meditation", "fitness ", "workout", "gym ", "boxing ", "ufc ", "olympic ", "sports ",
                     "football ", "basketball ", "soccer ", "nba ", "wrestling", "finance", "business speech",
                     "professional woman", "corporate", "hotel ", "resort ", "destination ", "travel ", "tourism ",
                     "meme ", "parody", "comedy ", "skit", "viral ", "trending", "pov ", "fpv ", "mrbeast"],
        "min_score": 6,
    },
    "technology": {
        "weighted_keywords": {
            "cyberpunk": 4, "ai ": 4, "saas": 4, "tech": 3, "digital ": 3, "futuristic": 3,
            "robot": 3, "software": 3, "startup": 3, "product tech": 3, "hologram": 3,
            "technology": 2, "gadget": 2, "device": 2, "cyber": 2, "neural": 2,
            "app ": 2, "screen": 2, "interface": 2, "data ": 2, "code ": 2,
        },
        "exclude": ["gameplay", "warfare fps", "fashion runway", "beauty commercial", "car racing", "ugc ad",
                     "olympic hammer", "football stadium", "basketball", "wrestling match", "sports broadcast",
                     "sports highlight", "parkour ", "boxing ", "ufc ", "olympic ", "nba ", "nfl ", "mma ", "sports training",
                     "finance", "business speech", "professional woman", "corporate", "office scene",
                     "coffee shop", "coffee vlog", "coffee ugc", "pizza ", "burger ", "fast food"],
        "min_score": 7,
    },
    "finance": {
        "weighted_keywords": {
            "business": 3, "corporate": 3, "professional ": 3, "ceo": 3, "executive": 3,
            "finance": 4, "financial": 3, "business speech": 4, "professional woman": 3,
            "office scene": 3, "office ": 2, "market ": 2, "stock ": 2,
        },
        "exclude": ["gameplay", "warfare", "car ", "racing ", "fashion runway", "anime", "cyberpunk", "fantasy", "futuristic",
                     "michael jackson", "hitler", "epstein", "faceoff", "hip hop dance", "hip-hop", "pet makeover", "cat salon",
                     "olive oil", "fashion behind-the", "fashion commercial behind", "wrestling documentary", "boxing montage",
                     "supercar ", "car commercial", "vehicle ", "motorcycle ", "racing ", "f1 ", "formula ", "drift", "rally ",
                     "coffee shop", "coffee vlog", "coffee ugc", "pizza ", "burger ", "fast food", "chef ", "cooking "],
        "min_score": 5,
    },
    "entertainment-media": {
        "weighted_keywords": {
            "short film": 4, "cinematic story": 4, "brand film": 4, "animation": 3, "anime": 3,
            "cinematic": 2, "film": 2, "movie": 2, "trailer": 2, "storytelling": 2, "drama": 2,
            "character": 2, "fantasy": 2, "entertainment": 2, "music video": 2,
        },
        "exclude": ["gameplay", "ugc ad", "product commercial", "fashion runway", "sports broadcast", "news ",
                     "created with seedance", "one 30-second fight", "arctic dark comedy", "olive oil", "sunglasses black studio",
                     "pet makeover", "hip hop dance", "wrestling documentary", "treehouse", "coffee shop", "coffee vlog", "coffee ugc",
                     "indonesian coffee", "koi park incident", "giant koi"],
        "min_score": 6,
    },
    "automotive": {
        "weighted_keywords": {
            "car commercial": 4, "supercar": 4, "car showcase": 4, "vehicle commercial": 4,
            "car ": 2, "vehicle": 2, "racing": 2, "automotive": 2, "superbike": 2,
            "motorcycle": 2, "driving": 2, "luxury car": 2, "car chase": 2,
            "rally": 2, "formula": 2, "f1": 2, "drift": 2, "sports car": 2,
        },
        "exclude": ["gameplay", "warfare", "anime", "fashion runway", "beauty commercial", "cyberpunk", "futuristic",
                     "enchanted ice skating", "ice dragon naval", "drone racing", "apocalyptic city", "cyberpunk car",
                     "futuristic hypercar", "transforming robot", "bullet train speed", "sci-fi car chase", "cyberpunk f1",
                     "coffee shop", "coffee vlog", "coffee ugc", "pizza ", "burger ", "fast food", "chef ", "cooking "],
        "min_score": 6,
    },
    "travel-hospitality": {
        "weighted_keywords": {
            "travel vlog": 4, "travel film": 4, "destination promo": 4, "travel": 2, "hotel": 2,
            "resort": 2, "destination": 2, "vacation": 2, "adventure": 2, "journey": 2,
            "tourism": 2, "beach": 2, "mountain": 2, "travelogue": 2, "getaway": 2, "scenic": 2,
        },
        "exclude": ["gameplay", "warfare", "car ", "product commercial", "fashion runway", "ugc ad",
                     "sports", "athletic", "stadium", "basketball", "football", "olympic", "sports broadcast", "sports highlight",
                     "wrestling", "boxing", "ufc", "mma", "parkour ", "skateboard", "surf ", "snowboard", "ski ", "climb",
                     "wildlife photographer", "wildlife documentary", "lion cinematic", "wolf deer", "lion elephant",
                     "koi park", "giant koi", "viral giant", "treehouse", "coffee shop", "coffee vlog", "coffee ugc",
                     "indonesian coffee", "cat salon", "pet makeover", "wrestling documentary", "supercar ", "car commercial",
                     "vehicle ", "motorcycle ", "racing ", "f1 ", "formula ", "drift", "rally ", "luxury car",
                     "coffee shop", "coffee vlog", "coffee ugc"],
        "min_score": 6,
    },
    "sports-outdoors": {
        "weighted_keywords": {
            "olympic": 4, "sports broadcast": 4, "sports highlight": 4, "sports": 2, "athlete": 2,
            "football": 2, "basketball": 2, "soccer": 2, "wrestling": 2, "boxing": 2, "ufc": 2,
            "stadium": 2, "championship": 2, "athletic": 2, "action sports": 3,
            "sports training": 2, "olympic ": 2, "mma": 2, "nba": 2, "nfl": 2,
        },
        "exclude": ["gameplay", "fashion runway", "beauty commercial", "product commercial", "ugc ad",
                     "travel", "hotel", "resort", "destination", "tourism", "hotel ", "resort ",
                     "cat makeover", "pet makeover", "viral giant-koi", "giant koi",
                     "treehouse", "coffee shop", "coffee vlog", "coffee ugc", "indonesian coffee", "koi park",
                     "pizza ", "burger ", "fast food", "chef ", "kitchen ", "cooking ", "baking", "food delivery",
                     "supercar ", "car commercial", "vehicle ", "motorcycle ", "racing ", "f1 ", "formula "],
        "min_score": 6,
    },
    "general-business": {
        "weighted_keywords": {
            "brand promotional": 4, "promotional video": 4, "brand": 2, "promotional": 2, "branding": 2,
            "campaign": 2, "business": 2, "corporate": 2, "ugc": 2, "social ad": 2,
            "product commercial": 2, "marketing": 2, "promotion": 2,
        },
        "exclude": ["gameplay", "warfare", "anime", "cyberpunk", "fantasy", "horror"],
        "min_score": 5,
    },
    "viral-trending": {
        "weighted_keywords": {
            "viral video": 4, "viral short": 4, "viral": 2, "trending": 2, "meme": 2,
            "pov": 2, "vlog": 2, "transformation": 2, "trend": 2, "fyp": 2,
            "impossible": 2, "seamless": 2, "first-person": 2, "mrbeast": 2,
        },
        "exclude": ["gameplay", "warfare", "anime", "product commercial", "fashion runway"],
        "min_score": 6,
    },
}

def landing_niche_score(record, niche):
    cfg = LANDING_CONFIG.get(niche, {})
    text = " ".join([
        record.get("title", ""),
        record.get("slug", ""),
        record.get("useCase", ""),
        record.get("prompt", "")[:400],
        " ".join(record.get("tags", []))
    ]).lower()

    for ex in cfg.get("exclude", []):
        if ex in text:
            return -1

    score = 0
    seen_kw = set()
    for kw, weight in cfg.get("weighted_keywords", {}).items():
        kw_lower = kw.lower()
        if kw_lower in text and kw_lower not in seen_kw:
            score += weight
            seen_kw.add(kw_lower)

    min_score = cfg.get("min_score", 5)
    if score < min_score:
        return -1
    return score

landing_niche_map = {
    "generatedAt": "2026-09-11",
    "description": "Curated landing page niche map. Each niche lists 6-12 highest-scoring unique templates.",
    "note": "Scored by weighted keyword relevance. Excluded off-topic content. Min score varies by niche.",
    "niches": {}
}

for niche in LANDING_NICHES:
    scored = []
    for r in ENGLISH_RECORDS:
        s = landing_niche_score(r, niche)
        if s > 0:
            scored.append((s, r["slug"], r["title"], r["category"], r["studioTab"], r["sourceRepo"]))
    scored.sort(key=lambda x: (-x[0], x[2]))
    seen_slugs = set()
    unique = []
    for item in scored:
        if item[1] not in seen_slugs:
            seen_slugs.add(item[1])
            unique.append(item)
    top = unique[:12]
    landing_niche_map["niches"][niche] = {
        "templateSlugs": [t[1] for t in top],
        "templateCount": len(top),
        "proposedTemplates": [
            {"slug": t[1], "title": t[2], "category": t[3], "studioTab": t[4], "sourceRepo": t[5], "score": t[0]}
            for t in top
        ]
    }

with open(DATA / "proposed-landing-niche-map.json", "w") as f:
    json.dump(landing_niche_map, f, indent=2)
print("✓ data/proposed-landing-niche-map.json")

# ------------------------------------------------------------------ #
# Save intermediate data for markdown generation
# ------------------------------------------------------------------ #
import pickle
intermediate = {
    "records": records,
    "ENGLISH_RECORDS": ENGLISH_RECORDS,
    "NON_ENGLISH_RECORDS": NON_ENGLISH_RECORDS,
    "raw_records": raw_records,
    "DUPLICATES_SKIPPED": DUPLICATES_SKIPPED,
    "audit": audit,
    "proposed_niche_registry": proposed_niche_registry,
    "style_registry": style_registry,
    "objective_registry": objective_registry,
    "landing_niche_map": landing_niche_map,
    "source_breakdown": {},
    "studio_tab_breakdown": {},
    "industry_niche_map": {k: dict(v) for k, v in industry_niche_map.items()},
}
for r in records:
    src = r["sourceRepo"]
    if src not in intermediate["source_breakdown"]:
        intermediate["source_breakdown"][src] = {"total": 0, "english": 0, "nonEnglish": 0, "featured": 0, "categories": Counter(), "studioTabs": Counter()}
    intermediate["source_breakdown"][src]["total"] += 1
    if r.get("language") == "ENGLISH":
        intermediate["source_breakdown"][src]["english"] += 1
    else:
        intermediate["source_breakdown"][src]["nonEnglish"] += 1
    if r.get("featured"):
        intermediate["source_breakdown"][src]["featured"] += 1
    intermediate["source_breakdown"][src]["categories"][r.get("category", "Unknown")] += 1
    intermediate["source_breakdown"][src]["studioTabs"][r.get("studioTab", "Unknown")] += 1

for r in records:
    tab = r.get("studioTab", "Unknown")
    if tab not in intermediate["studio_tab_breakdown"]:
        intermediate["studio_tab_breakdown"][tab] = {"total": 0, "english": 0, "categories": Counter()}
    intermediate["studio_tab_breakdown"][tab]["total"] += 1
    if r.get("language") == "ENGLISH":
        intermediate["studio_tab_breakdown"][tab]["english"] += 1
    intermediate["studio_tab_breakdown"][tab]["categories"][r.get("category", "Unknown")] += 1

with open("/tmp/audit_data.pkl", "wb") as f:
    pickle.dump(intermediate, f)
print("✓ Saved audit data for markdown generation")
print(f"  English: {len(ENGLISH_RECORDS)}, Non-English: {len(NON_ENGLISH_RECORDS)}, Total unique: {len(records)}")
