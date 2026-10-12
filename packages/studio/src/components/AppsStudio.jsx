"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FaGithub, FaExternalLinkAlt, FaSearch, FaCheck, FaBook, FaCode, FaRocket } from "react-icons/fa";
import en from "../messages/en/appsStudio.json";
import zh from "../messages/zh/appsStudio.json";
import { resolveCopy } from "../i18nUtils";

const APPS = [
  {
    id: "ai-headshot-studio",
    name: "AI Headshot Studio",
    description: "Professional AI headshot generator for LinkedIn, team portraits, and personal branding.",
    category: "Image",
    repo: "https://github.com/deangilmoreremix/ai-headshot-generator",
    hosted: "https://ai-headshot-generator-xi.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png"
  },
  {
    id: "nano-banana-studio",
    name: "Nano Banana Studio",
    description: "AI image generation platform with text-to-image and multi-image reference editing.",
    category: "Image",
    repo: "https://github.com/deangilmoreremix/nano-banana-generator",
    hosted: "https://nano-banana-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png"
  },
  {
    id: "seedance-v2-studio",
    name: "Seedance V2 Studio",
    description: "AI video generation workspace for Seedance 2.0 and Seedance 2 Mini text-to-video and image-to-video.",
    category: "Video",
    repo: "https://github.com/deangilmoreremix/seedance-2-generator",
    hosted: "https://seedance-2-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png"
  },
  {
    id: "ai-clipping-studio",
    name: "AI Clipping Studio",
    description: "AI-powered video clipping that extracts viral highlights from YouTube videos automatically.",
    category: "Video",
    repo: "https://github.com/deangilmoreremix/ai-clipping-generator",
    hosted: "https://ai-clipping-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png"
  },
  {
    id: "ai-youtube-shorts-generator",
    name: "AI YouTube Shorts Generator",
    description: "Turn long-form YouTube videos into viral 9:16 shorts with LLM highlight detection and auto vertical cropping.",
    category: "Video",
    repo: "https://github.com/deangilmoreremix/AI-Youtube-Shorts-Generator",
    thumbnail: "https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator/raw/main/assets/video-demo-thumb.png"
  },
  {
    id: "easyveo-studio",
    name: "EasyVeo Studio",
    description: "Complete Veo video generation suite for text-to-video, image-to-video, and reference-to-video.",
    category: "Video",
    repo: "https://github.com/deangilmoreremix/veo4-video-generator",
    hosted: "https://veo4-video-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png"
  },
  {
    id: "pet-product-studio",
    name: "Pet Product Studio",
    description: "AI pet product ad generator that places pet products into stunning lifestyle scenes.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/pet-product-studio",
    hosted: "https://pet-product-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Pet_Product_Studio.jpg"
  },
  {
    id: "resale-photo-enhancer",
    name: "Resale Photo Enhancer",
    description: "AI product photo studio for resellers. Swap backgrounds and enhance listing photos.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/resale-photo-enhancer",
    hosted: "https://resale-photo-enhancer.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Resale_Photo_Enhancer.png"
  },
  {
    id: "blogger-cms",
    name: "Blogger CMS",
    description: "AI-powered blog writer and SEO content management system with rich text editor.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/blogger-cms",
    hosted: "https://blogger-cms-psi.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Blogger_CMS.png"
  },
  {
    id: "amazon-product-studio",
    name: "Amazon Product Studio",
    description: "AI product photography studio for Amazon sellers with multi-image reference and scene presets.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/amazon-product-studio",
    hosted: "https://amazon-product-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Amazon_Product_Studio.webp"
  },
  {
    id: "ai-business-card",
    name: "AI Business Card",
    description: "AI digital business card generator with QR sharing, templates, and visitor chatbot.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/ai-business-card",
    hosted: "https://ai-business-card-ten.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Business_Card.webp"
  },
  {
    id: "mailwise",
    name: "MailWise",
    description: "AI email composer and cold outreach assistant with template presets and tone controls.",
    category: "Productivity",
    repo: "https://github.com/deangilmoreremix/mail-wise",
    hosted: "https://mail-wise-khaki.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/MailWise.png"
  },
  {
    id: "my-podcast",
    name: "My Podcast",
    description: "AI voiceover and podcast narration studio with fine-grained voice controls.",
    category: "Audio",
    repo: "https://github.com/deangilmoreremix/my-podcast",
    hosted: "https://my-podcast.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/My_Podcast.webp"
  },
  {
    id: "ai-knowledge-base",
    name: "AI Knowledge Base",
    description: "Custom AI knowledge base and chatbot builder with RAG, document upload, and embeddable widgets.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/ai-knowledge-base",
    hosted: "https://ai-knowledge-base-six.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Knowledge_Base.png"
  },
  {
    id: "ai-royal-portrait",
    name: "AI Royal Portrait",
    description: "Transform photos into 18th-century royal oil paintings and artistic portrait styles.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-royal-portrait",
    hosted: "https://ai-royal-portrait.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Royal_Portrait.png"
  },
  {
    id: "ai-meme",
    name: "AI MEME",
    description: "Viral-ready meme generation based on trending topics with multi-model AI support.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-meme-generator",
    hosted: "https://ai-meme-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_MEME.png"
  },
  {
    id: "ai-real-estate-stager",
    name: "AI Real Estate Stager",
    description: "Virtually furnish and stage empty homes for sale with photorealistic AI staging.",
    category: "Real Estate",
    repo: "https://github.com/deangilmoreremix/ai-real-estate-stager",
    hosted: "https://ai-real-estate-stager.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Real_Estate_Stager.webp"
  },
  {
    id: "ai-logo",
    name: "AI Logo",
    description: "Dynamic brand identity and logo generator with text-to-logo and sketch-to-logo modes.",
    category: "Design",
    repo: "https://github.com/deangilmoreremix/ai-logo-studio",
    hosted: "https://ai-logo-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Logo.png"
  },
  {
    id: "oldphoto",
    name: "OldPhoto",
    description: "Restore, colorize, and sharpen vintage family photos with AI.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/old-photo-restore",
    hosted: "https://old-photo-restore.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/OldPhoto.png"
  },
  {
    id: "aitryon",
    name: "AITryOn",
    description: "Virtual fitting room for fashion brands. Fit garments onto any person photo with AI.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-tryon",
    hosted: "https://ai-tryon-smoky.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AITryOn.png"
  },
  {
    id: "ai-professional-makeup-generator",
    name: "AI Professional Makeup Generator",
    description: "Try on hundreds of professional makeup looks virtually before buying.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-professional-makeup-generator",
    hosted: "https://ai-professional-makeup-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Professional_Makeup_Generator.webp"
  },
  {
    id: "ai-group-photo",
    name: "AI Group Photo",
    description: "Seamlessly combine individual portraits into a high-fidelity group photo.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-group-photo",
    hosted: "https://ai-group-photo-mocha.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Group_Photo.webp"
  },
  {
    id: "ai-tattoo-try-on",
    name: "AI Tattoo Try-On",
    description: "Visualize tattoos on your body before getting inked with photorealistic AI.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-tattoo-try-on",
    hosted: "https://ai-tattoo-try-on.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Tattoo_Try_On.webp"
  },
  {
    id: "ai-hair-style-simulator",
    name: "AI Hair Style Simulator",
    description: "Try on new haircuts and colors with zero commitment using AI.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-hair-style-simulator",
    hosted: "https://ai-hair-style-simulator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Hair_Style_Simulator.webp"
  },
  {
    id: "ai-kids-to-adult-prediction",
    name: "AI Kids-to-Adult Prediction",
    description: "Visualize how a child will look as an adult with high-fidelity age progression.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-kid-to-adult-prediction",
    hosted: "https://ai-kid-to-adult-prediction.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Kids_to_Adult_Prediction.webp"
  },
  {
    id: "ai-room-declutter",
    name: "AI Room Declutter",
    description: "Instantly clean up messy room photos for listings and virtual staging.",
    category: "Real Estate",
    repo: "https://github.com/deangilmoreremix/ai-room-declutter",
    hosted: "https://ai-room-declutter.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Room_Declutter.webp"
  },
  {
    id: "ai-fitness-body-simulator",
    name: "AI Fitness Body Simulator",
    description: "Visualize your fitness goals on your own body with photorealistic AI transformation.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-fitness-body-simulator",
    hosted: "https://ai-fitness-body-simulator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Fitness_Body_Simulator.webp"
  },
  {
    id: "ai-pet-portrait",
    name: "AI Pet Portrait",
    description: "Transform pet photos into oil paintings, royal portraits, and art masterpieces.",
    category: "Lifestyle",
    repo: "https://github.com/deangilmoreremix/ai-pet-portrait",
    hosted: "https://ai-pet-portrait.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Pet_Portrait.webp"
  },
  {
    id: "ai-kissing-video-generator",
    name: "AI Kissing Video Generator",
    description: "Merge two portrait photos into a romantic AI kissing video with multi-model support.",
    category: "Video",
    repo: "https://github.com/deangilmoreremix/ai-kissing-video-generator",
    hosted: "https://ai-kissing-video-generator-amber.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Kissing_Video_Generator.webp"
  },
  {
    id: "ai-travel-studio",
    name: "AI Travel Studio",
    description: "Place yourself into iconic travel destinations worldwide with photorealistic AI.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-travel-studio",
    hosted: "https://ai-travel-studio.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Travel_Studio.png"
  },
  {
    id: "prompt-architect",
    name: "Prompt Architect",
    description: "Refine and optimize complex prompts for high-tier AI models with conversational refinement.",
    category: "Productivity",
    repo: "https://github.com/deangilmoreremix/prompt-architect",
    hosted: "https://prompt-architect-one-nu.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Prompt_Architect.webp"
  },
  {
    id: "clearmark-ai",
    name: "ClearMark AI",
    description: "Remove watermarks, logos, stamps, and text overlays from images in seconds.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/clearmark-ai",
    hosted: "https://clearmark-ai.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/ClearMark_AI.webp"
  },
  {
    id: "ai-wedding-photo",
    name: "AI Wedding Photo",
    description: "Generate dreamy, photorealistic wedding photos from any portrait with scene templates.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-wedding-photo",
    hosted: "https://ai-wedding-photo.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Wedding_Photo.png"
  },
  {
    id: "social-post",
    name: "Social Post",
    description: "AI social media post generator with live platform mockups for LinkedIn, X, Instagram, and more.",
    category: "Marketing",
    repo: "https://github.com/deangilmoreremix/social-post",
    hosted: "https://social-post-woad.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/Social_Post.webp"
  },
  {
    id: "magicself-ai",
    name: "MagicSelf AI",
    description: "Transform any selfie into oil paintings, watercolors, anime, and digital art.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/magicself-ai",
    hosted: "https://magicself-ai.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/MagicSelf_AI.webp"
  },
  {
    id: "ai-resume-builder",
    name: "AI Resume Builder",
    description: "Generate professional, ATS-optimized resumes with AI in seconds.",
    category: "Productivity",
    repo: null,
    hosted: "https://ai-resume-builder.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Resume_Builder.webp"
  },
  {
    id: "geo-checker",
    name: "GEO Checker",
    description: "Audit landing page AI search visibility and citation potential for ChatGPT, Perplexity, and Gemini.",
    category: "Business",
    repo: "https://github.com/deangilmoreremix/geo-checker",
    hosted: "https://geo-checker-silk.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/GEO_Checker.webp"
  },
  {
    id: "ai-character-studio",
    name: "AI Character Studio",
    description: "Create custom AI character portraits and engage in interactive conversational personas.",
    category: "Creative",
    repo: "https://github.com/deangilmoreremix/ai-character-studio",
    hosted: "https://ai-character-studio-beta.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Character_Studio.webp"
  }
];

