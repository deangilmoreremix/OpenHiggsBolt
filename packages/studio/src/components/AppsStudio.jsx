"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { FaGithub, FaExternalLinkAlt, FaSearch } from "react-icons/fa";
import en from "../messages/en/appsStudio.json";
import zh from "../messages/zh/appsStudio.json";
import { resolveCopy } from "../i18nUtils";

const APPS = [
  {
    id: "ai-headshot-studio",
    name: "AI Headshot Studio",
    description: "Professional AI headshot generator for LinkedIn, team portraits, and personal branding.",
    category: "Image",
    repo: "https://github.com/SamurAIGPT/ai-headshot-generator",
    hosted: "https://ai-headshot-generator-xi.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png"
  },
  {
    id: "nano-banana-studio",
    name: "Nano Banana Studio",
    description: "AI image generation platform with text-to-image and multi-image reference editing.",
    category: "Image",
    repo: "https://github.com/SamurAIGPT/nano-banana-generator",
    hosted: "https://nano-banana-generator-psi.vercel.app",
    thumbnail: "https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png"
  },
  {
    id: "seedance-v2-studio",
    name: "Seedance V2 Studio",
    description: "AI video generation workspace for Seedance 2.0 and Seedance 2 Mini text-to-video and image-to-video.",
    category: "Video",
    repo: "https://github.com/SamurAIGPT/seedance-2-generator",
    hosted: "https://seedance-2-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png"
  },
  {
    id: "ai-clipping-studio",
    name: "AI Clipping Studio",
    description: "AI-powered video clipping that extracts viral highlights from YouTube videos automatically.",
    category: "Video",
    repo: "https://github.com/SamurAIGPT/ai-clipping-generator",
    hosted: "https://ai-clipping-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png"
  },
  {
    id: "ai-youtube-shorts-generator",
    name: "AI YouTube Shorts Generator",
    description: "Turn long-form YouTube videos into viral 9:16 shorts with LLM highlight detection and auto vertical cropping.",
    category: "Video",
    repo: "https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator",
    thumbnail: "https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator/raw/main/assets/video-demo-thumb.png"
  },
  {
    id: "easyveo-studio",
    name: "EasyVeo Studio",
    description: "Complete Veo video generation suite for text-to-video, image-to-video, and reference-to-video.",
    category: "Video",
    repo: "https://github.com/SamurAIGPT/veo4-video-generator",
    hosted: "https://veo4-video-generator.vercel.app/",
    thumbnail: "https://cdn.muapi.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png"
  },
  {
    id: "pet-product-studio",
    name: "Pet Product Studio",
    description: "AI pet product ad generator that places pet products into stunning lifestyle scenes.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/pet-product-studio",
    thumbnail: "https://cdn.muapi.ai/apps/Pet_Product_Studio.jpg"
  },
  {
    id: "resale-photo-enhancer",
    name: "Resale Photo Enhancer",
    description: "AI product photo studio for resellers. Swap backgrounds and enhance listing photos.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/resale-photo-enhancer",
    thumbnail: "https://cdn.muapi.ai/apps/Resale_Photo_Enhancer.png"
  },
  {
    id: "blogger-cms",
    name: "Blogger CMS",
    description: "AI-powered blog writer and SEO content management system with rich text editor.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/blogger-cms",
    thumbnail: "https://cdn.muapi.ai/apps/Blogger_CMS.png"
  },
  {
    id: "amazon-product-studio",
    name: "Amazon Product Studio",
    description: "AI product photography studio for Amazon sellers with multi-image reference and scene presets.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/amazon-product-studio",
    thumbnail: "https://cdn.muapi.ai/apps/Amazon_Product_Studio.webp"
  },
  {
    id: "ai-business-card",
    name: "AI Business Card",
    description: "AI digital business card generator with QR sharing, templates, and visitor chatbot.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/ai-business-card",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Business_Card.webp"
  },
  {
    id: "mailwise",
    name: "MailWise",
    description: "AI email composer and cold outreach assistant with template presets and tone controls.",
    category: "Productivity",
    repo: "https://github.com/SamurAIGPT/mail-wise",
    thumbnail: "https://cdn.muapi.ai/apps/MailWise.png"
  },
  {
    id: "my-podcast",
    name: "My Podcast",
    description: "AI voiceover and podcast narration studio with fine-grained voice controls.",
    category: "Audio",
    repo: "https://github.com/SamurAIGPT/my-podcast",
    thumbnail: "https://cdn.muapi.ai/apps/My_Podcast.webp"
  },
  {
    id: "ai-knowledge-base",
    name: "AI Knowledge Base",
    description: "Custom AI knowledge base and chatbot builder with RAG, document upload, and embeddable widgets.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/ai-knowledge-base",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Knowledge_Base.png"
  },
  {
    id: "ai-royal-portrait",
    name: "AI Royal Portrait",
    description: "Transform photos into 18th-century royal oil paintings and artistic portrait styles.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-royal-portrait",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Royal_Portrait.png"
  },
  {
    id: "ai-meme",
    name: "AI MEME",
    description: "Viral-ready meme generation based on trending topics with multi-model AI support.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-meme-generator",
    thumbnail: "https://cdn.muapi.ai/apps/AI_MEME.png"
  },
  {
    id: "ai-real-estate-stager",
    name: "AI Real Estate Stager",
    description: "Virtually furnish and stage empty homes for sale with photorealistic AI staging.",
    category: "Real Estate",
    repo: "https://github.com/SamurAIGPT/ai-real-estate-stager",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Real_Estate_Stager.webp"
  },
  {
    id: "ai-logo",
    name: "AI Logo",
    description: "Dynamic brand identity and logo generator with text-to-logo and sketch-to-logo modes.",
    category: "Design",
    repo: "https://github.com/SamurAIGPT/ai-logo-studio",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Logo.png"
  },
  {
    id: "oldphoto",
    name: "OldPhoto",
    description: "Restore, colorize, and sharpen vintage family photos with AI.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/old-photo-restore",
    thumbnail: "https://cdn.muapi.ai/apps/OldPhoto.png"
  },
  {
    id: "aitryon",
    name: "AITryOn",
    description: "Virtual fitting room for fashion brands. Fit garments onto any person photo with AI.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-tryon",
    thumbnail: "https://cdn.muapi.ai/apps/AITryOn.png"
  },
  {
    id: "ai-professional-makeup-generator",
    name: "AI Professional Makeup Generator",
    description: "Try on hundreds of professional makeup looks virtually before buying.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-professional-makeup-generator",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Professional_Makeup_Generator.webp"
  },
  {
    id: "ai-group-photo",
    name: "AI Group Photo",
    description: "Seamlessly combine individual portraits into a high-fidelity group photo.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-group-photo",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Group_Photo.webp"
  },
  {
    id: "ai-tattoo-try-on",
    name: "AI Tattoo Try-On",
    description: "Visualize tattoos on your body before getting inked with photorealistic AI.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-tattoo-try-on",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Tattoo_Try_On.webp"
  },
  {
    id: "ai-hair-style-simulator",
    name: "AI Hair Style Simulator",
    description: "Try on new haircuts and colors with zero commitment using AI.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-hair-style-simulator",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Hair_Style_Simulator.webp"
  },
  {
    id: "ai-kids-to-adult-prediction",
    name: "AI Kids-to-Adult Prediction",
    description: "Visualize how a child will look as an adult with high-fidelity age progression.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-kid-to-adult-prediction",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Kids_to_Adult_Prediction.webp"
  },
  {
    id: "ai-room-declutter",
    name: "AI Room Declutter",
    description: "Instantly clean up messy room photos for listings and virtual staging.",
    category: "Real Estate",
    repo: "https://github.com/SamurAIGPT/ai-room-declutter",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Room_Declutter.webp"
  },
  {
    id: "ai-fitness-body-simulator",
    name: "AI Fitness Body Simulator",
    description: "Visualize your fitness goals on your own body with photorealistic AI transformation.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-fitness-body-simulator",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Fitness_Body_Simulator.webp"
  },
  {
    id: "ai-pet-portrait",
    name: "AI Pet Portrait",
    description: "Transform pet photos into oil paintings, royal portraits, and art masterpieces.",
    category: "Lifestyle",
    repo: "https://github.com/SamurAIGPT/ai-pet-portrait",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Pet_Portrait.webp"
  },
  {
    id: "ai-kissing-video-generator",
    name: "AI Kissing Video Generator",
    description: "Merge two portrait photos into a romantic AI kissing video with multi-model support.",
    category: "Video",
    repo: "https://github.com/SamurAIGPT/ai-kissing-video-generator",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Kissing_Video_Generator.webp"
  },
  {
    id: "ai-travel-studio",
    name: "AI Travel Studio",
    description: "Place yourself into iconic travel destinations worldwide with photorealistic AI.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-travel-studio",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Travel_Studio.png"
  },
  {
    id: "prompt-architect",
    name: "Prompt Architect",
    description: "Refine and optimize complex prompts for high-tier AI models with conversational refinement.",
    category: "Productivity",
    repo: "https://github.com/SamurAIGPT/prompt-architect",
    thumbnail: "https://cdn.muapi.ai/apps/Prompt_Architect.webp"
  },
  {
    id: "clearmark-ai",
    name: "ClearMark AI",
    description: "Remove watermarks, logos, stamps, and text overlays from images in seconds.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/clearmark-ai",
    thumbnail: "https://cdn.muapi.ai/apps/ClearMark_AI.webp"
  },
  {
    id: "ai-wedding-photo",
    name: "AI Wedding Photo",
    description: "Generate dreamy, photorealistic wedding photos from any portrait with scene templates.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-wedding-photo",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Wedding_Photo.png"
  },
  {
    id: "social-post",
    name: "Social Post",
    description: "AI social media post generator with live platform mockups for LinkedIn, X, Instagram, and more.",
    category: "Marketing",
    repo: "https://github.com/SamurAIGPT/social-post",
    thumbnail: "https://cdn.muapi.ai/apps/Social_Post.webp"
  },
  {
    id: "magicself-ai",
    name: "MagicSelf AI",
    description: "Transform any selfie into oil paintings, watercolors, anime, and digital art.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/magicself-ai",
    thumbnail: "https://cdn.muapi.ai/apps/MagicSelf_AI.webp"
  },
  {
    id: "ai-resume-builder",
    name: "AI Resume Builder",
    description: "Generate professional, ATS-optimized resumes with AI in seconds.",
    category: "Productivity",
    repo: "https://github.com/SamurAIGPT/ai-resume-builder",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Resume_Builder.webp"
  },
  {
    id: "geo-checker",
    name: "GEO Checker",
    description: "Audit landing page AI search visibility and citation potential for ChatGPT, Perplexity, and Gemini.",
    category: "Business",
    repo: "https://github.com/SamurAIGPT/geo-checker",
    thumbnail: "https://cdn.muapi.ai/apps/GEO_Checker.webp"
  },
  {
    id: "ai-character-studio",
    name: "AI Character Studio",
    description: "Create custom AI character portraits and engage in interactive conversational personas.",
    category: "Creative",
    repo: "https://github.com/SamurAIGPT/ai-character-studio",
    thumbnail: "https://cdn.muapi.ai/apps/AI_Character_Studio.webp"
  }
];

