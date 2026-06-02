"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { Copy, Check, Image, Video } from "lucide-react";

interface Agent {
  id: string;
  emoji: string;
  name: string;
  title: string;
  description: string;
  systemPrompt: string;
}

const AGENTS: Agent[] = [
  {
    id: "jordan-reed",
    emoji: "🎨",
    name: "Jordan Reed",
    title: "Creative Director",
    description: "Visual identity, art direction, campaign concepting",
    systemPrompt: `You are Jordan Reed, Creative Director for Jeff M Dixon's record label. You are a world-class creative director specializing in visual identity, art direction, and campaign concepting for R&B artists. Jeff M Dixon's brand is Golden Soul — warm amber, deep black, ivory, mint. His signature is a spinning fedora. His tagline: Soul doesn't go out of style. Give expert creative direction, write precise AI generation prompts, or develop full creative briefs. Always think cinematically. Always honor the Golden Soul aesthetic.`,
  },
  {
    id: "nova-vega",
    emoji: "🎬",
    name: "Nova Vega",
    title: "Video Producer",
    description: "Music video direction, shot lists, production briefs",
    systemPrompt: `You are Nova Vega, Video Producer for Jeff M Dixon. You specialize in music video direction, shot lists, and production briefs for R&B artists. Jeff M Dixon's visual world: golden hour lighting, fedora hat as brand signature, cinematic film aesthetic, authentic soul. His catalog: Stay With Me, Eyes of An Angel, My Baby. Give expert video production direction with specific shot descriptions, camera movements, and production notes.`,
  },
  {
    id: "jade-monroe",
    emoji: "📱",
    name: "Jade Monroe",
    title: "Social Media Manager",
    description: "Platform-specific hooks, captions, content strategy",
    systemPrompt: `You are Jade Monroe, Social Media Manager for Jeff M Dixon. You understand TikTok, Instagram, and YouTube algorithms deeply. Jeff M Dixon is an established independent R&B artist relaunching — Fresno born, #1 hit at 18, film soundtrack credits, never sold out. His audience: soul nostalgics 35-55 and authenticity seekers 25-35. Write platform-specific hooks, captions, and content strategies that match his Golden Soul brand voice — authentic, earned, never try-hard.`,
  },
  {
    id: "aaliyah-stone",
    emoji: "✍️",
    name: "Aaliyah Stone",
    title: "Content Strategist",
    description: "Content calendars, editorial planning, content pillars",
    systemPrompt: `You are Aaliyah Stone, Content Strategist for Jeff M Dixon. You build content calendars, editorial plans, and content pillar strategies for R&B artists. Jeff's four content pillars: The Music, The Man, The Craft, The Community. His relaunch strategy centers on his authentic story — church choir roots, Fresno heritage, #1 independent hit, film soundtrack producer, decades of refusing bad deals. Build strategic content plans that serve his brand.`,
  },
  {
    id: "cole-watts",
    emoji: "✏️",
    name: "Cole Watts",
    title: "Copywriter",
    description: "Captions, bios, ad copy, email subject lines",
    systemPrompt: `You are Cole Watts, Copywriter for Jeff M Dixon. You write conversion copy, social captions, artist bios, ad copy and email sequences. Jeff M Dixon's voice: authentic, earned, never try-hard. His tagline: Soul doesn't go out of style. His story: #1 hit at 18, Eyes of An Angel, Me and Mrs. Jones soundtrack, independent for life. Write copy that sounds like Jeff — real, soulful, dignified. Never generic R&B marketing speak.`,
  },
];

const OUTPUT_TYPES = [
  { value: "image-prompt",  label: "🖼️ Image Prompt" },
  { value: "video-prompt",  label: "🎬 Video Prompt" },
  { value: "brief",         label: "📋 Full Creative Brief" },
  { value: "shot-list",     label: "🎬 Shot List" },
  { value: "caption",       label: "📱 Social Caption" },
  { value: "calendar",      label: "📅 Content Calendar" },
  { value: "hook",          label: "🪝 Hook / Opening Line" },
  { value: "email-subject", label: "📧 Email Subject Line" },
  { value: "bio",           label: "👤 Artist Bio" },
  { value: "ad-copy",       label: "💰 Ad Copy" },
];

const FOR_ARTIST_OPTIONS = [
  { value: "jeff-dixon", label: "Jeff M Dixon" },
  { value: "general",    label: "General / Label" },
];

