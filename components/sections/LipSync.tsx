"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";
import { UploadZone } from "@/components/ui/UploadZone";
import { Music } from "lucide-react";

interface LipSyncModel {
  id: string;
  name: string;
  description: string;
  cost?: string;
  bestFor: string;
  badge?: string;
}

const MODELS: LipSyncModel[] = [
  {
    id: "wavespeed-ai/ai-music-video-generator",
    name: "AI Music Video Generator",
    description: "Photo + song = full music video. Cinematic angles, transitions, perfect lip sync.",
    cost: "Per minute",
    bestFor: "Full song videos, social cuts, lyric videos — up to 10 minutes",
    badge: "JEFF'S MUSIC VIDEO TOOL",
  },
  {
    id: "sync/lipsync-3",
    name: "Sync LipSync-3",
    description: "16B parameters, native 4K. Built-in obstruction detection. 95+ language support.",
    cost: "$0.134/sec",
    bestFor: "Final deliverables, professional music videos",
  },
  {
    id: "sync/lipsync-2-pro",
    name: "Sync LipSync-2-Pro",
    description: "Diffusion super resolution. Fine facial detail. Style preservation.",
    cost: "~$0.08/sec",
    bestFor: "Close-up shots, detail-critical content",
  },
  {
    id: "sync/lipsync-1-9-0",
    name: "Sync LipSync-1.9.0",
    description: "Most natural movement. Zero-shot technology. No training required.",
    cost: "~$0.06/sec",
    bestFor: "Natural performances, interview style",
  },
  {
    id: "sync/lipsync-2",
    name: "Sync LipSync-2",
    description: "Reliable workhorse. Great for social content.",
    cost: "~$0.05/sec",
    bestFor: "Quick turnaround, high volume content",
  },
  {
    id: "kwaivgi/kling-lipsync",
    name: "Kling LipSync",
    description: "Talking head specialist. Strong on generated faces.",
    cost: "~$0.10/run",
    bestFor: "AI-generated characters",
  },
  {
    id: "bytedance/lipsync",
    name: "ByteDance LipSync",
    description: "Frame by frame precision. Audio replacement specialist.",
    cost: "~$0.07/sec",
    bestFor: "Dubbing, localization",
  },
  {
    id: "wavespeed-ai/infinitetalk",
    name: "InfiniteTalk",
    description: "Single photo to full avatar. Up to 10 minutes 720p.",
    cost: "~$0.10/min",
    bestFor: "Presenter videos, social content series",
  },
  {
    id: "wavespeed-ai/infinitetalk-multi",
    name: "InfiniteTalk Multi",
    description: "Two characters simultaneously with two audio tracks.",
    cost: "~$0.15/min",
    bestFor: "Duets, interviews, dialogue content",
  },
  {
    id: "pixverse/lipsync",
    name: "PixVerse LipSync",
    description: "Advanced mouth movement. Precise timing algorithms.",
    cost: "~$0.08/sec",
    bestFor: "Animated content, stylized characters",
  },
];

const SAVED_TRACKS = [
  { value: "stay-with-me", label: "Stay With Me" },
  { value: "eyes-of-an-angel", label: "Eyes of An Angel" },
  { value: "my-baby", label: "My Baby" },
];

const SYNC_MODES = [
  { value: "auto", label: "Auto — Let model decide" },
  { value: "cut-off", label: "Cut Off — Trim to audio length" },
  { value: "silence", label: "Silence — Pad with silence" },
  { value: "loop", label: "Loop — Loop video to match" },
  { value: "bounce", label: "Bounce — Bounce loop" },
];

