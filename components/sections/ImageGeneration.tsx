"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";
import { Upload, X, Link, Video, Plus } from "lucide-react";
import { uploadFileDirect } from "@/lib/uploadDirect";

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_MODELS = [
  { value: "google/nano-banana-2",   label: "Nano Banana 2 — Best for Jeff Photos ★",   group: "PHOTOREALISTIC" },
  { value: "google/nano-banana-pro", label: "Nano Banana Pro — (deprecated)",             group: "PHOTOREALISTIC" },
  { value: "wavespeed-ai/flux-dev",  label: "FLUX Dev — Photorealistic Precision",       group: "PHOTOREALISTIC" },
  { value: "bytedance/seedream-5",   label: "Seedream 5 — Cinematic Stills",             group: "PHOTOREALISTIC" },
  { value: "bytedance/seedream-4-5", label: "Seedream 4.5 — Reliable Fast",              group: "PHOTOREALISTIC" },
  { value: "tencent/hunyuan-image-3-0",      label: "HunyuanImage 3.0 — 80B Quality",       group: "CREATIVE" },
  { value: "openai/gpt-image-2",             label: "GPT Image 2 — Strong Text Rendering",  group: "CREATIVE" },
  { value: "stability/stable-diffusion-3-5", label: "Stable Diffusion 3.5 — Huge Style Range", group: "CREATIVE" },
];

const EDIT_MODELS = [
  { value: "nano-banana-2",    label: "Nano Banana 2 — Best for Jeff Photos ★",   group: "GOOGLE" },
  { value: "nano-banana-pro",  label: "Nano Banana Pro — (deprecated)",            group: "GOOGLE" },
  { value: "flux-kontext-max", label: "FLUX Kontext Max — Highest Quality Edit",  group: "FLUX KONTEXT" },
  { value: "flux-kontext-pro", label: "FLUX Kontext Pro — Fast & Precise",        group: "FLUX KONTEXT" },
  { value: "flux-kontext-dev", label: "FLUX Kontext Dev — Creative Edits",        group: "FLUX KONTEXT" },
];

const LIGHTING_PRESETS = [
  { value: "golden-hour-natural",       label: "Golden Hour Natural",        group: "JEFF M DIXON" },
  { value: "church-interior-warm",      label: "Church Interior Warm",       group: "JEFF M DIXON" },
  { value: "intimate-restaurant-evening", label: "Intimate Restaurant Evening", group: "JEFF M DIXON" },
  { value: "park-bench-afternoon",      label: "Park Bench Afternoon",       group: "JEFF M DIXON" },
  { value: "waterfront-sunrise",        label: "Waterfront Sunrise",         group: "JEFF M DIXON" },
  { value: "city-street-dusk",          label: "City Street At Dusk",        group: "JEFF M DIXON" },
  { value: "stage-spotlight-performance", label: "Stage Spotlight Performance", group: "JEFF M DIXON" },
  { value: "studio-portrait-warm",      label: "Studio Portrait Warm",       group: "JEFF M DIXON" },
  { value: "rembrandt-portrait",        label: "Rembrandt Portrait",         group: "CINEMATIC" },
  { value: "split-lighting-drama",      label: "Split Lighting Drama",       group: "CINEMATIC" },
  { value: "rim-light-silhouette",      label: "Rim Light Silhouette",       group: "CINEMATIC" },
  { value: "high-key-white",            label: "High Key Clean White",       group: "CINEMATIC" },
  { value: "low-key-noir",              label: "Low Key Noir Dark",          group: "CINEMATIC" },
  { value: "motivated-window",          label: "Motivated Window Light",     group: "CINEMATIC" },
  { value: "practical-lamp",            label: "Practical Lamp Warm Glow",   group: "CINEMATIC" },
  { value: "neon-sign-ambient",         label: "Neon Sign Ambient",          group: "CINEMATIC" },
  { value: "backlit-lens-flare",        label: "Backlit Lens Flare",         group: "CINEMATIC" },
  { value: "chiaroscuro",               label: "Chiaroscuro Deep Shadow",    group: "CINEMATIC" },
  { value: "soft-overcast",             label: "Soft Overcast Even",         group: "NATURAL" },
  { value: "magic-hour-warm",           label: "Magic Hour Warm",            group: "NATURAL" },
  { value: "blue-hour-cool",            label: "Blue Hour Cool",             group: "NATURAL" },
  { value: "harsh-midday",              label: "Harsh Midday Bright",        group: "NATURAL" },
  { value: "dappled-forest",            label: "Dappled Forest Light",       group: "NATURAL" },
  { value: "open-shade",                label: "Open Shade Natural",         group: "NATURAL" },
  { value: "sunset-sidelight",          label: "Sunset Sidelight",           group: "NATURAL" },
  { value: "beauty-dish",               label: "Beauty Dish Soft",           group: "STUDIO" },
  { value: "three-point",               label: "Three Point Standard",       group: "STUDIO" },
  { value: "butterfly-classic",         label: "Butterfly Classic",          group: "STUDIO" },
  { value: "hard-single-source",        label: "Hard Single Source",         group: "STUDIO" },
  { value: "ring-light-pop",            label: "Ring Light Pop",             group: "STUDIO" },
  { value: "colored-gel-creative",      label: "Colored Gel Creative",       group: "STUDIO" },
];

