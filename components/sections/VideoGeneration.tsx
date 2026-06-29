"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";
import { Upload, X, CheckCircle, Link } from "lucide-react";

// ─── Model lists ──────────────────────────────────────────────────────────────

const I2V_MODELS = [
  { value: "kling-i2v",    label: "Kling 3.0 — Best Character Consistency ★", group: "— BEST FOR IMAGE TO VIDEO —" },
  { value: "wan-i2v",      label: "Wan 2.7 — Fast & Reliable",                group: "— BEST FOR IMAGE TO VIDEO —" },
  { value: "ltx-i2v",      label: "LTX Video — Fastest Iterations",           group: "— BEST FOR IMAGE TO VIDEO —" },
  { value: "seedance-i2v", label: "Seedance 2.0 — Cinematic Quality",         group: "— BEST FOR IMAGE TO VIDEO —" },
  { value: "veo-i2v",      label: "Veo 3.1 — Native Audio Support",           group: "— BEST FOR IMAGE TO VIDEO —" },
];

const T2V_MODELS = [
  { value: "kwaivgi/kling-v3",             label: "Kling 3.0 — Cinematic 4K",           group: "— OR GENERATE FROM TEXT —" },
  { value: "minimax/video-01",             label: "Sora 2 — Complex Scenes",             group: "— OR GENERATE FROM TEXT —" },
  { value: "bytedance/seedance-v1-lite",   label: "Seedance 2.0 — Latest Cinematic",     group: "— OR GENERATE FROM TEXT —" },
  { value: "google/veo-3",                 label: "Veo 3.1 — Native Audio",              group: "— OR GENERATE FROM TEXT —" },
  { value: "lightricks/ltx-video-0.9.7",  label: "LTX Video 2.3 — Fastest",             group: "— OR GENERATE FROM TEXT —" },
  { value: "runwayml/gen4-turbo",          label: "Runway Gen-4 — Character Control",    group: "— OR GENERATE FROM TEXT —" },
  { value: "wavespeed-ai/wan-v2.2-t2v-480p", label: "Wan 2.2 — Budget Fast",            group: "— OR GENERATE FROM TEXT —" },
];