export default function LipSync() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [savedTrack, setSavedTrack] = useState("");
  const [syncMode, setSyncMode] = useState("auto");
  const [expressionIntensity, setExpressionIntensity] = useState(60);
  const [mouthSensitivity, setMouthSensitivity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!videoFile) {
      setError("Please upload a video or photo.");
      return;
    }
    if (!audioFile && !savedTrack) {
      setError("Please upload an audio track or select a saved track.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      const res = await fetch("/api/wavespeed/lipsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel.id,
          videoUrl: URL.createObjectURL(videoFile),
          audioUrl: audioFile ? URL.createObjectURL(audioFile) : savedTrack,
          syncMode,
          expressionIntensity,
          mouthSensitivity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProgress(25);

      let attempts = 0;
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        setProgress(25 + Math.min(70, attempts * (70 / 60)));

        const statusRes = await fetch(`/api/wavespeed/status/${data.requestId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult(statusData.outputs?.[0] || "");
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "lipsync",
              model: selectedModel.name,
              settings: { syncMode, expressionIntensity, mouthSensitivity },
              output_url: statusData.outputs?.[0],
            }),
          });
          break;
        }
        if (statusData.status === "failed") throw new Error(statusData.error || "Failed");
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
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Lip Sync</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          All models via WaveSpeed — single API key, no extra cost
        </p>
      </div>

      {/* Model selector */}
      <div className="space-y-3">
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Model</label>
        {[
          { label: "MUSIC VIDEO SPECIALIST", models: MODELS.slice(0, 1) },
          { label: "PROFESSIONAL SYNC", models: MODELS.slice(1, 4) },
          { label: "FAST & EFFICIENT", models: MODELS.slice(4, 7) },
          { label: "AVATAR", models: MODELS.slice(7) },
        ].map(({ label, models }) => (
          <div key={label}>
            <p className="text-xs text-[#C9A84C88] font-body uppercase tracking-widest mb-2">— {label} —</p>
            <div className="space-y-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                    selectedModel.id === m.id
                      ? "border-[#C9A84C] bg-[#C9A84C0D]"
                      : "border-[#C9A84C22] hover:border-[#C9A84C44] bg-[#111118]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-body font-semibold ${selectedModel.id === m.id ? "text-[#C9A84C]" : "text-[#F5F0E8]"}`}>
                          {m.name}
                        </p>
                        {m.badge && (
                          <span className="px-1.5 py-0.5 bg-[#C9A84C] text-[#0A0A0F] text-[10px] font-body font-bold rounded">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#F5F0E877] mt-0.5">{m.description}</p>
                      <p className="text-xs text-[#F5F0E855] mt-1">Best for: {m.bestFor}</p>
                    </div>
                    {m.cost && (
                      <span className="text-xs text-[#C9A84C88] font-body whitespace-nowrap">{m.cost}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UploadZone
            label="Upload video or photo"
            accept="video/*,image/*"
            onFile={setVideoFile}
            file={videoFile}
            hint="Video for sync — Photo for AI Music Video Generator / InfiniteTalk"
          />

          <div className="space-y-3">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Audio Track</label>
            <UploadZone
              label="Upload Jeff's vocal or music track"
              accept="audio/*"
              onFile={setAudioFile}
              file={audioFile}
              hint="MP3, WAV, M4A supported"
            />
            <p className="text-xs text-[#F5F0E855] text-center">— or select a saved track —</p>
            <div className="flex gap-2 flex-wrap">
              {SAVED_TRACKS.map((track) => (
                <button
                  key={track.value}
                  onClick={() => setSavedTrack(track.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body transition-all ${
                    savedTrack === track.value
                      ? "bg-[#C9A84C] text-[#0A0A0F] font-semibold"
                      : "bg-[#111118] border border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  <Music size={12} />
                  {track.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <GoldDropdown label="Sync Mode" value={syncMode} options={SYNC_MODES} onChange={setSyncMode} />

          <GoldSlider
            label="Expression Intensity"
            min={0} max={100} value={expressionIntensity} defaultValue={60}
            onChange={setExpressionIntensity}
            formatValue={(v) => v < 30 ? "Subtle" : v > 70 ? "Full" : `${v}%`}
          />

          <GoldSlider
            label="Mouth Sensitivity"
            min={0} max={100} value={mouthSensitivity} defaultValue={50}
            onChange={setMouthSensitivity}
            formatValue={(v) => v < 30 ? "Natural" : v > 70 ? "Precise" : `${v}%`}
          />

          {/* Cost estimate */}
          {selectedModel.cost && (
            <div className="bg-[#C9A84C0D] border border-[#C9A84C22] rounded-lg p-3">
              <p className="text-xs text-[#C9A84C] font-body font-semibold">Estimated Cost</p>
              <p className="text-sm text-[#F5F0E8] font-body mt-1">{selectedModel.cost}</p>
              <p className="text-xs text-[#F5F0E855] mt-1">Based on selected model and video length</p>
            </div>
          )}

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
            {loading ? "Syncing..." : "👄 Sync Video"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing progress={progress} estimatedSeconds={Math.round(45 * (1 - progress / 100))} label="Syncing audio to video..." />
        </div>
      )}

      {result && !loading && (
        <OutputCard
          outputUrl={result}
          model={selectedModel.name}
          section="Lip Sync"
          settings={{ syncMode, expressionIntensity: `${expressionIntensity}%`, mouthSensitivity: `${mouthSensitivity}%` }}
          onRegenerate={generate}
          isVideo
        />
      )}
    </div>
  );
}