const RESOLUTIONS = ["512px", "1024px", "2048px", "4K"];

const JEFF_PRESET =
  "Black male R&B artist in his late 30s, wearing a perfectly tailored dark charcoal suit with pocket square and classic black fedora tilted slightly forward, soulful and dignified expression, warm amber golden hour lighting, cinematic 35mm film quality, authentic and genuine emotion";

const SOUL_PRESET =
  "Warm golden amber atmosphere, deep rich soulful colors, cinematic grain, authentic emotional mood, Fresno California golden light aesthetic, classic R&B visual world";

type Mode = "generate" | "edit" | "upscale" | "removebg";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "generate", label: "Generate",    desc: "Text-to-image" },
  { id: "edit",     label: "Edit Image",  desc: "FLUX Kontext" },
  { id: "upscale",  label: "Upscale",     desc: "4× AI upscale" },
  { id: "removebg", label: "Remove BG",   desc: "Transparent PNG" },
];

// ─── Image Upload Zone ────────────────────────────────────────────────────────

interface UploadZoneProps {
  imageUrl: string;
  preview: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onUrlPaste: (url: string) => void;
  onClear: () => void;
}

function ImageUploadZone({ imageUrl, preview, uploading, onFile, onUrlPaste, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }, [onFile]);

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onUrlPaste(urlValue.trim());
      setShowUrlInput(false);
      setUrlValue("");
    }
  };

  if (preview || imageUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#C9A84C33]">
        <img src={preview || imageUrl} alt="Input" className="w-full object-cover max-h-64" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 bg-[#0A0A0F99] rounded-full text-[#F5F0E8] hover:bg-[#0A0A0FCC] transition-colors"
        >
          <X size={14} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0F] to-transparent p-3">
          <span className="text-[10px] text-[#C9A84C] font-body uppercase tracking-wider">
            {imageUrl ? "Ready" : "Uploading..."}
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
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver
            ? "border-[#C9A84C] bg-[#C9A84C0D]"
            : "border-[#C9A84C33] bg-[#111118] hover:border-[#C9A84C66] hover:bg-[#C9A84C08]"
        }`}
      >
        {uploading ? (
          <div className="w-8 h-8 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin" />
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#C9A84C11] flex items-center justify-center">
              <Upload size={20} className="text-[#C9A84C]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[#F5F0E8AA] font-body">Drop image here or <span className="text-[#C9A84C]">click to upload</span></p>
              <p className="text-xs text-[#F5F0E844] font-body mt-1">JPG, PNG, WebP — max 50MB</p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            placeholder="https://..."
            autoFocus
            className="flex-1 px-3 py-2 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm text-[#F5F0E8] font-body focus:outline-none focus:border-[#C9A84C]"
          />
          <button onClick={handleUrlSubmit} className="px-3 py-2 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-semibold">Use</button>
          <button onClick={() => setShowUrlInput(false)} className="px-3 py-2 text-[#F5F0E844] text-xs font-body">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowUrlInput(true)}
          className="flex items-center gap-1.5 text-xs text-[#C9A84C88] hover:text-[#C9A84C] font-body transition-colors"
        >
          <Link size={11} /> Paste image URL instead
        </button>
      )}
    </div>
  );
}

// ─── Additional Images Zone ───────────────────────────────────────────────────

interface AdditionalImage {
  url: string;
  preview: string;
  uploading: boolean;
}

interface AdditionalImagesZoneProps {
  images: AdditionalImage[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
}

function AdditionalImagesZone({ images, onAdd, onRemove }: AdditionalImagesZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach(onAdd);
  }, [onAdd]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(onAdd);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider block">
        Additional Images
      </label>

      {/* Numbered thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#C9A84C33] flex-shrink-0">
              {img.uploading ? (
                <div className="w-full h-full bg-[#111118] flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin" />
                </div>
              ) : (
                <img src={img.preview || img.url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
              )}
              {/* Number badge */}
              <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                <span className="text-[10px] font-body font-bold text-[#0A0A0F]">{i + 1}</span>
              </div>
              {/* Remove button */}
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0A0A0FCC] flex items-center justify-center hover:bg-[#0A0A0F] transition-colors"
              >
                <X size={10} className="text-[#F5F0E8]" />
              </button>
            </div>
          ))}

          {/* Add more button (inline) */}
          <button
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-[#C9A84C33] hover:border-[#C9A84C66] hover:bg-[#C9A84C08] flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0"
          >
            <Plus size={16} className="text-[#C9A84C]" />
            <span className="text-[10px] text-[#C9A84C88] font-body">Add</span>
          </button>
        </div>
      )}

      {/* Drop zone (shown when empty) */}
      {images.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver
              ? "border-[#C9A84C] bg-[#C9A84C0D]"
              : "border-[#C9A84C33] bg-[#111118] hover:border-[#C9A84C66] hover:bg-[#C9A84C08]"
          }`}
        >
          <Plus size={20} className="text-[#C9A84C]" />
          <p className="text-xs text-[#F5F0E8AA] font-body text-center">
            Drop images here or <span className="text-[#C9A84C]">click to add</span>
          </p>
          <p className="text-[10px] text-[#F5F0E844] font-body">Multiple images — each numbered in order</p>
        </div>
      )}

      {/* Hidden file input — multiple */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Polling helper ───────────────────────────────────────────────────────────

async function pollResult(requestId: string, onProgress: (p: number) => void): Promise<string[]> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    onProgress(25 + Math.min(70, (i + 1) * (70 / 60)));
    const res = await fetch(`/api/wavespeed/status/${requestId}`);
    const data = await res.json();
    if (data.status === "completed" || data.outputs?.length) return data.outputs || [];
    if (data.status === "failed") throw new Error(data.error || "Generation failed");
  }
  throw new Error("Timed out waiting for result");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageGeneration() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("gss_image_prompt");
    if (stored) { setPrompt(stored); localStorage.removeItem("gss_image_prompt"); }
  }, []);
  const [mode, setMode] = useState<Mode>("generate");

  // Generate state
  const [model, setModel]               = useState("google/nano-banana-2");
  const [prompt, setPrompt]             = useState("");
  const [styleIntensity, setStyleIntensity] = useState(50);
  const [lighting, setLighting]         = useState("golden-hour-natural");
  const [resolution, setResolution]     = useState("1024px");
  const [variations, setVariations]     = useState(1);

  // Edit state
  const [editModel, setEditModel]       = useState("nano-banana-2");
  const [editPrompt, setEditPrompt]     = useState("");
  const [editStrength, setEditStrength] = useState(80);

  // Upscale state
  const [upscaleResolution, setUpscaleResolution] = useState("4k");

  // Shared image upload state
  const [imageUrl, setImageUrl]         = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Additional images (edit mode)
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);

  // Shared result state
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [results, setResults]     = useState<string[]>([]);
  const [error, setError]         = useState<string | null>(null);
  const [toastMsg, setToastMsg]   = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploadLoading(true);
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setImageUrl("");
    try {
      const url = await uploadFileDirect(file);
      setImageUrl(url);
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
  };

  const addAdditionalImage = async (file: File) => {
    const preview = URL.createObjectURL(file);
    const index = additionalImages.length;
    setAdditionalImages((prev) => [...prev, { url: "", preview, uploading: true }]);
    try {
      const url = await uploadFileDirect(file);
      setAdditionalImages((prev) =>
        prev.map((img, i) => i === index ? { ...img, url, uploading: false } : img)
      );
    } catch {
      setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const run = async (apiPath: string, body: Record<string, unknown>, section: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(10);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setProgress(25);
      const outputs = await pollResult(data.requestId, setProgress);
      setProgress(100);
      setResults(outputs);
      await fetch("/api/supabase/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, model: body.model || section, prompt: body.prompt || "", settings: body, output_url: outputs[0] }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generate = () => {
    if (!prompt.trim()) { setError("Please enter a prompt."); return; }
    run("/api/wavespeed/image", { model, prompt, styleIntensity, lighting, resolution, variations }, "image");
  };

  const editImage = () => {
    if (!imageUrl) { setError("Please upload or paste an image URL."); return; }
    if (!editPrompt.trim()) { setError("Please describe the edit."); return; }
    const additionalImageUrls = additionalImages.filter((img) => img.url).map((img) => img.url);
    run("/api/wavespeed/edit", { imageUrl, prompt: editPrompt, model: editModel, strength: editStrength, additionalImageUrls }, "edit");
  };

  const upscaleImage = () => {
    if (!imageUrl) { setError("Please upload an image."); return; }
    run("/api/wavespeed/upscale", { imageUrl, resolution: upscaleResolution }, "upscale");
  };

  const removeBg = () => {
    if (!imageUrl) { setError("Please upload an image."); return; }
    run("/api/wavespeed/removebg", { imageUrl }, "removebg");
  };

  // Use generated image in Edit mode
  const sendToEdit = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
    setMode("edit");
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const sendToVideo = (url: string) => {
    localStorage.setItem("gss_video_image", url);
    showToast("Image loaded — navigating to Video Generation...");
    setTimeout(() => router.push("/video"), 800);
  };

  const currentSection = MODES.find((m) => m.id === mode)!;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Image Generation</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Generate, edit, upscale, and remove backgrounds via WaveSpeed AI
        </p>
      </div>

      {/* Pro Tip Banner */}
      <div className="flex items-start gap-3 bg-[#C9A84C08] border border-[#C9A84C22] rounded-xl px-4 py-3">
        <span className="text-base flex-shrink-0">✨</span>
        <p className="text-xs font-body text-[#F5F0E8AA] leading-relaxed">
          <span className="text-[#C9A84C] font-semibold">Pro Tip:</span> Generate your image first, then send it to Video Generation to animate it with any camera movement. Use the <span className="text-[#C9A84C]">🎬 Send to Video</span> button that appears on your results.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-[#111118] border border-[#C9A84C22] rounded-xl p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setError(null); setResults([]); }}
            className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-lg transition-all ${
              mode === m.id
                ? "bg-[#C9A84C] text-[#0A0A0F]"
                : "text-[#F5F0E8AA] hover:text-[#F5F0E8] hover:bg-[#C9A84C0D]"
            }`}
          >
            <span className="text-sm font-body font-semibold">{m.label}</span>
            <span className={`text-[10px] font-body ${mode === m.id ? "text-[#0A0A0F99]" : "text-[#F5F0E844]"}`}>{m.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Generate Mode ── */}
      {mode === "generate" && (
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
                <button onClick={() => setPrompt(JEFF_PRESET)} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  🎩 Jeff Preset
                </button>
                <button onClick={() => setPrompt(SOUL_PRESET)} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  ✨ Soul Preset
                </button>
              </div>
            </div>

            <GoldDropdown label="Lighting Preset" value={lighting} options={LIGHTING_PRESETS} onChange={setLighting} />
          </div>

          <div className="space-y-6">
            <GoldSlider label="Style Intensity" min={0} max={100} value={styleIntensity} defaultValue={50} onChange={setStyleIntensity} formatValue={(v) => `${v}%`} />

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

            <GoldSlider label="Variations" min={1} max={4} value={variations} defaultValue={1} onChange={setVariations} />

            <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Images"}
            </GoldButton>

            {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
          </div>
        </div>
      )}

      {/* ── Edit Image Mode ── */}
      {mode === "edit" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider block">Source Image</label>
            <ImageUploadZone
              imageUrl={imageUrl}
              preview={imagePreview}
              uploading={uploadLoading}
              onFile={uploadFile}
              onUrlPaste={(url) => { setImageUrl(url); setImagePreview(url); }}
              onClear={clearImage}
            />
            <GoldDropdown label="Edit Model" value={editModel} options={EDIT_MODELS} onChange={setEditModel} />

            <AdditionalImagesZone
              images={additionalImages}
              onAdd={addAdditionalImage}
              onRemove={removeAdditionalImage}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Edit Instruction</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe what to change — e.g. 'Change the background to a sunset over the ocean' or 'Add a gold fedora'"
                rows={5}
                className="w-full px-4 py-3 resize-none"
              />
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setEditPrompt("Change the background to a warm golden sunset over Fresno, cinematic")} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  Golden BG
                </button>
                <button onClick={() => setEditPrompt("Add a perfectly tailored dark charcoal suit with gold pocket square")} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  Suit Up
                </button>
                <button onClick={() => setEditPrompt("Add a classic black fedora tilted slightly forward")} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  Add Fedora
                </button>
                <button onClick={() => setEditPrompt("Enhance the lighting to cinematic golden hour, 35mm film quality")} className="px-3 py-1.5 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body">
                  Golden Light
                </button>
              </div>
            </div>

            <GoldSlider label="Edit Strength" min={10} max={100} value={editStrength} defaultValue={80} onChange={setEditStrength} formatValue={(v) => `${v}%`} />
            <p className="text-[10px] text-[#F5F0E844] font-body -mt-4">Higher = stronger edit, lower = stays closer to original</p>

            <GoldButton size="lg" onClick={editImage} loading={loading} disabled={loading || uploadLoading} className="w-full">
              {uploadLoading ? "Uploading..." : loading ? "Editing..." : "Edit Image"}
            </GoldButton>

            {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
          </div>
        </div>
      )}

      {/* ── Upscale Mode ── */}
      {mode === "upscale" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider block">Image to Upscale</label>
            <ImageUploadZone
              imageUrl={imageUrl}
              preview={imagePreview}
              uploading={uploadLoading}
              onFile={uploadFile}
              onUrlPaste={(url) => { setImageUrl(url); setImagePreview(url); }}
              onClear={clearImage}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Target Resolution</label>
              <div className="flex gap-3">
                {["2k", "4k", "8k"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setUpscaleResolution(r)}
                    className={`flex-1 py-4 rounded-xl text-lg font-heading font-bold uppercase transition-all ${
                      upscaleResolution === r
                        ? "bg-[#C9A84C] text-[#0A0A0F]"
                        : "bg-[#111118] border border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#F5F0E844] font-body">Powered by WaveSpeed Image Upscaler</p>
            </div>

            <div className="bg-[#C9A84C0D] border border-[#C9A84C22] rounded-xl p-4 space-y-1">
              <p className="text-xs font-body text-[#C9A84C] font-semibold">Good for</p>
              <p className="text-xs text-[#F5F0E877] font-body">Portrait photos, album covers, merch designs — any image you want print-ready</p>
            </div>

            <GoldButton size="lg" onClick={upscaleImage} loading={loading} disabled={loading || uploadLoading || !imageUrl} className="w-full">
              {uploadLoading ? "Uploading..." : loading ? "Upscaling..." : `Upscale to ${upscaleResolution.toUpperCase()}`}
            </GoldButton>

            {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
          </div>
        </div>
      )}

      {/* ── Remove BG Mode ── */}
      {mode === "removebg" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider block">Image</label>
            <ImageUploadZone
              imageUrl={imageUrl}
              preview={imagePreview}
              uploading={uploadLoading}
              onFile={uploadFile}
              onUrlPaste={(url) => { setImageUrl(url); setImagePreview(url); }}
              onClear={clearImage}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-[#C9A84C0D] border border-[#C9A84C22] rounded-xl p-4 space-y-3">
              <p className="text-xs font-body text-[#C9A84C] font-semibold uppercase tracking-wider">About Remove BG</p>
              <p className="text-sm text-[#F5F0E8AA] font-body">Powered by BiRefNet — state-of-the-art dichotomous image segmentation. Returns a transparent PNG perfect for:</p>
              <ul className="text-xs text-[#F5F0E877] font-body space-y-1">
                <li>• Album cover layering</li>
                <li>• Social media cutouts</li>
                <li>• Merch & print designs</li>
                <li>• Video compositing</li>
              </ul>
            </div>

            <GoldButton size="lg" onClick={removeBg} loading={loading} disabled={loading || uploadLoading || !imageUrl} className="w-full">
              {uploadLoading ? "Uploading..." : loading ? "Processing..." : "Remove Background"}
            </GoldButton>

            {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
          </div>
        </div>
      )}

      {/* Loading Ring */}
      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing
            progress={progress}
            estimatedSeconds={Math.round(20 * (1 - progress / 100))}
            label={
              mode === "generate" ? "Generating your images..." :
              mode === "edit"     ? "Editing your image..." :
              mode === "upscale"  ? "Upscaling..." :
              "Removing background..."
            }
          />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div>
          <h2 className="font-heading text-2xl text-[#C9A84C] mb-4">{currentSection.label} Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((url, i) => (
              <div key={i} className="space-y-2">
                <OutputCard
                  outputUrl={url}
                  model={mode === "generate" ? (IMAGE_MODELS.find((m) => m.value === model)?.label || model) : mode}
                  section={currentSection.label}
                  prompt={mode === "generate" ? prompt : mode === "edit" ? editPrompt : ""}
                  settings={mode === "generate" ? { styleIntensity: `${styleIntensity}%`, lighting, resolution } : {}}
                  onRegenerate={mode === "generate" ? generate : mode === "edit" ? editImage : mode === "upscale" ? upscaleImage : removeBg}
                  isVideo={false}
                />
                {/* Action buttons */}
                <div className="flex gap-2">
                  {mode === "generate" && (
                    <>
                      <button
                        onClick={() => sendToVideo(url)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-bold hover:bg-[#D4B86A] transition-colors"
                      >
                        <Video size={12} /> Send to Video Generation
                      </button>
                      <button
                        onClick={() => sendToEdit(url)}
                        className="px-3 py-2 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
                      >
                        Edit →
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 bg-[#111118] border border-[#C9A84C] rounded-xl px-5 py-3 shadow-[0_0_30px_#C9A84C44] flex items-center gap-3 animate-slide-up">
          <Video size={14} className="text-[#C9A84C]" />
          <p className="text-sm font-body text-[#F5F0E8]">{toastMsg}</p>
        </div>
      )}
    </div>
  );
}
