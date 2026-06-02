"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";
import { UploadZone } from "@/components/ui/UploadZone";
import { DollarSign } from "lucide-react";

interface MotionModel {
  id: string;
  name: string;
  description: string;
  cost: string;
  bestFor: string;
  recommended?: boolean;
}

const MODELS: MotionModel[] = [
  {
    id: "wavespeed-ai/steady-dancer",
    name: "SteadyDancer",
    description: "14B parameter dance specialist. Best identity consistency.",
    cost: "~$0.20/run — 50 runs per $10",
    bestFor: "Dance, social content, pop locking, boogaloo, stage moves",
    recommended: true,
  },
  {
    id: "bytedance/dreamactor-v2",
    name: "DreamActor V2 (ByteDance)",
    description: "Best for expressions & gestures. Captures facial nuance.",
    cost: "$0.05/run — 20 runs per $1",
    bestFor: "Interviews, reactions, emotional performances, promos",
  },
  {
    id: "kwaivgi/kling-v2.6-pro/motion-control",
    name: "Kling 2.6 Pro Motion Control",
    description: "Cinematic final output quality. Native audio support.",
    cost: "~$0.35/run",
    bestFor: "Music video scenes, high quality deliverables",
  },
  {
    id: "kwaivgi/kling-v2.6-std/motion-control",
    name: "Kling 2.6 Standard Motion Control",
    description: "Fast iterations and testing.",
    cost: "~$0.15/run",
    bestFor: "Drafts, client previews",
  },
  {
    id: "wavespeed-ai/scail",
    name: "SCAIL",
    description: "Large motion variations. Stylized character support.",
    cost: "~$0.25/run",
    bestFor: "Complex choreography, multi-character",
  },
];

const MOTION_PRESETS = [
  { value: "fresno-pop-lock", label: "Fresno Pop Lock", group: "JEFF M DIXON SIGNATURE" },
  { value: "boogaloo-classic", label: "Boogaloo Classic", group: "JEFF M DIXON SIGNATURE" },
  { value: "soul-sway-slow", label: "Soul Sway Slow", group: "JEFF M DIXON SIGNATURE" },
  { value: "hat-tip-signature", label: "Hat Tip Signature Move", group: "JEFF M DIXON SIGNATURE" },
  { value: "stage-walk-confident", label: "Stage Walk Confident", group: "JEFF M DIXON SIGNATURE" },
  { value: "mic-stand-performance", label: "Mic Stand Performance", group: "JEFF M DIXON SIGNATURE" },
  { value: "contemporary-rnb", label: "Contemporary R&B", group: "DANCE STYLES" },
  { value: "old-school-soul", label: "Old School Soul Step", group: "DANCE STYLES" },
  { value: "gospel-praise", label: "Gospel Praise Move", group: "DANCE STYLES" },
  { value: "smooth-slow-dance", label: "Smooth Slow Dance", group: "DANCE STYLES" },
  { value: "street-freestyle", label: "Street Freestyle", group: "DANCE STYLES" },
  { value: "concert-hype", label: "Concert Hype Walk", group: "DANCE STYLES" },
  { value: "singing-performance", label: "Singing Performance", group: "PERFORMANCE" },
  { value: "emotional-ballad", label: "Emotional Ballad", group: "PERFORMANCE" },
  { value: "crowd-interaction", label: "Crowd Interaction", group: "PERFORMANCE" },
  { value: "band-intro-walk", label: "Band Introduction Walk", group: "PERFORMANCE" },
  { value: "award-show-entrance", label: "Award Show Entrance", group: "PERFORMANCE" },
  { value: "upload-custom", label: "Upload Your Own Video", group: "UPLOAD CUSTOM" },
];

const QUALITY_LABELS = ["Draft", "Cinema"];

