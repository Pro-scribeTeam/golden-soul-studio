"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { Check, X } from "lucide-react";

interface BrandPreset {
  id: string;
  name: string;
  tagline: string;
  colors: { name: string; hex: string }[];
  headingFont: string;
  bodyFont: string;
  description: string;
}

const BRAND_PRESETS: BrandPreset[] = [
  {
    id: "golden-soul",
    name: "Golden Soul",
    tagline: "Signature",
    colors: [
      { name: "Primary Gold", hex: "#C9A84C" },
      { name: "Deep Black", hex: "#0A0A0F" },
      { name: "Ivory", hex: "#F5F0E8" },
      { name: "Mint Accent", hex: "#6BBFB5" },
    ],
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
    description: "Gold dominant, deep black backgrounds, warm amber photography",
  },
  {
    id: "midnight-fedora",
    name: "Midnight Fedora",
    tagline: "Dark Luxury",
    colors: [
      { name: "Near Black", hex: "#0D0D14" },
      { name: "Gold Accent", hex: "#C9A84C" },
      { name: "Dark Steel", hex: "#1E1E2E" },
      { name: "Faint Ivory", hex: "#E8E3DB" },
    ],
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
    description: "Near-black palette, gold accents only, dramatic and mysterious",
  },
  {
    id: "ivory-gospel",
    name: "Ivory Gospel",
    tagline: "Light Elegant",
    colors: [
      { name: "Ivory", hex: "#F5F0E8" },
      { name: "Warm White", hex: "#FDFAF4" },
      { name: "Soft Gold", hex: "#D4B86A" },
      { name: "Charcoal", hex: "#2A2A2A" },
    ],
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
    description: "Ivory dominant, clean sophisticated, church meets fashion",
  },
  {
    id: "fresno-heritage",
    name: "Fresno Heritage",
    tagline: "Hometown",
    colors: [
      { name: "Warm Earth", hex: "#8B5E3C" },
      { name: "California Gold", hex: "#D4955A" },
      { name: "Dusty Sage", hex: "#7A8C6A" },
      { name: "Deep Brown", hex: "#3A2A1A" },
    ],
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
    description: "Warm earth California tones, community and culture, gold and rust",
  },
  {
    id: "soul-legend",
    name: "Soul Legend",
    tagline: "Timeless",
    colors: [
      { name: "Rich Brown", hex: "#5C3A1E" },
      { name: "Warm Gold", hex: "#B8953A" },
      { name: "Cream", hex: "#EDE0CB" },
      { name: "Deep Burgundy", hex: "#4A1A1A" },
    ],
    headingFont: "Cormorant Garamond",
    bodyFont: "Montserrat",
    description: "Classic Motown inspired, rich warm browns, vintage typography",
  },
];

const COMMITTED_KEY = "golden_soul_brand_preset";

