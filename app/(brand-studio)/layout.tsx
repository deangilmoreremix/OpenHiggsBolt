'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Camera, Plus, ArrowLeft, ChevronRight, Globe } from 'lucide-react';
import { semantic, appWrapper } from '@/shared/styles/designTokens';

/**
 * Brand Studio — one application, one shell.
 *
 * Open-Pomelli upstream is a single app with one flow: paste a URL → Brand DNA
 * → campaigns → assets → photo studio. Every Pomelli route (/brand-studio,
 * /brand/[id], /campaign/[id], /asset/[id]/edit, /photo-studio) lives inside
 * this layout, so they share one menu and read as one application instead of
 * separate apps.
 */

type Brand = {
  id: string;
  brand_name?: string;
  url?: string;
  industry?: string;
  primary_colors?: string;
};

function brandLabel(b: Brand) {
  return b.brand_name || b.url || 'Untitled brand';
}

export default function BrandStudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [assetCampaignId, setAssetCampaignId] = useState<string | null>(null);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);

  // Load the app's data once: brands (menu) + campaigns (brand resolution).
  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((json) => setBrands(json.data || []))
      .catch(() => {});
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((json) => setCampaigns(Array.isArray(json) ? json : []))
      .catch(() => {});
  }, []);

  // On /asset/[id]/edit, resolve the asset's campaign so the menu can
  // highlight the owning brand.
  useEffect(() => {
    const assetMatch = pathname.match(/^\/asset\/([^/]+)/);
    if (!assetMatch) {
      setAssetCampaignId(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/assets?id=${assetMatch[1]}`)
      .then((r) => r.json())
      .then((a) => {
        if (!cancelled && a && !a.error) setAssetCampaignId(a.campaign_id || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Derive the active brand from the current route.
  useEffect(() => {
    if (pathname === '/brand-studio' || pathname === '/photo-studio') {
      setActiveBrandId(null);
      return;
    }
    const brandMatch = pathname.match(/^\/brand\/([^/]+)/);
    if (brandMatch) {
      setActiveBrandId(brandMatch[1]);
      return;
    }
    const campaignMatch = pathname.match(/^\/campaign\/([^/]+)/);
    if (campaignMatch) {
      const campaign = campaigns.find((c) => c.id === campaignMatch[1]);
      setActiveBrandId(campaign?.brand_id || null);
      return;
    }
    const assetMatch = pathname.match(/^\/asset\/([^/]+)/);
    if (assetMatch) {
      if (!assetCampaignId) return;
      const campaign = campaigns.find((c) => c.id === assetCampaignId);
      setActiveBrandId(campaign?.brand_id || null);
      return;
    }
    setActiveBrandId(null);
  }, [pathname, campaigns, assetCampaignId]);

  const isNewBrand = pathname === '/brand-studio';
  const isPhotoStudio = pathname === '/photo-studio';

  const menu = (
    <div className="flex flex-col gap-6 p-4">
      {/* New brand — the app's entry flow */}
      <Link
        href="/brand-studio"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
        style={
          isNewBrand
            ? { background: 'rgba(34,211,238,0.15)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }
            : { background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.7)' }
        }
      >
        <Plus size={16} />
        New Brand
      </Link>

      {/* Brands — every brand's workspace inside this one app */}
      <div>
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: semantic.textMuted }}>
          Brands
        </p>
        {brands.length === 0 ? (
          <p className="px-3 text-xs leading-relaxed" style={{ color: semantic.textMuted }}>
            No brands yet. Paste a website URL to create your first Brand DNA.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {brands.map((b) => {
              const active = activeBrandId === b.id;
              return (
                <div key={b.id}>
                  <Link
                    href={`/brand/${b.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition"
                    style={
                      active
                        ? { background: 'rgba(34,211,238,0.12)', color: 'var(--color-primary)' }
                        : { color: 'rgba(255,255,255,0.6)' }
                    }
                  >
                    {b.primary_colors ? (
                      <span className="h-3 w-3 shrink-0 rounded-full border border-white/10" style={{ background: b.primary_colors.split(',')[0] }} />
                    ) : (
                      <Palette size={14} className="shrink-0" />
                    )}
                    <span className="truncate font-medium">{brandLabel(b)}</span>
                    <ChevronRight size={14} className="ml-auto shrink-0 opacity-40" />
                  </Link>
                  {active && (
                    <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l pl-3" style={{ borderColor: 'var(--border-color)' }}>
                      <Link
                        href={`/brand/${b.id}`}
                        className="rounded-md px-2 py-1.5 text-[13px] transition"
                        style={pathname === `/brand/${b.id}` ? { color: 'var(--color-primary)' } : { color: semantic.textSecondary }}
                      >
                        Brand DNA
                      </Link>
                      <Link
                        href={`/brand/${b.id}/campaigns/new`}
                        className="rounded-md px-2 py-1.5 text-[13px] transition"
                        style={pathname === `/brand/${b.id}/campaigns/new` ? { color: 'var(--color-primary)' } : { color: semantic.textSecondary }}
                      >
                        New Campaign
                      </Link>
                      <Link
                        href={`/photo-studio?brand_id=${b.id}`}
                        className="rounded-md px-2 py-1.5 text-[13px] transition"
                        style={{ color: semantic.textSecondary }}
                      >
                        Photo Studio
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tools */}
      <div>
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: semantic.textMuted }}>
          Tools
        </p>
        <Link
          href="/photo-studio"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition"
          style={isPhotoStudio ? { background: 'rgba(34,211,238,0.12)', color: 'var(--color-primary)' } : { color: 'rgba(255,255,255,0.6)' }}
        >
          <Camera size={16} className="shrink-0" />
          <span className="font-medium">Photo Studio</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden text-white" style={appWrapper}>
      {/* App header — one identity for the whole application */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6" style={{ borderColor: 'var(--border-color)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'var(--color-primary)' }}>
            <Palette size={18} color="black" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Brand Studio</span>
            <span className="hidden text-[10px] sm:block" style={{ color: semantic.textMuted }}>
              Brand DNA · Campaigns · Creatives · Photography
            </span>
          </div>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition hover:bg-white/10"
          style={{ borderColor: 'var(--border-color)', color: 'rgba(255,255,255,0.6)' }}
        >
          <ArrowLeft size={14} />
          SmartVideo GO
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* One side menu for the entire app (desktop) */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r md:block" style={{ borderColor: 'var(--border-color)' }}>
          {menu}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          {/* Compact app menu (mobile) */}
          <div className="flex gap-2 overflow-x-auto border-b p-3 md:hidden" style={{ borderColor: 'var(--border-color)' }}>
            <Link
              href="/brand-studio"
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={isNewBrand ? { background: 'rgba(34,211,238,0.15)', color: 'var(--color-primary)' } : { color: 'rgba(255,255,255,0.6)' }}
            >
              <Plus size={13} /> New Brand
            </Link>
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/brand/${b.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={activeBrandId === b.id ? { background: 'rgba(34,211,238,0.15)', color: 'var(--color-primary)' } : { color: 'rgba(255,255,255,0.6)' }}
              >
                <Globe size={12} /> {brandLabel(b)}
              </Link>
            ))}
            <Link
              href="/photo-studio"
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={isPhotoStudio ? { background: 'rgba(34,211,238,0.15)', color: 'var(--color-primary)' } : { color: 'rgba(255,255,255,0.6)' }}
            >
              <Camera size={12} /> Photo Studio
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