export default function MotionTransfer() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [motionFile, setMotionFile] = useState<File | null>(null);
  const [motionPreset, setMotionPreset] = useState("fresno-pop-lock");
  const [quality, setQuality] = useState(1);
  const [identityStrength, setIdentityStrength] = useState(75);
  const [motionIntensity, setMotionIntensity] = useState(75);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!characterFile) {
      setError("Please upload a character image.");
      return;
    }
    if (!motionFile && motionPreset === "upload-custom") {
      setError("Please upload a motion reference video.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      // Upload files first - for now we use URLs (file upload to Supabase storage could be added)
      // For demo, we pass the preset as motion description
      const formData = new FormData();
      formData.append("model", selectedModel.id);
      formData.append("motionPreset", motionPreset);
      formData.append("identityStrength", String(identityStrength));
      formData.append("motionIntensity", String(motionIntensity));
      formData.append("quality", QUALITY_LABELS[quality]);
      if (characterFile) formData.append("characterImage", characterFile);
      if (motionFile) formData.append("motionVideo", motionFile);

      // Use the motion API route via JSON with temp URLs
      const res = await fetch("/api/wavespeed/motion", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProgress(30);

      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        setProgress(30 + Math.min(65, attempts * (65 / 60)));

        const statusRes = await fetch(`/api/wavespeed/status/${data.requestId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult(statusData.outputs?.[0] || "");
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "motion",
              model: selectedModel.name,
              settings: { motionPreset, identityStrength, motionIntensity, quality: QUALITY_LABELS[quality] },
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
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Motion Transfer</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1 max-w-2xl">
          Transfer movement from any video onto Jeff&apos;s photo. Upload Jeff&apos;s image + a driving video —
          the model makes Jeff perform the same moves while keeping his face, fedora, and identity locked.
        </p>
      </div>

      {/* Model selector */}
      <div className="space-y-3">
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Model</label>
        <div className="grid grid-cols-1 gap-3">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                selectedModel.id === m.id
                  ? "border-[#C9A84C] bg-[#C9A84C0D]"
                  : "border-[#C9A84C22] hover:border-[#C9A84C44] bg-[#111118]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-body font-semibold ${selectedModel.id === m.id ? "text-[#C9A84C]" : "text-[#F5F0E8]"}`}>
                      {m.name}
                    </p>
                    {m.recommended && (
                      <span className="px-1.5 py-0.5 bg-[#C9A84C] text-[#0A0A0F] text-[10px] font-body font-bold rounded uppercase">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#F5F0E877] mt-0.5">{m.description}</p>
                  <p className="text-xs text-[#F5F0E855] mt-1">Best for: {m.bestFor}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#C9A84C88] whitespace-nowrap">
                  <DollarSign size={10} />
                  <span className="font-body">{m.cost}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UploadZone
            label="Upload Jeff's photo or any character image"
            accept="image/*"
            onFile={setCharacterFile}
            file={characterFile}
            hint="JPG, PNG, WebP supported"
          />

          <div className="space-y-2">
            <UploadZone
              label="Upload driving video (motion reference)"
              accept="video/*"
              onFile={setMotionFile}
              file={motionFile}
              hint="MP4, MOV supported"
            />
            <p className="text-xs text-[#F5F0E855] text-center">— or select a motion preset —</p>
            <GoldDropdown
              value={motionPreset}
              options={MOTION_PRESETS}
              onChange={setMotionPreset}
              placeholder="Select motion preset..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Output Quality</label>
              <span className="text-sm font-body font-semibold text-[#C9A84C]">{QUALITY_LABELS[quality]}</span>
            </div>
            <input
              type="range" min={0} max={1} step={1} value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ background: `linear-gradient(to right, #C9A84C ${quality * 100}%, #3A3A4A ${quality * 100}%)` }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#F5F0E844]">
              <span>Draft</span><span>Cinema</span>
            </div>
          </div>

          <GoldSlider
            label="Identity Strength"
            min={0} max={100} value={identityStrength} defaultValue={75}
            onChange={setIdentityStrength}
            formatValue={(v) => `${v}%`}
          />
          <p className="text-xs text-[#F5F0E855] -mt-4">How strictly to preserve character appearance</p>

          <GoldSlider
            label="Motion Intensity"
            min={0} max={100} value={motionIntensity} defaultValue={75}
            onChange={setMotionIntensity}
            formatValue={(v) => `${v}%`}
          />
          <p className="text-xs text-[#F5F0E855] -mt-4">How much motion to transfer</p>

          {/* Cost estimate */}
          <div className="bg-[#C9A84C0D] border border-[#C9A84C22] rounded-lg p-3">
            <p className="text-xs text-[#C9A84C] font-body font-semibold">Estimated Cost</p>
            <p className="text-sm text-[#F5F0E8] font-body mt-1">{selectedModel.cost}</p>
          </div>

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
            {loading ? "Transferring..." : "🎭 Transfer Motion"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing progress={progress} estimatedSeconds={Math.round(30 * (1 - progress / 100))} label="Transferring motion..." />
        </div>
      )}

      {result && !loading && (
        <OutputCard
          outputUrl={result}
          model={selectedModel.name}
          section="Motion Transfer"
          settings={{ motionPreset, identityStrength: `${identityStrength}%`, motionIntensity: `${motionIntensity}%` }}
          onRegenerate={generate}
          isVideo
        />
      )}
    </div>
  );
}