const CAMERA_MOVES = [
  // Push & Pull
  { value: "slow-dolly-push",       label: "Slow Dolly Push In",           group: "PUSH & PULL" },
  { value: "slow-dolly-pull",       label: "Slow Dolly Pull Back",          group: "PUSH & PULL" },
  { value: "fast-crash-zoom-in",    label: "Fast Crash Zoom In",            group: "PUSH & PULL" },
  { value: "fast-crash-zoom-out",   label: "Fast Crash Zoom Out",           group: "PUSH & PULL" },
  { value: "vertigo-dolly",         label: "Vertigo Dolly Zoom",            group: "PUSH & PULL" },
  { value: "slow-pull-reveal",      label: "Slow Pull Reveal Background",   group: "PUSH & PULL" },
  { value: "push-through",          label: "Push Through Subject",          group: "PUSH & PULL" },
  // Orbit & Rotate
  { value: "orbit-360-cw",          label: "Orbit 360 Clockwise",           group: "ORBIT & ROTATE" },
  { value: "orbit-360-ccw",         label: "Orbit 360 Counter-CW",          group: "ORBIT & ROTATE" },
  { value: "arc-left",              label: "Arc Around Left",               group: "ORBIT & ROTATE" },
  { value: "arc-right",             label: "Arc Around Right",              group: "ORBIT & ROTATE" },
  { value: "dutch-tilt-left",       label: "Dutch Angle Tilt Left",         group: "ORBIT & ROTATE" },
  { value: "dutch-tilt-right",      label: "Dutch Angle Tilt Right",        group: "ORBIT & ROTATE" },
  { value: "slow-rotate-cw",        label: "Slow Rotate Clockwise",         group: "ORBIT & ROTATE" },
  { value: "slow-rotate-ccw",       label: "Slow Rotate Counter-CW",        group: "ORBIT & ROTATE" },
  // Crane & Rise
  { value: "crane-up",              label: "Crane Up Reveal",               group: "CRANE & RISE" },
  { value: "crane-down",            label: "Crane Down Descend",            group: "CRANE & RISE" },
  { value: "rise-reveal",           label: "Rise and Reveal",               group: "CRANE & RISE" },
  { value: "birds-eye",             label: "Bird's Eye Top Down",           group: "CRANE & RISE" },
  { value: "overhead-descend",      label: "Overhead Descend Into Scene",   group: "CRANE & RISE" },
  { value: "pedestal-up",           label: "Pedestal Up Slow",              group: "CRANE & RISE" },
  { value: "pedestal-down",         label: "Pedestal Down Slow",            group: "CRANE & RISE" },
  { value: "worms-eye-rise",        label: "Worm's Eye Rise",               group: "CRANE & RISE" },
  // Track & Follow
  { value: "tracking-follow",       label: "Tracking Shot Follow",          group: "TRACK & FOLLOW" },
  { value: "over-shoulder",         label: "Over The Shoulder",             group: "TRACK & FOLLOW" },
  { value: "lead-follow",           label: "Lead and Follow Subject",       group: "TRACK & FOLLOW" },
  { value: "parallel-track",        label: "Parallel Tracking",             group: "TRACK & FOLLOW" },
  { value: "chase-from-behind",     label: "Chase From Behind",             group: "TRACK & FOLLOW" },
  // Tilt
  { value: "tilt-up",               label: "Tilt Up Reveal",                group: "TILT" },
  { value: "tilt-down",             label: "Tilt Down Reveal",              group: "TILT" },
  { value: "slow-tilt-up",          label: "Slow Tilt Up Majestic",         group: "TILT" },
  { value: "nod-tilt",              label: "Nod Tilt Agree",                group: "TILT" },
  // Lateral
  { value: "slide-left",            label: "Slide Left",                    group: "LATERAL" },
  { value: "slide-right",           label: "Slide Right",                   group: "LATERAL" },
  { value: "whip-pan-lr",           label: "Whip Pan Left to Right",        group: "LATERAL" },
  { value: "whip-pan-rl",           label: "Whip Pan Right to Left",        group: "LATERAL" },
  { value: "truck-left",            label: "Truck Left Slow",               group: "LATERAL" },
  { value: "truck-right",           label: "Truck Right Slow",              group: "LATERAL" },
  // Drone & Aerial
  { value: "drone-rise-forward",    label: "Drone Rise Forward",            group: "DRONE & AERIAL" },
  { value: "drone-descend-reveal",  label: "Drone Descend Reveal",          group: "DRONE & AERIAL" },
  { value: "drone-fly-over",        label: "Drone Fly Over",                group: "DRONE & AERIAL" },
  { value: "drone-orbit",           label: "Drone Orbit High",              group: "DRONE & AERIAL" },
  { value: "aerial-establishing",   label: "Aerial Establishing Wide",      group: "DRONE & AERIAL" },
  // Static
  { value: "static",                label: "Static Locked Off",             group: "STATIC" },
  { value: "handheld",              label: "Handheld Intimate",             group: "STATIC" },
  { value: "low-angle",             label: "Low Angle Ground Level",        group: "STATIC" },
  { value: "high-angle",            label: "High Angle Looking Down",       group: "STATIC" },
  { value: "close-up-lock",         label: "Close-Up Locked",               group: "STATIC" },
  { value: "extreme-close-up",      label: "Extreme Close-Up",              group: "STATIC" },
  { value: "wide-locked",           label: "Wide Shot Locked",              group: "STATIC" },
  { value: "slow-breath",           label: "Breathing — Very Subtle Drift", group: "STATIC" },
];