export default function BrandPreview() {
  const [selectedPresetId, setSelectedPresetId] = useState("golden-soul");
  const [comparePresetId, setComparePresetId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [committedPreset, setCommittedPreset] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(COMMITTED_KEY) : null
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const preset = BRAND_PRESETS.find((p) => p.id === selectedPresetId)!;
  const comparePreset = comparePresetId ? BRAND_PRESETS.find((p) => p.id === comparePresetId) : null;

  const commit = () => {
    localStorage.setItem(COMMITTED_KEY, selectedPresetId);
    setCommittedPreset(selectedPresetId);
    setShowConfirm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  // Preset-specific card themes
  const getCardTheme = (p: BrandPreset) => {
    switch (p.id) {
      case "golden-soul":    return { bg: "#0A0A0F", accent: "#C9A84C", text: "#F5F0E8", sub: "#C9A84CAA", postBg: "#111118", gradient: "135deg, #C9A84C33, #0A0A0F" };
      case "midnight-fedora":return { bg: "#0D0D14", accent: "#C9A84C", text: "#E8E3DB", sub: "#C9A84C88", postBg: "#0A0A10", gradient: "135deg, #C9A84C22, #0D0D14" };
      case "ivory-gospel":   return { bg: "#FDFAF4", accent: "#D4B86A", text: "#2A2A2A", sub: "#2A2A2A99", postBg: "#F5F0E8", gradient: "135deg, #D4B86A22, #F5F0E8" };
      case "fresno-heritage":return { bg: "#3A2A1A", accent: "#D4955A", text: "#EDE0CB", sub: "#D4955AAA", postBg: "#2E1F0F", gradient: "135deg, #D4955A33, #3A2A1A" };
      case "soul-legend":    return { bg: "#2A1A0A", accent: "#B8953A", text: "#EDE0CB", sub: "#B8953AAA", postBg: "#1F1408", gradient: "135deg, #B8953A33, #2A1A0A" };
      default:               return { bg: p.colors[1]?.hex || "#0A0A0F", accent: p.colors[0]?.hex || "#C9A84C", text: p.colors[2]?.hex || "#F5F0E8", sub: (p.colors[2]?.hex || "#F5F0E8") + "99", postBg: "#111118", gradient: `135deg, ${p.colors[0]?.hex}22, ${p.colors[1]?.hex}` };
    }
  };

  const renderPreviewCard = (p: BrandPreset) => {
    const theme = getCardTheme(p);
    return (
    <div
      style={{
        background: theme.bg,
        border: `1px solid ${theme.accent}44`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Color palette swatches */}
      <div className="flex">
        {p.colors.map((c) => (
          <div key={c.hex} className="flex-1 h-8" style={{ background: c.hex }} title={c.name} />
        ))}
      </div>

      {/* Typography + mockups */}
      <div className="p-5 space-y-3">
        <h2 style={{ fontFamily: p.headingFont + ", serif", color: theme.accent, fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
          Jeff M Dixon
        </h2>
        <p style={{ fontFamily: p.headingFont + ", serif", color: theme.text, fontSize: 14, fontStyle: "italic" }}>
          &ldquo;Soul doesn&apos;t go out of style&rdquo;
        </p>
        <p style={{ fontFamily: p.bodyFont + ", sans-serif", color: theme.sub, fontSize: 11, lineHeight: 1.6 }}>
          Singer · Songwriter · Performer<br />Fresno, California
        </p>

        {/* Instagram post mockup */}
        <div style={{ background: theme.postBg, border: `1px solid ${theme.accent}33`, borderRadius: 8, padding: "12px", marginTop: 8 }}>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: theme.accent }} />
            <div>
              <p style={{ fontFamily: p.bodyFont, fontSize: 11, color: theme.text, fontWeight: 600 }}>@jeffmdixon</p>
              <p style={{ fontFamily: p.bodyFont, fontSize: 9, color: theme.sub }}>Just now</p>
            </div>
          </div>
          <div style={{ background: `linear-gradient(${theme.gradient})`, height: 90, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
            <span style={{ color: theme.accent, fontSize: 24 }}>🎩</span>
            <p style={{ fontFamily: p.headingFont + ", serif", color: theme.accent, fontSize: 11, fontWeight: 600 }}>Golden Soul</p>
          </div>
          <p style={{ fontFamily: p.bodyFont, fontSize: 10, color: theme.sub, marginTop: 8 }}>
            New music dropping soon. Stay tuned. ✨
          </p>
        </div>

        {/* Video thumbnail mockup */}
        <div style={{ background: `linear-gradient(to right, ${theme.postBg}, ${theme.bg})`, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: p.headingFont + ", serif", color: theme.accent, fontSize: 13, fontWeight: 700 }}>OFFICIAL MUSIC VIDEO</p>
            <p style={{ fontFamily: p.bodyFont, color: theme.text, fontSize: 10 }}>Jeff M Dixon</p>
          </div>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "#0A0A0F", marginLeft: 2 }}>▶</span>
          </div>
        </div>

        {/* Logo lockup */}
        <div className="flex items-center gap-2 pt-1">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎩</div>
          <div>
            <p style={{ fontFamily: p.headingFont + ", serif", color: theme.accent, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>Jeff M Dixon</p>
            <p style={{ fontFamily: p.bodyFont, color: theme.sub, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>Official</p>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Brand Preview</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1 max-w-2xl">
          Preview how Jeff&apos;s brand looks before committing. Try different presets, see live mockups, then lock in when you&apos;re ready.
          <span className="text-[#C9A84C99] ml-2">Nothing is committed until you click Commit to Brand.</span>
        </p>
      </div>

      {committedPreset && (
        <div className="bg-[#C9A84C0D] border border-[#C9A84C33] rounded-lg p-3 flex items-center gap-2">
          <Check size={14} className="text-[#C9A84C]" />
          <p className="text-sm font-body text-[#F5F0E8]">
            Current committed brand:{" "}
            <span className="text-[#C9A84C] font-semibold">
              {BRAND_PRESETS.find((p) => p.id === committedPreset)?.name || committedPreset}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset selector */}
        <div className="space-y-3">
          <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Brand Presets</label>
          {BRAND_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPresetId(p.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                selectedPresetId === p.id
                  ? "border-[#C9A84C] bg-[#C9A84C0D]"
                  : "border-[#C9A84C22] hover:border-[#C9A84C44] bg-[#111118]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {p.colors.slice(0, 4).map((c) => (
                  <div key={c.hex} className="w-4 h-4 rounded-full border border-[#ffffff11]" style={{ background: c.hex }} />
                ))}
              </div>
              <p className={`text-sm font-body font-semibold ${selectedPresetId === p.id ? "text-[#C9A84C]" : "text-[#F5F0E8]"}`}>
                {p.name}
              </p>
              <p className="text-xs text-[#F5F0E855] font-body">{p.tagline}</p>
            </button>
          ))}

          {/* Compare */}
          <div className="pt-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider block mb-2">
              Compare With
            </label>
            <select
              value={comparePresetId || ""}
              onChange={(e) => setComparePresetId(e.target.value || null)}
              className="w-full px-3 py-2"
            >
              <option value="">None</option>
              {BRAND_PRESETS.filter((p) => p.id !== selectedPresetId).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live preview */}
        <div className={`space-y-4 ${comparePreset ? "lg:col-span-1" : "lg:col-span-2"}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-xl text-[#C9A84C]">{preset.name}</h3>
            <span className="text-xs text-[#F5F0E855] font-body">{preset.description}</span>
          </div>

          {/* Hex codes */}
          <div className="flex gap-2 flex-wrap">
            {preset.colors.map((c) => (
              <div key={c.hex} className="flex items-center gap-1.5 bg-[#111118] border border-[#C9A84C22] rounded-lg px-3 py-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: c.hex }} />
                <span className="text-xs font-body text-[#F5F0E8AA]">{c.name}</span>
                <span className="text-xs font-mono text-[#C9A84C]">{c.hex}</span>
              </div>
            ))}
          </div>

          {renderPreviewCard(preset)}

          <GoldButton size="lg" onClick={() => setShowConfirm(true)} className="w-full">
            ✅ Commit to This Brand Preset
          </GoldButton>
        </div>

        {/* Compare preview */}
        {comparePreset && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-xl text-[#F5F0E8AA]">{comparePreset.name}</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {comparePreset.colors.map((c) => (
                <div key={c.hex} className="flex items-center gap-1.5 bg-[#111118] border border-[#C9A84C22] rounded-lg px-3 py-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.hex }} />
                  <span className="text-xs font-mono text-[#F5F0E866]">{c.hex}</span>
                </div>
              ))}
            </div>
            {renderPreviewCard(comparePreset)}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-[#0A0A0F88] backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111118] border border-[#C9A84C33] rounded-2xl p-8 max-w-md w-full shadow-[0_0_60px_#C9A84C22]">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-heading text-2xl text-[#C9A84C]">Commit Brand Preset?</h3>
              <button onClick={() => setShowConfirm(false)} className="text-[#F5F0E855] hover:text-[#F5F0E8]">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm font-body text-[#F5F0E877] mb-6">
              Are you sure? This will set <strong className="text-[#F5F0E8]">{preset.name}</strong> as the default
              brand across Golden Soul Studio.
            </p>
            <div className="flex gap-3">
              <GoldButton onClick={commit} className="flex-1">Confirm</GoldButton>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-5 py-2.5 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm font-body text-[#F5F0E8AA] hover:bg-[#C9A84C0D] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111118] border border-[#C9A84C] rounded-xl px-5 py-3 shadow-[0_0_30px_#C9A84C44] flex items-center gap-3 animate-slide-up">
          <Check size={16} className="text-[#C9A84C]" />
          <p className="text-sm font-body text-[#F5F0E8]">
            Golden Soul brand locked in 🎩
          </p>
        </div>
      )}
    </div>
  );
}
