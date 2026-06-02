"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { UploadZone } from "@/components/ui/UploadZone";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { OutputCard } from "@/components/ui/OutputCard";

const PLATFORMS = [
  { id: "tiktok-916", label: "TikTok 9:16", ratio: "9:16" },
  { id: "reels-916", label: "Reels 9:16", ratio: "9:16" },
  { id: "youtube-169", label: "YouTube 16:9", ratio: "16:9" },
  { id: "story-916", label: "Story 9:16", ratio: "9:16" },
  { id: "feed-11", label: "Feed Post 1:1", ratio: "1:1" },
  { id: "pinterest-23", label: "Pinterest 2:3", ratio: "2:3" },
  { id: "twitter-169", label: "Twitter/X 16:9", ratio: "16:9" },
  { id: "linkedin-11", label: "LinkedIn 1:1", ratio: "1:1" },
  { id: "ytshort-916", label: "YouTube Short 9:16", ratio: "9:16" },
];

const TEMPLATE_STYLES = [
  { value: "music-video-teaser", label: "Music Video Teaser" },
  { value: "artist-introduction", label: "Artist Introduction" },
  { value: "behind-the-scenes", label: "Behind The Scenes" },
  { value: "fan-appreciation", label: "Fan Appreciation" },
  { value: "new-release-announcement", label: "New Release Announcement" },
  { value: "lyric-visual-card", label: "Lyric Visual Card" },
  { value: "concert-show-promo", label: "Concert or Show Promo" },
  { value: "throwback-archive", label: "Throwback Archive Moment" },
  { value: "collab-announcement", label: "Collaboration Announcement" },
  { value: "press-quote-card", label: "Press Quote Card" },
  { value: "award-achievement", label: "Award or Achievement" },
  { value: "cta-follow", label: "Call To Action Follow" },
  { value: "countdown-release", label: "Countdown to Release" },
  { value: "studio-session", label: "Studio Session Snippet" },
];

const FONTS = [
  { value: "Cormorant Garamond", label: "Cormorant Garamond (elegant)" },
  { value: "Montserrat", label: "Montserrat (modern clean)" },
  { value: "Playfair Display", label: "Playfair Display (editorial)" },
  { value: "DM Sans", label: "DM Sans (minimal)" },
];

const TEXT_ANIMATIONS = ["Fade In", "Slide Up", "Rise", "Typewriter", "Flash", "None"];
const TEXT_POSITIONS = ["Top", "Middle", "Bottom", "Top Left", "Top Right", "Bottom Left", "Bottom Right"];
const LOGO_POSITIONS = ["Top Left", "Top Right", "Bottom Left", "Bottom Right", "None"];
const AUDIO_OPTIONS = [
  { value: "upload", label: "Upload custom audio" },
  { value: "stay-with-me", label: "Stay With Me" },
  { value: "eyes-of-an-angel", label: "Eyes of An Angel" },
  { value: "my-baby", label: "My Baby" },
  { value: "none", label: "No audio" },
];

export default function UGCTemplates() {
  const [platform, setPlatform] = useState("reels-916");
  const [templateStyle, setTemplateStyle] = useState("music-video-teaser");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [font, setFont] = useState("Cormorant Garamond");
  const [textAnimation, setTextAnimation] = useState("Fade In");
  const [textPosition, setTextPosition] = useState("Bottom");
  const [logoPosition, setLogoPosition] = useState("Bottom Right");
  const [audio, setAudio] = useState("none");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      const res = await fetch("/api/wavespeed/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "wavespeed-ai/wan-v2.2-t2v-480p",
          prompt: `${templateStyle} template for R&B artist Jeff M Dixon. Platform: ${platform}. Text overlay: "${overlayText}". Style: cinematic social media content, brand colors gold and black.`,
          duration: 15,
          quality: "Standard",
          aspectRatio: PLATFORMS.find((p) => p.id === platform)?.ratio || "9:16",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProgress(25);
      let attempts = 0;
      while (attempts < 40) {
        await new Promise((r) => setTimeout(r, 3000));
        attempts++;
        setProgress(25 + Math.min(70, attempts * (70 / 40)));
        const statusRes = await fetch(`/api/wavespeed/status/${data.requestId}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed" || statusData.outputs?.length) {
          setProgress(100);
          setResult(statusData.outputs?.[0] || "");
          await fetch("/api/supabase/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section: "ugc",
              model: "WaveSpeed Video",
              settings: { platform, templateStyle, overlayText, font, textAnimation, textPosition, logoPosition, audio },
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">UGC Templates</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1">
          Create platform-ready social content for Jeff M Dixon
        </p>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Platform Format</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-2 rounded-lg text-xs font-body font-medium transition-all border ${
                platform === p.id
                  ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                  : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GoldDropdown label="Template Style" value={templateStyle} options={TEMPLATE_STYLES} onChange={setTemplateStyle} />

          <UploadZone
            label="Upload video or image base"
            accept="video/*,image/*"
            onFile={setMediaFile}
            file={mediaFile}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Text Overlay</label>
            <input
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Enter overlay text..."
              className="w-full px-4 py-2.5"
            />
          </div>

          <GoldDropdown label="Font" value={font} options={FONTS} onChange={setFont} />
          <GoldDropdown label="Audio" value={audio} options={AUDIO_OPTIONS} onChange={setAudio} />
        </div>

        <div className="space-y-6">
          {/* Text Animation */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Text Animation</label>
            <div className="flex flex-wrap gap-2">
              {TEXT_ANIMATIONS.map((anim) => (
                <button
                  key={anim}
                  onClick={() => setTextAnimation(anim)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all border ${
                    textAnimation === anim
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>

          {/* Text Position */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Text Position</label>
            <div className="flex flex-wrap gap-2">
              {TEXT_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setTextPosition(pos)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all border ${
                    textPosition === pos
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Position */}
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Logo Placement</label>
            <div className="flex flex-wrap gap-2">
              {LOGO_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setLogoPosition(pos)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all border ${
                    logoPosition === pos
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <GoldButton size="lg" onClick={generate} loading={loading} disabled={loading} className="w-full">
            {loading ? "Generating..." : "📱 Generate UGC"}
          </GoldButton>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6">
          <LoadingRing progress={progress} label="Creating your UGC template..." />
        </div>
      )}

      {result && !loading && (
        <OutputCard
          outputUrl={result}
          model="WaveSpeed Video"
          section="UGC Templates"
          settings={{ platform, templateStyle, textAnimation, textPosition }}
          onRegenerate={generate}
          isVideo
        />
      )}
    </div>
  );
}
