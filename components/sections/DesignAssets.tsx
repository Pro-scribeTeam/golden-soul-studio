"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";

const ASSET_TYPES = [
  { value: "social-media-banner", label: "Social Media Banner" },
  { value: "album-art-square", label: "Album Art Square" },
  { value: "press-kit-header", label: "Press Kit Header" },
  { value: "email-newsletter-header", label: "Email Newsletter Header" },
  { value: "story-background", label: "Story Background" },
  { value: "merch-design", label: "Merch Design" },
  { value: "event-poster", label: "Event Poster" },
  { value: "youtube-thumbnail", label: "YouTube Thumbnail" },
  { value: "spotify-canvas-loop", label: "Spotify Canvas Loop" },
  { value: "twitter-header", label: "Twitter/X Header" },
  { value: "website-hero-banner", label: "Website Hero Banner" },
  { value: "business-card", label: "Business Card" },
  { value: "cd-vinyl-cover", label: "CD/Vinyl Cover Art" },
  { value: "epk-cover-page", label: "EPK Cover Page" },
];

const BACKGROUND_STYLES = [
  { value: "#0A0A0F", label: "Deep Black #0A0A0F" },
  { value: "golden-gradient", label: "Golden Gradient" },
  { value: "#F5F0E8", label: "Ivory Clean #F5F0E8" },
  { value: "#6BBFB5", label: "Mint Accent #6BBFB5" },
  { value: "cinematic-blur", label: "Cinematic Blur Background" },
  { value: "grain-texture-dark", label: "Grain Texture Dark" },
  { value: "custom-upload", label: "Custom Upload" },
  { value: "transparent-png", label: "Transparent PNG" },
];

const FORMATS = ["JPG", "PNG", "WebP", "SVG", "PDF"];

const BRAND_ELEMENTS = [
  { key: "logo", label: "Logo" },
  { key: "hatMark", label: "Hat Mark" },
  { key: "goldPalette", label: "Gold Palette" },
  { key: "fonts", label: "Fonts" },
  { key: "tagline", label: "Tagline" },
  { key: "pattern", label: "Pattern" },
] as const;

type BrandKey = (typeof BRAND_ELEMENTS)[number]["key"];

const ASSET_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "social-media-banner": { w: 1500, h: 500 },
  "album-art-square": { w: 3000, h: 3000 },
  "press-kit-header": { w: 2400, h: 800 },
  "email-newsletter-header": { w: 1200, h: 400 },
  "story-background": { w: 1080, h: 1920 },
  "merch-design": { w: 2000, h: 2000 },
  "event-poster": { w: 1080, h: 1620 },
  "youtube-thumbnail": { w: 1280, h: 720 },
  "spotify-canvas-loop": { w: 720, h: 1280 },
  "twitter-header": { w: 1500, h: 500 },
  "website-hero-banner": { w: 2560, h: 1440 },
  "business-card": { w: 1050, h: 600 },
  "cd-vinyl-cover": { w: 3000, h: 3000 },
  "epk-cover-page": { w: 2480, h: 3508 },
};

export default function DesignAssets() {
  const [assetType, setAssetType] = useState("album-art-square");
  const [brandElements, setBrandElements] = useState<Record<BrandKey, boolean>>({
    logo: true, hatMark: true, goldPalette: true, fonts: true, tagline: true, pattern: true,
  });
  const [background, setBackground] = useState("#0A0A0F");
  const [format, setFormat] = useState("PNG");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleBrand = (key: BrandKey) => {
    setBrandElements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    const dims = ASSET_DIMENSIONS[assetType] || { w: 1024, h: 1024 };
    const enabledElements = Object.entries(brandElements)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");

    const fullPrompt = `Professional design asset: ${assetType.replace(/-/g, " ")} for Jeff M Dixon R&B artist. ${
      prompt ? prompt + ". " : ""
    }Brand elements: ${enabledElements}. Color scheme: gold #C9A84C on deep black #0A0A0F, ivory accents. Style: luxury, soulful, sophisticated. Background: ${background}.`;

    try {
      const res = await fetch("/api/wavespeed/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "wavespeed-ai/flux-dev",
          prompt: fullPrompt,
          resolution: dims.w >= 2048 ? "2048px" : "1024px",
          variations: 1,
          styleIntensity: 70,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProgress(30);
      let attempts = 0;
      while (attempts < 40) {
        await new Promise((r) => setTimeout(r, 2500));
        attempts++;
        setProgress(30 + Math.min(65, attempts * (65 / 40)));
        const statusRes = await fetch(`/api/wavespeed/status/${data.requestId}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult(statusData.outputs?.[0] || "");
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "design",
              model: "FLUX.2",
              prompt: fullPrompt,
              settings: { assetType, background, format, brandElements },
              output_url: statusData.outputs?.[0],
            }),
          });
          break;
        }
        if (statusData.status === "failed") throw new Error("Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const dims = ASSET_DIMENSIONS[assetType] || { w: 1024, h: 1024 };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Design Assets</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Generate brand-consistent design assets for Jeff M Dixon
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GoldDropdown label="Asset Type" value={assetType} options={ASSET_TYPES} onChange={setAssetType} />

          {/* Dimensions preview */}
          <div className="bg-[#C9A84C0D] border border-[#C9A84C22] rounded-lg p-3 flex items-center gap-3">
            <div className="text-[#C9A84C]">
              <p className="text-xs font-body font-semibold">Dimensions</p>
              <p className="text-sm font-body">{dims.w} × {dims.h}px</p>
            </div>
          </div>

          {/* Brand elements toggles */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Brand Elements</label>
            <div className="flex flex-wrap gap-2">
              {BRAND_ELEMENTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleBrand(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all border ${
                    brandElements[key]
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {brandElements[key] ? "✓" : "○"} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Additional Details (optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Any specific details for this asset..."
              rows={3}
              className="w-full px-4 py-3 resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <GoldDropdown label="Background Style" value={background} options={BACKGROUND_STYLES} onChange={setBackground} />

          {/* Format buttons */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Export Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-body font-medium transition-all border ${
                    format === f
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
            {loading ? "Generating..." : "✏️ Generate Asset"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing progress={progress} label="Generating design asset..." />
        </div>
      )}

      {result && !loading && (
        <OutputCard
          outputUrl={result}
          model="FLUX.2"
          section="Design Assets"
          prompt={prompt || assetType}
          settings={{ assetType, background, format }}
          onRegenerate={generate}
          isVideo={false}
        />
      )}
    </div>
  );
}
