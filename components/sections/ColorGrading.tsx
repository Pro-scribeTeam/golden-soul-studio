"use client";

import React, { useState, useRef, useCallback } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { UploadZone } from "@/components/ui/UploadZone";
import { Save, Download, RotateCcw } from "lucide-react";

interface GradePreset {
  id: string;
  name: string;
  color: string;
  group: string;
  settings: Record<string, number>;
}

const PRESETS: GradePreset[] = [
  { id: "golden-soul",     name: "Golden Soul",     color: "#C9A84C", group: "JEFF M DIXON BRAND", settings: { warmth: 35, contrast: 15, shadows: -10, highlights: 10, saturation: 20, vibrance: 15, grain: 10, vignette: 20, sharpness: 15, fade: 5, tint: 5, temperature: 30 } },
  { id: "midnight-fedora", name: "Midnight Fedora", color: "#1A1A2E", group: "JEFF M DIXON BRAND", settings: { warmth: -20, contrast: 40, shadows: -30, highlights: -10, saturation: -15, vibrance: 10, grain: 15, vignette: 40, sharpness: 20, fade: 0, tint: -10, temperature: -15 } },
  { id: "ivory-gospel",    name: "Ivory Gospel",    color: "#F5F0E8", group: "JEFF M DIXON BRAND", settings: { warmth: 20, contrast: -5, shadows: 10, highlights: 20, saturation: -10, vibrance: 5, grain: 5, vignette: 10, sharpness: 10, fade: 10, tint: 5, temperature: 15 } },
  { id: "mint-memory",     name: "Mint Memory",     color: "#6BBFB5", group: "JEFF M DIXON BRAND", settings: { warmth: -15, contrast: 10, shadows: 5, highlights: -5, saturation: 10, vibrance: 20, grain: 8, vignette: 15, sharpness: 10, fade: 8, tint: -20, temperature: -20 } },
  { id: "fresno-gold",     name: "Fresno Gold",     color: "#D4955A", group: "JEFF M DIXON BRAND", settings: { warmth: 40, contrast: 20, shadows: -15, highlights: 5, saturation: 25, vibrance: 20, grain: 20, vignette: 25, sharpness: 15, fade: 5, tint: 10, temperature: 35 } },
  { id: "soul-hour",       name: "Soul Hour",       color: "#E8A050", group: "JEFF M DIXON BRAND", settings: { warmth: 45, contrast: 10, shadows: -20, highlights: 15, saturation: 30, vibrance: 25, grain: 15, vignette: 30, sharpness: 10, fade: 0, tint: 8, temperature: 40 } },
  { id: "kodak-500t",    name: "Kodak Vision3 500T", color: "#C8B090", group: "CINEMATIC", settings: { warmth: 15, contrast: 20, shadows: -5, highlights: -5, saturation: 10, vibrance: 5, grain: 30, vignette: 15, sharpness: 5, fade: 5, tint: 5, temperature: 10 } },
  { id: "fuji-velvia",   name: "Fuji Velvia",        color: "#3A7A3A", group: "CINEMATIC", settings: { warmth: 5, contrast: 30, shadows: -10, highlights: 10, saturation: 45, vibrance: 35, grain: 10, vignette: 10, sharpness: 20, fade: 0, tint: 0, temperature: 5 } },
  { id: "bleach-bypass", name: "Bleach Bypass",      color: "#888880", group: "CINEMATIC", settings: { warmth: -10, contrast: 50, shadows: -20, highlights: -10, saturation: -40, vibrance: -20, grain: 25, vignette: 20, sharpness: 30, fade: 0, tint: 0, temperature: -5 } },
  { id: "teal-orange",   name: "Teal + Orange",      color: "#4A9090", group: "CINEMATIC", settings: { warmth: 10, contrast: 25, shadows: -15, highlights: 5, saturation: 25, vibrance: 30, grain: 5, vignette: 15, sharpness: 15, fade: 0, tint: -15, temperature: 5 } },
  { id: "day-for-night", name: "Day for Night",      color: "#1A2A4A", group: "CINEMATIC", settings: { warmth: -40, contrast: 30, shadows: -30, highlights: -20, saturation: -20, vibrance: -10, grain: 15, vignette: 35, sharpness: 10, fade: 0, tint: -25, temperature: -35 } },
  { id: "vintage-70s",   name: "Vintage 70s",        color: "#C8A870", group: "CINEMATIC", settings: { warmth: 30, contrast: -10, shadows: 10, highlights: -5, saturation: -15, vibrance: -10, grain: 40, vignette: 25, sharpness: -10, fade: 20, tint: 10, temperature: 25 } },
  { id: "neon-noir",     name: "Neon Noir",          color: "#7A2A7A", group: "CINEMATIC", settings: { warmth: -20, contrast: 45, shadows: -25, highlights: -5, saturation: 30, vibrance: 40, grain: 20, vignette: 40, sharpness: 20, fade: 0, tint: -20, temperature: -15 } },
  { id: "cyberpunk",     name: "Cyberpunk",          color: "#4A2ABA", group: "CINEMATIC", settings: { warmth: -30, contrast: 40, shadows: -20, highlights: 10, saturation: 35, vibrance: 50, grain: 10, vignette: 30, sharpness: 25, fade: 0, tint: -30, temperature: -25 } },
  { id: "warm-rnb",     name: "Warm RnB",    color: "#D4A060", group: "MUSIC VIDEO", settings: { warmth: 30, contrast: 15, shadows: -5, highlights: 10, saturation: 20, vibrance: 15, grain: 8, vignette: 15, sharpness: 10, fade: 5, tint: 8, temperature: 25 } },
  { id: "hiphop-grit",  name: "Hip Hop Grit",color: "#808080", group: "MUSIC VIDEO", settings: { warmth: -5, contrast: 45, shadows: -25, highlights: -5, saturation: -10, vibrance: 5, grain: 35, vignette: 20, sharpness: 30, fade: 0, tint: -5, temperature: -5 } },
  { id: "pop-bright",   name: "Pop Bright",  color: "#F0D080", group: "MUSIC VIDEO", settings: { warmth: 15, contrast: -5, shadows: 15, highlights: 25, saturation: 30, vibrance: 25, grain: 0, vignette: 5, sharpness: 15, fade: 5, tint: 5, temperature: 10 } },
  { id: "gospel-light", name: "Gospel Light",color: "#FFFFF0", group: "MUSIC VIDEO", settings: { warmth: 25, contrast: -10, shadows: 20, highlights: 30, saturation: -5, vibrance: 10, grain: 5, vignette: 5, sharpness: 5, fade: 15, tint: 5, temperature: 20 } },
  { id: "jazz-club",    name: "Jazz Club",   color: "#4A3020", group: "MUSIC VIDEO", settings: { warmth: 15, contrast: 30, shadows: -20, highlights: -10, saturation: -5, vibrance: -5, grain: 25, vignette: 35, sharpness: 10, fade: 5, tint: 10, temperature: 10 } },
  { id: "soul-classic", name: "Soul Classic",color: "#8A6040", group: "MUSIC VIDEO", settings: { warmth: 20, contrast: 10, shadows: -5, highlights: 5, saturation: 5, vibrance: 10, grain: 20, vignette: 20, sharpness: 5, fade: 10, tint: 5, temperature: 15 } },
  { id: "neo-soul",     name: "Neo Soul",    color: "#7A6A5A", group: "MUSIC VIDEO", settings: { warmth: 10, contrast: 5, shadows: 5, highlights: -5, saturation: -10, vibrance: 5, grain: 15, vignette: 15, sharpness: 5, fade: 10, tint: 3, temperature: 10 } },
  { id: "golden-hour",  name: "Golden Hour",  color: "#F0A030", group: "NATURAL", settings: { warmth: 50, contrast: 5, shadows: -10, highlights: 20, saturation: 35, vibrance: 30, grain: 5, vignette: 15, sharpness: 5, fade: 0, tint: 10, temperature: 45 } },
  { id: "blue-hour",    name: "Blue Hour",    color: "#3050A0", group: "NATURAL", settings: { warmth: -35, contrast: 10, shadows: -5, highlights: -10, saturation: 15, vibrance: 20, grain: 8, vignette: 20, sharpness: 10, fade: 5, tint: -20, temperature: -30 } },
  { id: "magic-hour",   name: "Magic Hour",   color: "#D08090", group: "NATURAL", settings: { warmth: 25, contrast: 5, shadows: -5, highlights: 15, saturation: 25, vibrance: 25, grain: 5, vignette: 10, sharpness: 5, fade: 5, tint: 15, temperature: 20 } },
  { id: "overcast",     name: "Overcast Soft",color: "#A0A8B0", group: "NATURAL", settings: { warmth: -5, contrast: -10, shadows: 10, highlights: 5, saturation: -5, vibrance: 0, grain: 5, vignette: 5, sharpness: 5, fade: 5, tint: 0, temperature: -5 } },
  { id: "raw",          name: "No Grade / Raw",color: "#808080", group: "NATURAL", settings: { warmth: 0, contrast: 0, shadows: 0, highlights: 0, saturation: 0, vibrance: 0, grain: 0, vignette: 0, sharpness: 0, fade: 0, tint: 0, temperature: 0 } },
];

