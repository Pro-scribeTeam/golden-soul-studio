"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";

const VIDEO_MODELS = [
  { value: "kwaivgi/kling-v3", label: "Kling 3.0 — Cinematic 4K", group: "PREMIUM" },
  { value: "minimax/video-01", label: "Sora 2 — Complex Scenes", group: "PREMIUM" },
  { value: "bytedance/seedance-v1-lite", label: "Seedance 2.0 — Latest Cinematic", group: "PREMIUM" },
  { value: "google/veo-3", label: "Veo 3.1 — Native Audio", group: "PREMIUM" },
  { value: "lightricks/ltx-video-0.9.7", label: "LTX Video 2.3 — Fastest", group: "STANDARD" },
  { value: "runwayml/gen4-turbo", label: "Runway Gen-4 — Character Control", group: "STANDARD" },
  { value: "wavespeed-ai/wan-v2.7-t2v-720p", label: "Wan 2.7 — Versatile", group: "STANDARD" },
  { value: "wavespeed-ai/wan-v2.2-t2v-480p", label: "Wan 2.2 — Budget Fast", group: "STANDARD" },
];

const CAMERA_MOVES = [
  { value: "slow-dolly-push", label: "Slow Dolly Push In", group: "PUSH & PULL" },
  { value: "slow-dolly-pull", label: "Slow Dolly Pull Back", group: "PUSH & PULL" },
  { value: "fast-crash-zoom-in", label: "Fast Crash Zoom In", group: "PUSH & PULL" },
  { value: "fast-crash-zoom-out", label: "Fast Crash Zoom Out", group: "PUSH & PULL" },
  { value: "vertigo-dolly", label: "Vertigo Dolly Zoom", group: "PUSH & PULL" },
  { value: "rack-focus-near-far", label: "Rack Focus Near to Far", group: "PUSH & PULL" },
  { value: "rack-focus-far-near", label: "Rack Focus Far to Near", group: "PUSH & PULL" },
  { value: "orbit-360-cw", label: "Orbit 360 Clockwise", group: "ORBIT & ROTATE" },
  { value: "orbit-360-ccw", label: "Orbit 360 Counter-Clockwise", group: "ORBIT & ROTATE" },
  { value: "arc-left", label: "Arc Around Subject Left", group: "ORBIT & ROTATE" },
  { value: "arc-right", label: "Arc Around Subject Right", group: "ORBIT & ROTATE" },
  { value: "figure-eight", label: "Figure Eight Orbit", group: "ORBIT & ROTATE" },
  { value: "dutch-tilt-left", label: "Dutch Angle Tilt Left", group: "ORBIT & ROTATE" },
  { value: "dutch-tilt-right", label: "Dutch Angle Tilt Right", group: "ORBIT & ROTATE" },
  { value: "crane-up", label: "Crane Up Reveal", group: "CRANE & RISE" },
  { value: "crane-down", label: "Crane Down Descend", group: "CRANE & RISE" },
  { value: "rise-reveal", label: "Rise and Reveal", group: "CRANE & RISE" },
  { value: "fall-settle", label: "Fall and Settle", group: "CRANE & RISE" },
  { value: "birds-eye", label: "Bird's Eye Top Down", group: "CRANE & RISE" },
  { value: "ground-rise", label: "Ground Level Rise Up", group: "CRANE & RISE" },
  { value: "tracking-follow", label: "Tracking Shot Follow", group: "TRACK & FOLLOW" },
  { value: "reverse-tracking", label: "Reverse Tracking Pull", group: "TRACK & FOLLOW" },
  { value: "over-shoulder", label: "Over The Shoulder", group: "TRACK & FOLLOW" },
  { value: "parallax-push", label: "Parallax Depth Push", group: "TRACK & FOLLOW" },
  { value: "snorricam", label: "Snorricam Body Mount", group: "TRACK & FOLLOW" },
  { value: "slide-left", label: "Slide Left", group: "LATERAL" },
  { value: "slide-right", label: "Slide Right", group: "LATERAL" },
  { value: "whip-pan-lr", label: "Whip Pan Left to Right", group: "LATERAL" },
  { value: "whip-pan-rl", label: "Whip Pan Right to Left", group: "LATERAL" },
  { value: "pendulum", label: "Pendulum Swing", group: "LATERAL" },
  { value: "static", label: "Static Locked Off", group: "STATIC" },
  { value: "handheld", label: "Handheld Intimate", group: "STATIC" },
  { value: "low-angle", label: "Low Angle Ground Level", group: "STATIC" },
  { value: "breathing-hold", label: "Subtle Breathing Hold", group: "STATIC" },
];