const CATEGORIES = ["All", ...Array.from(new Set(APPS.map(app => app.category)))];

function categoryKey(category) {
  return category.toLowerCase().replace(/\s+/g, '');
}

export default function AppsStudio({ locale = "en" }) {
  const copy = resolveCopy(en, zh, locale);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredApps = useMemo(() => {
    return APPS.filter(app => {
      const matchesSearch = !debouncedSearchQuery || 
        app.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || app.category.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [debouncedSearchQuery, selectedCategory]);

  return (
    <div className="h-full w-full flex flex-col items-center bg-[#030303] overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col gap-10 items-center w-full max-w-7xl pt-12 pb-24 px-6">
        
        {/* Marketing Header */}
        <div className="text-center space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#22d3ee]">
              {copy.hero.badge}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95]">
            <span className="block">{copy.hero.titleLine1}</span>
            <span className="block text-[#22d3ee]">{copy.hero.titleLine2}</span>
          </h1>
          <p className="text-white/40 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto">
            {copy.hero.subtitle}
          </p>
        </div>

        {/* Steps Section */}
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "step1", num: "01" },
              { id: "step2", num: "02" },
              { id: "step3", num: "03" },
            ].map((step) => (
              <div
                key={step.id}
                className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 hover:border-[#22d3ee]/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-1"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/40 to-transparent" />
                <span className="text-3xl md:text-4xl font-black tracking-tighter text-[#22d3ee]/50 leading-none">
                  Step {step.num}
                </span>
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                  {copy.steps[step.id].title}
                </h2>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  {copy.steps[step.id].description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="w-full max-w-3xl space-y-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <label htmlFor="search-apps" className="sr-only">
              {copy.search.placeholder}
            </label>
            <input
              id="search-apps"
              type="text"
              placeholder={copy.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategory === category
                    ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20'
                    : 'bg-white/5 text-white/50 border border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                {copy.categories[categoryKey(category)] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {filteredApps.map((app, index) => (
            <div 
              key={app.id}
              className="group bg-[#0a0a0a] border border-white/5 rounded-lg flex flex-col overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-[#0f0f0f] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
            >
              {/* Thumbnail Section */}
              <div className="relative h-44 w-full overflow-hidden bg-white/5">
                {app.thumbnail && !failedImages.has(app.name) ? (
                  <img
                    src={app.thumbnail}
                    alt={app.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => {
                    setFailedImages(prev => {
                      const next = new Set(prev);
                      next.add(app.name);
                      return next;
                    });
                  }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-indigo-600/20 transition-colors">
                    <div className="text-4xl opacity-20 text-white group-hover:opacity-40 transition-opacity">
                      {app.name?.[0] || '?'}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              </div>

              {/* Content Section */}
              <div className="p-5 flex flex-col flex-1 space-y-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-1 truncate">{app.name}</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">{app.category}</p>
                  <p className="text-xs text-white/50 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]">{app.description}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={app.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                  >
                    <FaGithub className="text-xs" />
                    {copy.card.github}
                  </a>
                  {app.hosted && (
                    <a
                      href={app.hosted}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-[#22d3ee]/10 text-[#22d3ee] rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#22d3ee]/20 transition-all border border-[#22d3ee]/20 active:scale-95"
                    >
                      <FaExternalLinkAlt className="text-[9px]" />
                      {copy.card.demo}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/30 text-sm font-medium">{copy.empty.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