const DEFAULT_SETTINGS = { warmth: 0, contrast: 0, shadows: 0, highlights: 0, saturation: 0, vibrance: 0, grain: 0, vignette: 0, sharpness: 0, fade: 0, tint: 0, temperature: 0 };

const SLIDER_CONFIG = [
  { key: "warmth",      label: "Warmth",      min: -100, max: 100 },
  { key: "contrast",    label: "Contrast",    min: -100, max: 100 },
  { key: "shadows",     label: "Shadows",     min: -100, max: 100 },
  { key: "highlights",  label: "Highlights",  min: -100, max: 100 },
  { key: "saturation",  label: "Saturation",  min: -100, max: 100 },
  { key: "vibrance",    label: "Vibrance",    min: -100, max: 100 },
  { key: "grain",       label: "Grain",       min: 0,    max: 100 },
  { key: "vignette",    label: "Vignette",    min: 0,    max: 100 },
  { key: "sharpness",   label: "Sharpness",   min: -100, max: 100 },
  { key: "fade",        label: "Fade",        min: 0,    max: 100 },
  { key: "tint",        label: "Tint",        min: -100, max: 100 },
  { key: "temperature", label: "Temperature", min: -100, max: 100 },
] as const;

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

// Build dropdown options per group
const toOptions = (group: string) =>
  PRESETS.filter((p) => p.group === group).map((p) => ({ value: p.id, label: p.name }));

