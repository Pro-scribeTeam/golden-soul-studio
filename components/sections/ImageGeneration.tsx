"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";

const IMAGE_MODELS = [
  { value: "google/nano-banana-pro", label: "Nano Banana Pro — Best for Jeff Photos ★", group: "PHOTOREALISTIC" },
  { value: "google/nano-banana-2", label: "Nano Banana 2 — Superior Face Accuracy", group: "PHOTOREALISTIC" },
  { value: "wavespeed-ai/flux-dev", label: "FLUX.2 — Photorealistic Precision", group: "PHOTOREALISTIC" },
  { value: "bytedance/seedream-5", label: "Seedream 5 — Cinematic Stills", group: "PHOTOREALISTIC" },
  { value: "bytedance/seedream-4-5", label: "Seedream 4.5 — Reliable Fast", group: "PHOTOREALISTIC" },
  { value: "tencent/hunyuan-image-3-0", label: "HunyuanImage 3.0 — 80B Quality", group: "CREATIVE" },
  { value: "openai/gpt-image-2", label: "GPT Image 2 — Strong Text Rendering", group: "CREATIVE" },
  { value: "stability/stable-diffusion-3-5", label: "Stable Diffusion 3.5 — Huge Style Range", group: "CREATIVE" },
];

const LIGHTING_PRESETS = [
  { value: "golden-hour-natural", label: "Golden Hour Natural", group: "JEFF M DIXON" },
  { value: "church-interior-warm", label: "Church Interior Warm", group: "JEFF M DIXON" },
  { value: "intimate-restaurant-evening", label: "Intimate Restaurant Evening", group: "JEFF M DIXON" },
  { value: "park-bench-afternoon", label: "Park Bench Afternoon", group: "JEFF M DIXON" },
  { value: "waterfront-sunrise", label: "Waterfront Sunrise", group: "JEFF M DIXON" },
  { value: "city-street-dusk", label: "City Street At Dusk", group: "JEFF M DIXON" },
  { value: "stage-spotlight-performance", label: "Stage Spotlight Performance", group: "JEFF M DIXON" },
  { value: "studio-portrait-warm", label: "Studio Portrait Warm", group: "JEFF M DIXON" },
  { value: "rembrandt-portrait", label: "Rembrandt Portrait", group: "CINEMATIC" },
  { value: "split-lighting-drama", label: "Split Lighting Drama", group: "CINEMATIC" },
  { value: "rim-light-silhouette", label: "Rim Light Silhouette", group: "CINEMATIC" },
  { value: "high-key-white", label: "High Key Clean White", group: "CINEMATIC" },
  { value: "low-key-noir", label: "Low Key Noir Dark", group: "CINEMATIC" },
  { value: "motivated-window", label: "Motivated Window Light", group: "CINEMATIC" },
  { value: "practical-lamp", label: "Practical Lamp Warm Glow", group: "CINEMATIC" },
  { value: "neon-sign-ambient", label: "Neon Sign Ambient", group: "CINEMATIC" },
  { value: "backlit-lens-flare", label: "Backlit Lens Flare", group: "CINEMATIC" },
  { value: "chiaroscuro", label: "Chiaroscuro Deep Shadow", group: "CINEMATIC" },
  { value: "soft-overcast", label: "Soft Overcast Even", group: "NATURAL" },
  { value: "magic-hour-warm", label: "Magic Hour Warm", group: "NATURAL" },
  { value: "blue-hour-cool", label: "Blue Hour Cool", group: "NATURAL" },
  { value: "harsh-midday", label: "Harsh Midday Bright", group: "NATURAL" },
  { value: "dappled-forest", label: "Dappled Forest Light", group: "NATURAL" },
  { value: "open-shade", label: "Open Shade Natural", group: "NATURAL" },
  { value: "sunset-sidelight", label: "Sunset Sidelight", group: "NATURAL" },
  { value: "beauty-dish", label: "Beauty Dish Soft", group: "STUDIO" },
  { value: "three-point", label: "Three Point Standard", group: "STUDIO" },
  { value: "butterfly-classic", label: "Butterfly Classic", group: "STUDIO" },
  { value: "hard-single-source", label: "Hard Single Source", group: "STUDIO" },
  { value: "ring-light-pop", label: "Ring Light Pop", group: "STUDIO" },
  { value: "colored-gel-creative", label: "Colored Gel Creative", group: "STUDIO" },
];

const RESOLUTIONS = ["512px", "1024px", "2048px", "4K"];

const JEFF_PRESET =
  "Black male R&B artist in his late 30s, wearing a perfectly tailored dark charcoal suit with pocket square and classic black fedora tilted slightly forward, soulful and dignified expression, warm amber golden hour lighting, cinematic 35mm film quality, authentic and genuine emotion";

const SOUL_PRESET =
  "Warm golden amber atmosphere, deep rich soulful colors, cinematic grain, authentic emotional mood, Fresno California golden light aesthetic, classic R&B visual world";

export default function ImageGeneration() {
  const [model, setModel] = useState("google/nano-banana-pro");
  const [prompt, setPrompt] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(50);
  const [lighting, setLighting] = useState("golden-hour-natural");
  const [resolution, setResolution] = useState("1024px");
  const [variations, setVariations] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(10);

    try {
      const res = await fetch("/api/wavespeed/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, styleIntensity, lighting, resolution, variations }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const requestId = data.requestId;
      setProgress(25);

      let attempts = 0;
      while (attempts < 40) {
        await new Promise((r) => setTimeout(r, 2500));
        attempts++;
        setProgress(25 + Math.min(70, attempts * (70 / 40)));

        const statusRes = await fetch(`/api/wavespeed/status/${requestId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResults(statusData.outputs || []);

          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "image",
              model,
              prompt,
              settings: { styleIntensity, lighting, resolution, variations },
              output_url: statusData.outputs?.[0],
            }),
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Image Generation</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Generate photorealistic portraits and creative images via WaveSpeed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GoldDropdown label="Model" value={model} options={IMAGE_MODELS} onChange={setModel} />

          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image in detail..."
              rows={5}
              className="w-full px-4 py-3 resize-none"
            />
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
            </div>
          </div>

          <GoldDropdown label="Lighting Preset" value={lighting} options={LIGHTING_PRESETS} onChange={setLighting} />
        </div>

        <div className="space-y-6">
          <GoldSlider
            label="Style Intensity"
            min={0}
            max={100}
            value={styleIntensity}
            defaultValue={50}
            onChange={setStyleIntensity}
            formatValue={(v) => `${v}%`}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Resolution</label>
            <div className="flex gap-2 flex-wrap">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                    resolution === r
                      ? "bg-[#C9A84C] text-[#0A0A0F]"
                      : "bg-[#111118] border border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <GoldSlider
            label="Variations"
            min={1}
            max={8}
            value={variations}
            defaultValue={1}
            onChange={setVariations}
          />

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
            {loading ? "Generating..." : "🖼️ Generate Images"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">
              {error}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing progress={progress} estimatedSeconds={Math.round(15 * (1 - progress / 100))} label="Generating your images..." />
        </div>
      )}

      {results.length > 0 && !loading && (
        <div>
          <h2 className="font-heading text-2xl text-[#C9A84C] mb-4">Generated Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((url, i) => (
              <OutputCard
                key={i}
                outputUrl={url}
                model={IMAGE_MODELS.find((m) => m.value === model)?.label || model}
                section="Image Generation"
                prompt={prompt}
                settings={{ styleIntensity: `${styleIntensity}%`, lighting, resolution }}
                onRegenerate={generate}
                isVideo={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