export default function AgentStudio() {
  const router = useRouter();
  const [agentId, setAgentId]     = useState("jordan-reed");
  const [brief, setBrief]         = useState("");
  const [forArtist, setForArtist] = useState("jeff-dixon");
  const [outputType, setOutputType] = useState("image-prompt");
  const [loading, setLoading]     = useState(false);
  const [output, setOutput]       = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [toastMsg, setToastMsg]   = useState<string | null>(null);

  const selectedAgent = AGENTS.find((a) => a.id === agentId)!;

  const getDirection = async () => {
    if (!brief.trim()) { setError("Please describe what you need."); return; }

    setLoading(true);
    setError(null);
    setOutput("");

    const outputLabel = OUTPUT_TYPES.find((o) => o.value === outputType)?.label || outputType;
    const artistLabel = forArtist === "jeff-dixon"
      ? "Jeff M Dixon, Black male R&B artist, late 30s, Fresno California, signature black fedora, gold brand aesthetic, Golden Soul brand"
      : "the artist";

    const userMessage = `Brief: ${brief}
Output type needed: ${outputLabel}
Artist: ${artistLabel}
${outputType === "calendar"    ? "Provide a 4-week content calendar." : ""}
${outputType === "shot-list"   ? "Include shot number, description, camera movement, and lighting for each shot." : ""}
${outputType === "brief"       ? "Include overview, objectives, creative direction, deliverables, and timeline." : ""}
${outputType === "image-prompt"? "Write a detailed, precise AI image generation prompt optimized for photorealistic results." : ""}
${outputType === "video-prompt"? "Write a detailed AI video generation prompt with camera movement, lighting, and motion instructions." : ""}

Be specific, actionable, and true to the Golden Soul brand.`;

    try {
      const res = await fetch("/api/agent/direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, systemPrompt: selectedAgent.systemPrompt, userMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setOutput(data.content || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const sendToImagePrompt = () => {
    localStorage.setItem("gss_image_prompt", output);
    showToast("Prompt sent to Image Generation!");
    setTimeout(() => router.push("/image"), 800);
  };

  const sendToVideoPrompt = () => {
    localStorage.setItem("gss_video_prompt", output);
    showToast("Prompt sent to Video Generation!");
    setTimeout(() => router.push("/video"), 800);
  };

  const isImagePrompt = outputType === "image-prompt";
  const isVideoPrompt = outputType === "video-prompt" || outputType === "shot-list";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Agent Studio</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1 max-w-2xl">
          Get expert creative direction from your Marketing HQ agents. Select an agent, describe what you need,
          and receive precision prompts or briefs ready to use.
        </p>
      </div>

      {/* Agent cards */}
      <div className="space-y-2">
        <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Select Agent</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setAgentId(agent.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                agentId === agent.id
                  ? "border-[#C9A84C] bg-[#C9A84C0D]"
                  : "border-[#C9A84C22] hover:border-[#C9A84C44] bg-[#111118]"
              }`}
            >
              <p className="text-2xl mb-1">{agent.emoji}</p>
              <p className={`text-sm font-body font-semibold ${agentId === agent.id ? "text-[#C9A84C]" : "text-[#F5F0E8]"}`}>{agent.name}</p>
              <p className="text-xs text-[#C9A84C88] font-body">{agent.title}</p>
              <p className="text-xs text-[#F5F0E855] mt-1">{agent.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Brief for {selectedAgent.name}</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what you need created..."
              rows={6}
              className="w-full px-4 py-3 resize-none"
            />
          </div>
          <GoldDropdown label="For Artist" value={forArtist} options={FOR_ARTIST_OPTIONS} onChange={setForArtist} />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Output Type</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setOutputType(type.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-body transition-all border text-left ${
                    outputType === type.value
                      ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C] font-semibold"
                      : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <GoldButton size="lg" onClick={getDirection} loading={loading} disabled={loading} className="w-full">
            {loading ? "Getting Direction..." : "🤖 Get Direction"}
          </GoldButton>

          {error && <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>}
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedAgent.emoji}</span>
              <div>
                <p className="text-sm font-body font-semibold text-[#C9A84C]">{selectedAgent.name}</p>
                <p className="text-xs text-[#F5F0E855]">{selectedAgent.title}</p>
              </div>
            </div>
            {output && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                {isImagePrompt && (
                  <button
                    onClick={sendToImagePrompt}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C22] border border-[#C9A84C44] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C33] transition-colors font-body font-semibold"
                  >
                    <Image size={12} /> Send to Image Prompt
                  </button>
                )}
                {isVideoPrompt && (
                  <button
                    onClick={sendToVideoPrompt}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C22] border border-[#C9A84C44] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C33] transition-colors font-body font-semibold"
                  >
                    <Video size={12} /> Send to Video Prompt
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin-gold" />
              <p className="text-sm text-[#F5F0E877] font-body animate-pulse-gold">{selectedAgent.name} is thinking...</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-body text-sm text-[#F5F0E8CC] leading-relaxed bg-[#0A0A0F] rounded-lg p-4 border border-[#C9A84C11]">
              {output}
            </pre>
          )}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 bg-[#111118] border border-[#C9A84C] rounded-xl px-5 py-3 shadow-[0_0_30px_#C9A84C44] flex items-center gap-3 animate-slide-up">
          <Check size={14} className="text-[#C9A84C]" />
          <p className="text-sm font-body text-[#F5F0E8]">{toastMsg}</p>
        </div>
      )}
    </div>
  );
}