const CATEGORIES = ["All", ...Array.from(new Set(APPS.map(app => app.category)))];

/**
 * Customer-facing deployment documentation. Every card's "Deployment Guide"
 * action deep-links to this page, so the URL is defined once here and reused
 * by the Reseller Deployment Center anchors.
 */
export const RESELLER_DEPLOYMENT_URL = "/reseller/deployment";

/** Deep link into the Deployment Center for one app's instructions. */
export function deploymentGuideUrl(appId) {
  return `${RESELLER_DEPLOYMENT_URL}#app-${appId}`;
}

/**
 * Vercel's official project-import flow for a public GitHub repository. Only
 * ever built from an app's real source URL — no destination is invented, and
 * apps without a documented repo get no button.
 */
export function vercelImportUrl(repo) {
  if (!repo || !/^https:\/\/github\.com\//.test(repo)) return null;
  return `https://vercel.com/new/import?repository-url=${encodeURIComponent(repo)}`;
}

/** Single source of truth for the reseller app catalog (also used by the docs page). */
export const RESELLER_APPS = APPS;

function redirectToUrl(url) {
  if (typeof window === "undefined" || !url) return;
  try {
    if (typeof window.location?.assign === "function") {
      window.location.assign(url);
    } else {
      window.location.href = url;
    }
  } catch {
    // Navigation can throw in sandboxed contexts (jsdom, embedded webviews).
    try {
      window.location.href = url;
    } catch {
      /* nowhere left to navigate — leave the status message on screen */
    }
  }
}

/**
 * Map a raw app category to its i18n bundle key.
 *
 * Must produce camelCase keys ("Real Estate" -> "realEstate") because that is
 * the naming used by the `categories` block in both the en and zh bundles.
 * Lowercasing and stripping whitespace ("realestate") silently misses those
 * keys, so the filter button falls back to raw English even under `zh`.
 */
function categoryKey(category) {
  return category
    .toLowerCase()
    .replace(/\s+(\w)/g, (_, chr) => chr.toUpperCase());
}

/** Localized label for a raw app category, falling back to the raw value. */
function categoryLabel(category, copy) {
  return copy.categories[categoryKey(category)] || category;
}

export default function AppsStudio({ locale = "en" }) {
  const copy = resolveCopy(en, zh, locale);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [failedImages, setFailedImages] = useState(new Set());
  // Thumbnails are hotlinked from a CDN, so each one resolves asynchronously;
  // track which have loaded so the skeleton can be replaced by the image.
  const [loadedImages, setLoadedImages] = useState(new Set());
  // Marketplace purchase state per key: "diy", "training", "upgrade".
  // Every status is rendered inline on the package card, so a failed or
  // pending endpoint never leaves the gallery without feedback.
  const [purchase, setPurchase] = useState({});

  const setPurchaseStatus = useCallback((key, status) => {
    setPurchase((prev) => ({ ...prev, [key]: { ...prev[key], ...status } }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Read a JSON error/status body without throwing on non-JSON responses
  // (a missing API route answers with HTML, an aborted body with nothing).
  const readJsonSafely = useCallback(async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }, []);

  const isRedirectableUrl = (url) => typeof url === "string" && /^https:\/\//.test(url);

  /**
   * POST /api/reseller/checkout { package } and hand the browser to the
   * Stripe-hosted session URL the route returns.
   *
   * A 503/RESELLER_STRIPE_NOT_CONFIGURED answer keeps the CTA disabled and
   * explains that Stripe configuration is pending, so the marketplace never
   * fakes a checkout. Any other failure (including an endpoint that does not
   * exist yet) only shows a retryable message — the page keeps rendering.
   */
  const startCheckout = useCallback(async (packageKey) => {
    const current = purchase[packageKey];
    if (current && (current.status === "pending" || current.status === "redirecting" || current.status === "unavailable")) {
      return;
    }
    setPurchaseStatus(packageKey, { status: "pending", message: "", missing: [] });
    try {
      const res = await fetch("/api/reseller/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ package: packageKey }),
      });
      if (res.status === 503) {
        const data = await readJsonSafely(res);
        setPurchaseStatus(packageKey, {
          status: "unavailable",
          missing: Array.isArray(data?.missing) ? data.missing : [],
        });
        return;
      }
      if (!res.ok) {
        const data = await readJsonSafely(res);
        setPurchaseStatus(packageKey, { status: "error", message: data?.error || copy.packages.checkoutError });
        return;
      }
      const data = await readJsonSafely(res);
      if (!isRedirectableUrl(data?.url)) {
        setPurchaseStatus(packageKey, { status: "error", message: copy.packages.checkoutError });
        return;
      }
      setPurchaseStatus(packageKey, { status: "redirecting" });
      redirectToUrl(data.url);
    } catch {
      setPurchaseStatus(packageKey, { status: "error", message: copy.packages.checkoutError });
    }
  }, [copy, purchase, readJsonSafely, setPurchaseStatus]);

  /**
   * POST /api/reseller/upgrade — the $400 path from DIY App Builder to
   * Apps + Training. The route answers 409 ALREADY_TRAINING, 402
   * UPGRADE_NOT_ELIGIBLE, or 503 while Stripe is unconfigured; each is
   * explained in plain language instead of surfacing a raw error code.
   */
  const startUpgrade = useCallback(async () => {
    const current = purchase.upgrade;
    if (current && (current.status === "pending" || current.status === "redirecting" || current.status === "unavailable")) {
      return;
    }
    setPurchaseStatus("upgrade", { status: "pending", message: "" });
    try {
      const res = await fetch("/api/reseller/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (res.status === 503) {
        setPurchaseStatus("upgrade", { status: "unavailable" });
        return;
      }
      if (!res.ok) {
        // 409 ALREADY_TRAINING and 402 UPGRADE_NOT_ELIGIBLE are expected
        // answers with dedicated copy; any other failure is retryable.
        const data = await readJsonSafely(res);
        const code = String(data?.error || "");
        if (code === "ALREADY_TRAINING") {
          setPurchaseStatus("upgrade", { status: "already-training" });
        } else if (code === "UPGRADE_NOT_ELIGIBLE") {
          setPurchaseStatus("upgrade", { status: "not-eligible" });
        } else {
          setPurchaseStatus("upgrade", { status: "error", message: copy.packages.upgradeError });
        }
        return;
      }
      const data = await readJsonSafely(res);
      if (!isRedirectableUrl(data?.url)) {
        setPurchaseStatus("upgrade", { status: "error", message: copy.packages.upgradeError });
        return;
      }
      setPurchaseStatus("upgrade", { status: "redirecting" });
      redirectToUrl(data.url);
    } catch {
      setPurchaseStatus("upgrade", { status: "error", message: copy.packages.upgradeError });
    }
  }, [copy, purchase.upgrade, readJsonSafely, setPurchaseStatus]);

  const filteredApps = useMemo(() => {
    const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
    return APPS.filter(app => {
      const localizedCategory = categoryLabel(app.category, copy);

      const matchesSearch = !normalizedQuery ||
        app.name.toLowerCase().includes(normalizedQuery) ||
        app.description.toLowerCase().includes(normalizedQuery) ||
        app.category.toLowerCase().includes(normalizedQuery) ||
        localizedCategory.toLowerCase().includes(normalizedQuery);

      const matchesCategory = selectedCategory === "All" || app.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchQuery, selectedCategory, copy]);

  return (
    <div className="w-full h-full flex flex-col items-center bg-app-bg relative overflow-hidden">
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-4 md:px-6 pt-10 md:pt-14">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="text-center space-y-5 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#22d3ee]">
              {copy.hero.badge}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.95]">
            <span className="block">{copy.hero.titleLine1}</span>
            <span className="block">{copy.hero.titleLine2}</span>
            <span className="block text-[#22d3ee]">{copy.hero.titleLine3}</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
            {copy.hero.subtitle}
          </p>
          <div className="pt-2">
            <a
              href={RESELLER_DEPLOYMENT_URL}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold text-white/80 transition-all hover:border-[#22d3ee]/40 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40"
            >
              <FaBook aria-hidden="true" focusable="false" className="text-[11px] text-[#22d3ee]" />
              {copy.hero.deploymentCenterCta}
            </a>
          </div>
        </header>

        {/* ── Reseller packages ────────────────────────────────────────── */}
        <section aria-labelledby="packages-heading" className="w-full max-w-5xl mx-auto pt-10 md:pt-14 space-y-5">
          <div className="text-center space-y-1.5">
            <h2 id="packages-heading" className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {copy.packages.heading}
            </h2>
            <p className="text-white/60 text-xs sm:text-sm font-medium">{copy.packages.subheading}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'diy', featured: false },
              { key: 'training', featured: true },
            ].map(({ key, featured }) => {
              const pkg = copy.packages[key];
              const state = purchase[key] || { status: 'idle' };
              const busy = state.status === 'pending' || state.status === 'redirecting';
              const locked = busy || state.status === 'unavailable';
              return (
                <article
                  key={key}
                  aria-labelledby={`package-${key}-name`}
                  className={`relative flex flex-col rounded-lg border bg-[#0a0a0a] p-6 transition-all duration-300 ${
                    featured
                      ? 'border-[#22d3ee]/40 shadow-xl shadow-[#22d3ee]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-2.5 left-6 inline-flex items-center rounded-full bg-[#22d3ee] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                      {copy.packages.recommended}
                    </span>
                  )}
                  <h3 id={`package-${key}-name`} className="text-sm font-black uppercase tracking-widest text-[#22d3ee]">
                    {pkg.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white">{pkg.price}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">{pkg.priceLabel}</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-white/60 leading-relaxed font-medium">{pkg.positioning}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {['feature1', 'feature2', 'feature3', 'feature4'].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-white/70 leading-relaxed">
                        <FaCheck
                          aria-hidden="true"
                          focusable="false"
                          className={`mt-0.5 shrink-0 text-[10px] ${featured ? 'text-[#22d3ee]' : 'text-white/40'}`}
                        />
                        <span>{pkg[f]}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 space-y-2.5">
                    {/* Purchases open the real Stripe-hosted checkout returned by
                        POST /api/reseller/checkout. Until Stripe is configured the
                        route answers 503 and this stays a disabled control rather
                        than a link, so nothing looks like a working fake checkout. */}
                    <button
                      type="button"
                      onClick={() => startCheckout(key)}
                      disabled={locked}
                      aria-disabled={locked ? 'true' : undefined}
                      data-package={key}
                      data-status={state.status}
                      className={`w-full rounded-full px-6 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                        featured
                          ? 'bg-[#22d3ee] text-black'
                          : 'bg-white/5 text-white/60 border border-white/10'
                      } ${
                        locked
                          ? ''
                          : 'hover:opacity-95 active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40'
                      }`}
                    >
                      {busy ? copy.packages.redirecting : pkg.cta}
                    </button>
                    {state.status === 'unavailable' && (
                      <div role="status" className="space-y-1">
                        <p className="text-[11px] text-amber-300/90 font-medium leading-relaxed">
                          {copy.packages.checkoutPending}
                        </p>
                        {Array.isArray(state.missing) && state.missing.length > 0 && (
                          <p className="text-[11px] text-white/50 font-medium leading-relaxed">
                            {copy.packages.checkoutPendingMissing.replace('{missing}', state.missing.join(', '))}
                          </p>
                        )}
                      </div>
                    )}
                    {state.status === 'error' && state.message && (
                      <p role="alert" className="text-[11px] text-red-400 font-medium leading-relaxed">
                        {state.message}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── $400 upgrade path ─────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-center text-xs text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
              {copy.packages.upgrade}
            </p>
            {(() => {
              const state = purchase.upgrade || { status: 'idle' };
              const busy = state.status === 'pending' || state.status === 'redirecting';
              const locked = busy || state.status === 'unavailable';
              return (
                <>
                  <button
                    type="button"
                    onClick={startUpgrade}
                    disabled={locked}
                    aria-disabled={locked ? 'true' : undefined}
                    data-package="upgrade"
                    data-status={state.status}
                    className={`rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-6 py-2.5 text-xs font-bold text-[#22d3ee] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      locked ? '' : 'hover:bg-[#22d3ee]/20 active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40'
                    }`}
                  >
                    {busy ? copy.packages.redirecting : copy.packages.upgradeCta}
                  </button>
                  {state.status === 'unavailable' && (
                    <p role="status" className="text-center text-[11px] text-amber-300/90 font-medium leading-relaxed max-w-2xl">
                      {copy.packages.checkoutPending}
                    </p>
                  )}
                  {state.status === 'already-training' && (
                    <p role="status" className="text-center text-[11px] text-white/60 font-medium leading-relaxed max-w-2xl">
                      {copy.packages.upgradeAlreadyTraining}
                    </p>
                  )}
                  {state.status === 'not-eligible' && (
                    <p role="status" className="text-center text-[11px] text-white/60 font-medium leading-relaxed max-w-2xl">
                      {copy.packages.upgradeNotEligible}
                    </p>
                  )}
                  {state.status === 'error' && state.message && (
                    <p role="alert" className="text-center text-[11px] text-red-400 font-medium leading-relaxed max-w-2xl">
                      {state.message}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section aria-labelledby="steps-heading" className="w-full max-w-5xl mx-auto pt-10 md:pt-14 space-y-5">
          <div className="text-center space-y-1.5">
            <h2 id="steps-heading" className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {copy.steps.heading}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'step1', num: '01' },
              { id: 'step2', num: '02' },
              { id: 'step3', num: '03' },
            ].map((step) => (
              <div
                key={step.id}
                className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-lg p-6 flex flex-col gap-3 transition-all duration-300 hover:border-[#22d3ee]/20 hover:bg-white/[0.04]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/40 to-transparent" aria-hidden="true" />
                <span className="text-3xl md:text-4xl font-black tracking-tighter text-[#22d3ee]/70 leading-none">
                  Step {step.num}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">{copy.steps[step.id].title}</h3>
                <p className="text-xs text-white/60 leading-relaxed font-medium">{copy.steps[step.id].description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Search + filters ─────────────────────────────────────────── */}
        <nav aria-label={copy.filter.label} className="w-full max-w-3xl mx-auto pt-10 md:pt-14 space-y-4">
          <div className="relative">
            <FaSearch aria-hidden="true" focusable="false" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
            <label htmlFor="search-apps" className="sr-only">
              {copy.search.placeholder}
            </label>
            <input
              id="search-apps"
              type="text"
              placeholder={copy.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus-visible:border-[#22d3ee] focus-visible:ring-1 focus-visible:ring-[#22d3ee]/30 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={copy.filter.label}>
            {CATEGORIES.map(category => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40 ${
                    isActive
                      ? 'bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/30'
                      : 'bg-white/[0.02] text-white/50 border-white/[0.04] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isActive && <FaCheck aria-hidden="true" focusable="false" className="inline mr-1.5 text-[9px]" />}
                  {categoryLabel(category, copy)}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Application gallery ──────────────────────────────────────── */}
        <section aria-labelledby="gallery-heading" className="w-full pt-10 md:pt-14 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="space-y-1">
              <h2 id="gallery-heading" className="text-lg sm:text-xl font-black text-white tracking-tight">
                {copy.gallery.heading}
              </h2>
              <p className="text-xs text-white/60 font-medium tracking-wide">{copy.gallery.subheading}</p>
            </div>
            <p role="status" aria-live="polite" className="text-xs text-white/60 font-medium tracking-wide">
              {copy.filter.results
                .replace('{count}', String(filteredApps.length))
                .replace('{total}', String(APPS.length))}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {filteredApps.map(app => (
              <article
                key={app.id}
                className="group bg-[#0a0a0a] border border-white/10 rounded-lg flex flex-col overflow-hidden transition-all duration-300 hover:border-[#22d3ee]/40 hover:shadow-xl hover:shadow-[#22d3ee]/10 hover:-translate-y-1"
              >
                {/* Thumbnail — consistent 16:10 aspect at every breakpoint */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                  {app.hosted && (
                    <a
                      href={app.hosted}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open live demo for ${app.name}`}
                      className="absolute inset-0 z-10 rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee]"
                    />
                  )}
                  {app.thumbnail && !failedImages.has(app.id) ? (
                    <img
                      src={app.thumbnail}
                      alt={`${app.name} preview`}
                      width={320}
                      height={200}
                      loading="lazy"
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      ref={(el) => {
                        // Cached (or above-the-fold lazy) images can fire
                        // load/error BEFORE React attaches the handlers —
                        // the pre-hydration race that left the skeleton
                        // spinning forever. Resolve their state from the
                        // element synchronously. No-op while still loading;
                        // onLoad/onError cover the normal path.
                        if (!el || !el.complete) return;
                        if (el.naturalWidth > 0) {
                          setLoadedImages(prev =>
                            prev.has(app.id) ? prev : new Set(prev).add(app.id)
                          );
                        } else {
                          setFailedImages(prev =>
                            prev.has(app.id) ? prev : new Set(prev).add(app.id)
                          );
                        }
                      }}
                      className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
                        loadedImages.has(app.id) ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => {
                        setLoadedImages(prev => {
                          const next = new Set(prev);
                          next.add(app.id);
                          return next;
                        });
                      }}
                      onError={() => {
                        setFailedImages(prev => {
                          const next = new Set(prev);
                          next.add(app.id);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={copy.card.thumbnailFailed}
                      className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#22d3ee]/20 to-transparent"
                    >
                      <span className="text-5xl font-black text-white opacity-60 group-hover:opacity-80 transition-opacity">
                        {app.name?.[0] || '?'}
                      </span>
                    </div>
                  )}

                  {/* Real loading skeleton: CDN thumbnails fetch asynchronously */}
                  {app.thumbnail && !failedImages.has(app.id) && !loadedImages.has(app.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]" role="status">
                      <span
                        aria-hidden="true"
                        className="h-6 w-6 rounded-full border-2 border-white/10 border-t-[#22d3ee] animate-spin"
                      />
                      <span className="sr-only">{copy.card.thumbnailLoading}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-white tracking-tight mb-1" title={app.name}>
                      {app.name}
                    </h3>
                    <p className="text-[11px] text-white/60 font-bold uppercase tracking-widest mb-2">
                      {categoryLabel(app.category, copy)}
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">
                      {app.description}
                    </p>
                  </div>

                  {/* Actions, in order: live demo (primary, only when hosted),
                      deployment guide, source code, Vercel import. */}
                  <div className="flex flex-col gap-2 pt-1">
                    {app.hosted ? (
                      <a
                        href={app.hosted}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-[#22d3ee] px-4 py-2 text-xs font-bold text-black transition-all hover:opacity-95 active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40"
                      >
                        <FaExternalLinkAlt aria-hidden="true" focusable="false" className="text-[9px]" />
                        {copy.card.demo}
                      </a>
                    ) : null}
                    <a
                      href={deploymentGuideUrl(app.id)}
                      aria-label={copy.card.deploymentGuideLabel.replace('{app}', app.name)}
                      className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white border border-white/10 transition-all hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40"
                    >
                      <FaBook aria-hidden="true" focusable="false" className="text-[10px]" />
                      {copy.card.deploymentGuide}
                    </a>
                    {app.repo ? (
                      <a
                        href={app.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white border border-white/10 transition-all hover:bg-white/10 active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40"
                      >
                        <FaCode aria-hidden="true" focusable="false" className="text-[10px]" />
                        {copy.card.sourceCode}
                      </a>
                    ) : (
                      // No verified repository exists for this app, so the
                      // source action is an honest disabled control, not a
                      // dead link.
                      <span
                        aria-disabled="true"
                        title="Repository not yet published"
                        className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white/50 border border-white/10"
                      >
                        <FaCode aria-hidden="true" focusable="false" className="text-[10px]" />
                        {copy.card.sourceCode}
                      </span>
                    )}
                    {/* Vercel import uses the real source repository as the
                        destination, so nothing is invented for apps that do
                        not have a documented repo. */}
                    {vercelImportUrl(app.repo) && (
                      <a
                        href={vercelImportUrl(app.repo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full bg-transparent px-4 py-2 text-xs font-bold text-white/50 border border-white/10 transition-all hover:border-[#22d3ee]/30 hover:text-white active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40"
                      >
                        <FaRocket aria-hidden="true" focusable="false" className="text-[10px]" />
                        {copy.card.vercelDeploy}
                      </a>
                    )}
                  </div>
                </div>

                {/* GitHub attribution stays reachable but is not the primary action */}
                <div className="border-t border-white/5 bg-black/40 px-5 py-3">
                  {app.repo ? (
                    <a
                      href={app.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${copy.card.github} — ${app.name}`}
                      className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-[#22d3ee] focus:outline-none focus-visible:text-[#22d3ee] focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40 rounded"
                    >
                      <FaGithub aria-hidden="true" focusable="false" className="text-sm" />
                      {copy.card.github}
                    </a>
                  ) : (
                    <span
                      aria-disabled="true"
                      title="Repository not yet published"
                      className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50 rounded"
                    >
                      <FaGithub aria-hidden="true" focusable="false" className="text-sm" />
                      {copy.card.github}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {filteredApps.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3" role="status">
            <FaSearch aria-hidden="true" focusable="false" className="text-secondary text-2xl" />
            <p className="text-white/60 text-sm font-medium">{copy.empty.noResults}</p>
          </div>
        )}
      </main>
    </div>
  );
}