const COLOR_GRADES = [
  // Off
  { value: "none",            label: "Off — No Color Grade",               group: "─── OFF ───" },
  // Jeff M Dixon Brand
  { value: "golden-soul",     label: "Golden Soul — Warm Amber Signature", group: "JEFF M DIXON BRAND" },
  { value: "midnight-fedora", label: "Midnight Fedora — Noir Black & Gold",group: "JEFF M DIXON BRAND" },
  { value: "ivory-gospel",    label: "Ivory Gospel — Clean Church Light",  group: "JEFF M DIXON BRAND" },
  { value: "fresno-gold",     label: "Fresno Gold — California Warm Dust", group: "JEFF M DIXON BRAND" },
  { value: "soul-hour",       label: "Soul Hour — Late Evening Amber",     group: "JEFF M DIXON BRAND" },
  { value: "mint-memory",     label: "Mint Memory — Cool Teal Reflection", group: "JEFF M DIXON BRAND" },
  // Cinematic
  { value: "kodak-500t",      label: "Kodak Vision3 500T — Film Grain",    group: "CINEMATIC" },
  { value: "teal-orange",     label: "Teal + Orange — Hollywood",          group: "CINEMATIC" },
  { value: "bleach-bypass",   label: "Bleach Bypass — Desaturated Grit",   group: "CINEMATIC" },
  { value: "anamorphic-blue", label: "Anamorphic Blue — Lens Flare Wide",  group: "CINEMATIC" },
  { value: "new-hollywood",   label: "New Hollywood — 70s Warm Fade",      group: "CINEMATIC" },
  { value: "noir",            label: "Noir — High Contrast B&W",           group: "CINEMATIC" },
  { value: "neon-night",      label: "Neon Night — Cyberpunk Glow",        group: "CINEMATIC" },
  { value: "venice-haze",     label: "Venice Haze — Faded Pastel",         group: "CINEMATIC" },
  // Music Video
  { value: "warm-rnb",        label: "Warm RnB — Smooth Amber",            group: "MUSIC VIDEO" },
  { value: "gospel-light",    label: "Gospel Light — Divine White",        group: "MUSIC VIDEO" },
  { value: "trap-dark",       label: "Trap Dark — Deep Shadow Moody",      group: "MUSIC VIDEO" },
  { value: "neo-soul-sunset", label: "Neo Soul Sunset — Purple to Gold",   group: "MUSIC VIDEO" },
  { value: "urban-steel",     label: "Urban Steel — Cold + Sharp",         group: "MUSIC VIDEO" },
  // Natural
  { value: "golden-hour",     label: "Golden Hour — Sunset Warm",          group: "NATURAL" },
  { value: "blue-hour",       label: "Blue Hour — Twilight Cool",          group: "NATURAL" },
  { value: "overcast-soft",   label: "Overcast Soft — Even Flat Light",    group: "NATURAL" },
  { value: "forest-green",    label: "Forest Green — Lush Cool Dapple",    group: "NATURAL" },
  { value: "desert-dust",     label: "Desert Dust — Dry Warm Haze",        group: "NATURAL" },
];

const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5", "2.35:1"];
const QUALITY_LABELS = ["Draft", "Standard", "High", "Ultra", "MAX"];

const JEFF_PRESET  = "Black male R&B artist in his late 30s, wearing a perfectly tailored dark charcoal suit with pocket square and classic black fedora tilted slightly forward, soulful and dignified expression, warm amber golden hour lighting, cinematic 35mm film quality, authentic and genuine emotion";
const SOUL_PRESET  = "Warm golden amber atmosphere, deep rich soulful colors, cinematic grain, authentic emotional mood, Fresno California golden light aesthetic, classic R&B visual world";
const SCENE_PRESET = "Cinematic establishing shot, warm natural lighting, real locations not studio, documentary authenticity, film-quality color depth";

// ─── Image Upload Zone (inline) ───────────────────────────────────────────────

interface UploadZoneProps {
  imageUrl: string;
  preview: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onUrlPaste: (url: string) => void;
  onClear: () => void;
}