const COLOR_GRADES = [
  { value: "golden-soul", label: "Golden Soul — Warm Amber Signature", group: "JEFF M DIXON BRAND" },
  { value: "midnight-fedora", label: "Midnight Fedora — Noir Black & Gold", group: "JEFF M DIXON BRAND" },
  { value: "ivory-gospel", label: "Ivory Gospel — Clean Church Light", group: "JEFF M DIXON BRAND" },
  { value: "mint-memory", label: "Mint Memory — Cool Teal Nostalgic", group: "JEFF M DIXON BRAND" },
  { value: "fresno-gold", label: "Fresno Gold — California Warm Dust", group: "JEFF M DIXON BRAND" },
  { value: "soul-hour", label: "Soul Hour — Late Evening Amber Glow", group: "JEFF M DIXON BRAND" },
  { value: "kodak-500t", label: "Kodak Vision3 500T", group: "CINEMATIC" },
  { value: "fuji-velvia", label: "Fuji Velvia — Vivid Saturated", group: "CINEMATIC" },
  { value: "bleach-bypass", label: "Bleach Bypass — Gritty Drama", group: "CINEMATIC" },
  { value: "teal-orange", label: "Teal and Orange — Hollywood", group: "CINEMATIC" },
  { value: "day-for-night", label: "Day for Night — Blue Conversion", group: "CINEMATIC" },
  { value: "vintage-70s", label: "Vintage 70s — Faded Warm", group: "CINEMATIC" },
  { value: "neon-noir", label: "Neon Noir — Urban Night Energy", group: "CINEMATIC" },
  { value: "cyberpunk", label: "Cyberpunk — Blue Purple Digital", group: "CINEMATIC" },
  { value: "warm-rnb", label: "Warm RnB — Smooth Amber", group: "MUSIC VIDEO" },
  { value: "hiphop-grit", label: "Hip Hop Grit — High Contrast Urban", group: "MUSIC VIDEO" },
  { value: "pop-bright", label: "Pop Bright — Clean Vibrant", group: "MUSIC VIDEO" },
  { value: "gospel-light", label: "Gospel Light — Divine White Glow", group: "MUSIC VIDEO" },
  { value: "jazz-club", label: "Jazz Club — Moody Amber Dark", group: "MUSIC VIDEO" },
  { value: "soul-classic", label: "Soul Classic — Warm Brown Vintage", group: "MUSIC VIDEO" },
  { value: "neo-soul", label: "Neo Soul — Warm Muted Earth", group: "MUSIC VIDEO" },
  { value: "golden-hour", label: "Golden Hour — Sunset Warm Magic", group: "NATURAL" },
  { value: "blue-hour", label: "Blue Hour — Pre-dawn Cool", group: "NATURAL" },
  { value: "magic-hour", label: "Magic Hour — Warm Pink Purple Sky", group: "NATURAL" },
  { value: "overcast-soft", label: "Overcast Soft — Diffused Even", group: "NATURAL" },
  { value: "no-grade", label: "No Grade / Raw", group: "NATURAL" },
];

const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5", "2.35:1"];

const JEFF_PRESET =
  "Black male R&B artist in his late 30s, wearing a perfectly tailored dark charcoal suit with pocket square and classic black fedora tilted slightly forward, soulful and dignified expression, warm amber golden hour lighting, cinematic 35mm film quality, authentic and genuine emotion";