const JEFF_OPTIONS     = toOptions("JEFF M DIXON BRAND");
const CINE_OPTIONS     = toOptions("CINEMATIC");
const MUSIC_OPTIONS    = toOptions("MUSIC VIDEO");
const NATURAL_OPTIONS  = toOptions("NATURAL");

export default function ColorGrading() {
  const [file, setFile] = useState<File | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<SettingsKey, number>>(DEFAULT_SETTINGS);
  const [splitPos, setSplitPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dropdown values — only one active at a time
  const [jeffVal,    setJeffVal]    = useState("");
  const [cineVal,    setCineVal]    = useState("");
  const [musicVal,   setMusicVal]   = useState("");
  const [naturalVal, setNaturalVal] = useState("");

  const applyPresetById = (id: string, clearGroup: "jeff"|"cine"|"music"|"natural") => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(id);
    setSettings(preset.settings as Record<SettingsKey, number>);
    if (clearGroup !== "jeff")    setJeffVal("");
    if (clearGroup !== "cine")    setCineVal("");
    if (clearGroup !== "music")   setMusicVal("");
    if (clearGroup !== "natural") setNaturalVal("");
  };

  const resetAll = () => {
    setActivePreset(null);
    setSettings(DEFAULT_SETTINGS);
    setJeffVal(""); setCineVal(""); setMusicVal(""); setNaturalVal("");
  };

  // Drag-to-split logic
  const updateSplit = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); updateSplit(e); };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) updateSplit(e); };
  const handleMouseUp   = () => setDragging(false);

  const previewUrl = file ? URL.createObjectURL(file) : null;

  const filterStr = [
    `brightness(${1 + settings.highlights / 200})`,
    `contrast(${1 + settings.contrast / 100})`,
    `saturate(${1 + settings.saturation / 100})`,
    `hue-rotate(${settings.tint}deg)`,
    `sepia(${Math.max(0, settings.warmth) / 200})`,
  ].join(" ");

  const activePresetName = activePreset ? PRESETS.find((p) => p.id === activePreset)?.name : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Color Grading</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">Apply cinematic color grades to video or images</p>
      </div>

      <UploadZone label="Upload video or image to grade" accept="video/*,image/*" onFile={setFile} file={file} hint="MP4, MOV, JPG, PNG, WebP" />

      {/* ── Dropdown preset selectors ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <GoldDropdown
            label="Jeff M Dixon Brand"
            value={jeffVal}
            options={[{ value: "", label: "Select Jeff's Grade" }, ...JEFF_OPTIONS]}
            onChange={(v) => { setJeffVal(v); if (v) applyPresetById(v, "jeff"); }}
          />
        </div>
        <div className="space-y-1.5">
          <GoldDropdown
            label="Cinematic Grades"
            value={cineVal}
            options={[{ value: "", label: "Select Cinematic Grade" }, ...CINE_OPTIONS]}
            onChange={(v) => { setCineVal(v); if (v) applyPresetById(v, "cine"); }}
          />
        </div>
        <div className="space-y-1.5">
          <GoldDropdown
            label="Music Video Grades"
            value={musicVal}
            options={[{ value: "", label: "Select Music Video Grade" }, ...MUSIC_OPTIONS]}
            onChange={(v) => { setMusicVal(v); if (v) applyPresetById(v, "music"); }}
          />
        </div>
        <div className="space-y-1.5">
          <GoldDropdown
            label="Natural Grades"
            value={naturalVal}
            options={[{ value: "", label: "Select Natural Grade" }, ...NATURAL_OPTIONS]}
            onChange={(v) => { setNaturalVal(v); if (v) applyPresetById(v, "natural"); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-1 space-y-4 bg-[#111118] border border-[#C9A84C22] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg text-[#C9A84C]">Manual Adjustments</h3>
              {activePresetName && (
                <p className="text-xs font-body text-[#C9A84C88] mt-0.5">Active Grade: <span className="text-[#C9A84C]">{activePresetName}</span></p>
              )}
            </div>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111118] border border-[#C9A84C22] rounded-lg text-[10px] text-[#F5F0E855] hover:text-[#C9A84C] hover:border-[#C9A84C44] transition-colors font-body"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>
          {SLIDER_CONFIG.map(({ key, label, min, max }) => (
            <GoldSlider
              key={key}
              label={label}
              min={min}
              max={max}
              value={settings[key]}
              defaultValue={0}
              onChange={(v) => setSettings((s) => ({ ...s, [key]: v }))}
              formatValue={(v) => (v >= 0 ? `+${v}` : String(v))}
            />
          ))}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-heading text-lg text-[#C9A84C]">
            Preview
            <span className="ml-3 text-xs font-body text-[#F5F0E844] font-normal">Drag divider to compare Before / After</span>
          </h3>

          {/* Split view — drag to compare */}
          <div
            ref={containerRef}
            className="relative aspect-video bg-[#111118] border border-[#C9A84C22] rounded-xl overflow-hidden select-none"
            style={{ cursor: dragging ? "col-resize" : "col-resize" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {previewUrl ? (
              <>
                {/* Before (original) — left side */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${splitPos}%` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Before" className="w-full h-full object-contain" style={{ width: `${10000 / splitPos}%`, maxWidth: "none" }} />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#0A0A0F99] rounded text-[10px] text-white font-body">BEFORE</div>
                </div>
                {/* After (graded) — full width behind */}
                <div className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="After" className="w-full h-full object-contain" style={{ filter: filterStr }} />
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#0A0A0F99] rounded text-[10px] text-[#C9A84C] font-body">AFTER</div>
                </div>
                {/* Gold divider with handle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#C9A84C] pointer-events-none z-10"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-[#0A0A0F] text-xs font-bold">◁▷</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#F5F0E833]">
                <p className="text-sm font-body">Upload a file to preview</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <GoldButton className="flex-1" onClick={() => {}}>✅ Apply Grade</GoldButton>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm text-[#C9A84C] hover:bg-[#C9A84C0D] transition-colors font-body">
              <Save size={14} /> Save Preset
            </button>
            {previewUrl && (
              <a href={previewUrl} download="graded-output" className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm text-[#C9A84C] hover:bg-[#C9A84C0D] transition-colors font-body">
                <Download size={14} /> Export
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