function VideoImageUpload({ imageUrl, preview, uploading, onFile, onUrlPaste, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlVal, setUrlVal] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  }, [onFile]);

  if (preview || imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#C9A84C44]">
        <img src={preview || imageUrl} alt="Starting frame" className="w-full object-cover max-h-48" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 bg-[#0A0A0FCC] rounded-full text-[#F5F0E8] hover:bg-[#0A0A0F] transition-colors"
        >
          <X size={13} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0F] to-transparent px-3 py-2 flex items-center gap-2">
          <CheckCircle size={12} className="text-green-400" />
          <span className="text-[11px] font-body text-green-400">
            {imageUrl ? "Image loaded as starting frame" : "Uploading..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver ? "border-[#C9A84C] bg-[#C9A84C0D]" : "border-[#C9A84C22] bg-[#111118] hover:border-[#C9A84C44]"
        }`}
      >
        {uploading ? (
          <div className="w-6 h-6 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin" />
        ) : (
          <>
            <Upload size={20} className="text-[#C9A84C88]" />
            <div className="text-center">
              <p className="text-sm text-[#F5F0E8AA] font-body">Drop image or <span className="text-[#C9A84C]">click to upload</span></p>
              <p className="text-xs text-[#F5F0E844] font-body">Use as the starting frame for your video</p>
              <p className="text-[10px] text-[#F5F0E833] font-body mt-1">JPG, PNG, WebP</p>
            </div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {showUrl ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlVal}
            onChange={(e) => setUrlVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && urlVal.trim()) { onUrlPaste(urlVal.trim()); setShowUrl(false); setUrlVal(""); }}}
            placeholder="https://..."
            autoFocus
            className="flex-1 px-3 py-2 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]"
          />
          <button onClick={() => { if (urlVal.trim()) { onUrlPaste(urlVal.trim()); setShowUrl(false); setUrlVal(""); }}} className="px-3 py-2 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-semibold">Use</button>
          <button onClick={() => setShowUrl(false)} className="px-2 text-[#F5F0E844] text-xs">✕</button>
        </div>
      ) : (
        <button onClick={() => setShowUrl(true)} className="flex items-center gap-1.5 text-xs text-[#C9A84C66] hover:text-[#C9A84C] font-body transition-colors">
          <Link size={10} /> Paste image URL instead
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VideoGeneration() {
  const [model, setModel]           = useState("kling-i2v");
  const [prompt, setPrompt]         = useState("");
  const [cameraMove, setCameraMove] = useState("static");
  const [duration, setDuration]     = useState(5);
  const [quality, setQuality]       = useState(2);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [colorGrade, setColorGrade] = useState("none");

  // Image input state
  const [imageUrl, setImageUrl]         = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState<{ url: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const hasImage = Boolean(imageUrl);

  // Pre-load image / prompt from localStorage
  useEffect(() => {
    const img = localStorage.getItem("gss_video_image");
    if (img) { setImageUrl(img); setImagePreview(img); setModel("kling-i2v"); localStorage.removeItem("gss_video_image"); }
    const pmt = localStorage.getItem("gss_video_prompt");
    if (pmt) { setPrompt(pmt); localStorage.removeItem("gss_video_prompt"); }
  }, []);

  const uploadFile = async (file: File) => {
    setUploadLoading(true);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const text = await res.text();
      let data: { url?: string; error?: string };
      try { data = JSON.parse(text); } catch { throw new Error(res.ok ? "Upload failed" : `Upload error (${res.status}): ${text.slice(0, 120)}`); }
      if (data.error) throw new Error(data.error);
      setImageUrl(data.url!);
      setModel("kling-i2v");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setImagePreview("");
    } finally {
      setUploadLoading(false);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImagePreview("");
    setModel("kwaivgi/kling-v3");
  };

  const generate = async () => {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    setCancelled(false);
    setProgress(5);

    try {
      const res = await fetch("/api/wavespeed/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: [prompt, `Camera: ${cameraMove}`, colorGrade !== "none" ? `Color grade: ${colorGrade}` : ""].filter(Boolean).join(". "),
          duration,
          quality: QUALITY_LABELS[quality],
          aspectRatio,
          ...(hasImage ? { imageUrl } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setProgress(20);

      let attempts = 0;
      while (attempts < 60 && !cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        setProgress(20 + Math.min(70, attempts * (70 / 60)));
        const statusRes = await fetch(`/api/wavespeed/status/${data.requestId}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult({ url: statusData.outputs?.[0] || "" });
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section: "video", model, prompt, settings: { duration, quality: QUALITY_LABELS[quality], aspectRatio, colorGrade, cameraMove }, output_url: statusData.outputs?.[0] }),
          });
          break;
        }
        if (statusData.status === "failed") throw new Error(statusData.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const allModels = hasImage ? [...I2V_MODELS, ...T2V_MODELS] : T2V_MODELS;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Video Generation</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Generate cinematic videos — from text or animate your images with AI
        </p>
      </div>

      {/* Image Upload Zone */}
      <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
            Start from an image <span className="text-[#F5F0E844] normal-case tracking-normal">(optional)</span>
          </label>
          {hasImage && (
            <span className="ml-auto px-2 py-0.5 bg-[#C9A84C22] border border-[#C9A84C44] rounded text-[10px] text-[#C9A84C] font-body">
              Image-to-Video active
            </span>
          )}
        </div>
        <VideoImageUpload
          imageUrl={imageUrl}
          preview={imagePreview}
          uploading={uploadLoading}
          onFile={uploadFile}
          onUrlPaste={(url) => { setImageUrl(url); setImagePreview(url); setModel("kling-i2v"); }}
          onClear={clearImage}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <GoldDropdown label="Model" value={model} options={allModels} onChange={setModel} />

          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasImage ? "Describe the motion and animation..." : "Describe your scene in detail..."}
              rows={5}
              className="w-full px-4 py-3 resize-none"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setPrompt(JEFF_PRESET)} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">🎩 Jeff Preset</button>
              <button onClick={() => setPrompt(SOUL_PRESET)} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">✨ Soul Preset</button>
              <button onClick={() => setPrompt(SCENE_PRESET)} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">🌆 Scene Preset</button>
            </div>
          </div>

          <GoldDropdown label="Camera Movement" value={cameraMove} options={CAMERA_MOVES} onChange={setCameraMove} />
          <GoldDropdown label="Color Grade" value={colorGrade} options={COLOR_GRADES} onChange={setColorGrade} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <GoldSlider label="Duration" min={2} max={20} value={duration} defaultValue={5} onChange={setDuration} formatValue={(v) => `${v}s`} />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Quality</label>
              <span className="text-sm font-body font-semibold text-[#C9A84C]">{QUALITY_LABELS[quality]}</span>
            </div>
            <input type="range" min={0} max={4} step={1} value={quality} onChange={(e) => setQuality(Number(e.target.value))}
              style={{ background: `linear-gradient(to right, #C9A84C ${(quality / 4) * 100}%, #3A3A4A ${(quality / 4) * 100}%)` }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#F5F0E844]">
              {QUALITY_LABELS.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Aspect Ratio</label>
            <div className="flex gap-2 flex-wrap">
              {ASPECT_RATIOS.map((ratio) => (
                <button key={ratio} onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                    aspectRatio === ratio ? "bg-[#C9A84C] text-[#0A0A0F]" : "bg-[#111118] border border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >{ratio}</button>
              ))}
            </div>
          </div>

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading || uploadLoading} className="w-full mt-4">
            {loading ? "Generating..." : hasImage ? "🎬 Animate This Image" : "🎬 Generate Video"}
          </GoldButton>

          {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing
            progress={progress}
            estimatedSeconds={Math.max(0, Math.round((duration * 8) * (1 - progress / 100)))}
            onCancel={() => { setCancelled(true); setLoading(false); }}
            label={hasImage ? "Animating your image..." : "Generating your video..."}
          />
        </div>
      )}

      {result && !loading && (
        <OutputCard
          outputUrl={result.url}
          model={allModels.find((m) => m.value === model)?.label || model}
          section="Video Generation"
          prompt={prompt}
          settings={{ duration: `${duration}s`, quality: QUALITY_LABELS[quality], aspectRatio, colorGrade, cameraMove }}
          onRegenerate={generate}
          isVideo
        />
      )}
    </div>
  );
}