const SOUL_PRESET =
  "Warm golden amber atmosphere, deep rich soulful colors, cinematic grain, authentic emotional mood, Fresno California golden light aesthetic, classic R&B visual world";

const SCENE_PRESET =
  "Cinematic establishing shot, warm natural lighting, real locations not studio, documentary authenticity, film-quality color depth";

const QUALITY_LABELS = ["Draft", "Standard", "High", "Ultra", "MAX"];

export default function VideoGeneration() {
  const [model, setModel] = useState("kwaivgi/kling-v3");
  const [prompt, setPrompt] = useState("");
  const [cameraMove, setCameraMove] = useState("static");
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState(2);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [colorGrade, setColorGrade] = useState("golden-soul");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; requestId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
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
          prompt: `${prompt}. Camera: ${cameraMove}. Color grade: ${colorGrade}.`,
          duration,
          quality: QUALITY_LABELS[quality],
          aspectRatio,
          colorGrade,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const requestId = data.requestId;
      setProgress(20);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      while (attempts < maxAttempts && !cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        setProgress(20 + Math.min(70, attempts * (70 / maxAttempts)));

        const statusRes = await fetch(`/api/wavespeed/status/${requestId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult({ url: statusData.outputs?.[0] || "", requestId });

          // Save to Supabase
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "video",
              model,
              prompt,
              settings: { duration, quality: QUALITY_LABELS[quality], aspectRatio, colorGrade, cameraMove },
              output_url: statusData.outputs?.[0],
            }),
          });
          break;
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.error || "Generation failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Video Generation</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Generate cinematic videos with premium AI models via WaveSpeed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Model */}
          <GoldDropdown
            label="Model"
            value={model}
            options={VIDEO_MODELS}
            onChange={setModel}
          />

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene in detail..."
              rows={5}
              className="w-full px-4 py-3 resize-none"
            />
            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPrompt(JEFF_PRESET)}
                className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
              >
                🎩 Jeff Preset
              </button>
              <button
                onClick={() => setPrompt(SOUL_PRESET)}
                className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
              >
                ✨ Soul Preset
              </button>
              <button
                onClick={() => setPrompt(SCENE_PRESET)}
                className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
              >
                🌆 Scene Preset
              </button>
            </div>
          </div>

          {/* Camera Movement */}
          <GoldDropdown
            label="Camera Movement"
            value={cameraMove}
            options={CAMERA_MOVES}
            onChange={setCameraMove}
          />

          {/* Color Grade */}
          <GoldDropdown
            label="Color Grade"
            value={colorGrade}
            options={COLOR_GRADES}
            onChange={setColorGrade}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Duration */}
          <GoldSlider
            label="Duration"
            min={2}
            max={20}
            value={duration}
            defaultValue={5}
            onChange={setDuration}
            formatValue={(v) => `${v}s`}
          />

          {/* Quality */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
                Quality
              </label>
              <span className="text-sm font-body font-semibold text-[#C9A84C]">
                {QUALITY_LABELS[quality]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #C9A84C ${(quality / 4) * 100}%, #3A3A4A ${(quality / 4) * 100}%)`,
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#F5F0E844]">
              {QUALITY_LABELS.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
              Aspect Ratio
            </label>
            <div className="flex gap-2 flex-wrap">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                    aspectRatio === ratio
                      ? "bg-[#C9A84C] text-[#0A0A0F]"
                      : "bg-[#111118] border border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <GoldButton
            size="lg"
            onClick={generate}
            loading={loading}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? "Generating..." : "🎬 Generate Video"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing
            progress={progress}
            estimatedSeconds={Math.max(0, Math.round((duration * 8) * (1 - progress / 100)))}
            onCancel={() => {
              setCancelled(true);
              setLoading(false);
            }}
            label="Generating your video..."
          />
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <OutputCard
          outputUrl={result.url}
          model={VIDEO_MODELS.find((m) => m.value === model)?.label || model}
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
