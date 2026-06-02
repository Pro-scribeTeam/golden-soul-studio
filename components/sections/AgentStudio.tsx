"use client";

import React, { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { Copy, Check } from "lucide-react";

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
    systemPrompt: `You are Jordan Reed, Creative Director for Jeff M Dixon's marketing team. You specialize in visual identity, art direction, and campaign concepting. You understand Jeff's brand deeply: gold #C9A84C on deep black, soulful R&B aesthetic, Fresno California heritage, the classic fedora signature. Your output is precise, creative, and immediately actionable.`,
  },
  {
    id: "nova-vega",
    emoji: "🎬",
    name: "Nova Vega",
    title: "Video Producer",
    description: "Music video direction, shot lists, production briefs",
    systemPrompt: `You are Nova Vega, Video Producer for Jeff M Dixon. You specialize in music video direction, shot composition, cinematic storytelling, and production briefs. You understand Jeff's visual world: golden hour lighting, authentic emotion, the fedora as a signature element, Fresno California as a spiritual location. Your briefs are detailed and ready to hand off to a director or AI generation system.`,
  },
  {
    id: "jade-monroe",
    emoji: "📱",
    name: "Jade Monroe",
    title: "Social Media Manager",
    description: "Platform-specific hooks, captions, content strategy",
    systemPrompt: `You are Jade Monroe, Social Media Manager for Jeff M Dixon. You create platform-native content: TikTok hooks, Instagram captions, Twitter/X posts, YouTube descriptions. You understand what makes R&B audiences engage, how to position Jeff as an authentic soul artist, and how to convert listeners into loyal fans. Your captions are punchy, genuine, and on-brand.`,
  },
  {
    id: "aaliyah-stone",
    emoji: "✍️",
    name: "Aaliyah Stone",
    title: "Content Strategist",
    description: "Content calendars, editorial planning, content pillars",
    systemPrompt: `You are Aaliyah Stone, Content Strategist for Jeff M Dixon. You create comprehensive content calendars, establish content pillars, and build editorial frameworks that grow Jeff's audience over time. You think in 30/60/90 day cycles and understand the rhythm of the music industry release calendar.`,
  },
  {
    id: "cole-watts",
    emoji: "✏️",
    name: "Cole Watts",
    title: "Copywriter",
    description: "Captions, bios, ad copy, email subject lines",
    systemPrompt: `You are Cole Watts, Copywriter for Jeff M Dixon. You write bios, press releases, email campaigns, ad copy, and short-form content that captures Jeff's voice — dignified, soulful, authentic, with a Fresno California spirit. Every word earns its place.`,
  },
];

const OUTPUT_TYPES = [
  { value: "prompt", label: "📝 AI Prompt" },
  { value: "brief", label: "📋 Full Creative Brief" },
  { value: "shot-list", label: "🎬 Shot List" },
  { value: "caption", label: "📱 Social Caption" },
  { value: "calendar", label: "📅 Content Calendar" },
  { value: "hook", label: "🪝 Hook/Opening Line" },
  { value: "email-subject", label: "📧 Email Subject Line" },
];

const FOR_ARTIST_OPTIONS = [
  { value: "jeff-dixon", label: "Jeff M Dixon" },
  { value: "general", label: "General / Label" },
];

export default function AgentStudio() {
  const [agentId, setAgentId] = useState("jordan-reed");
  const [brief, setBrief] = useState("");
  const [forArtist, setForArtist] = useState("jeff-dixon");
  const [outputType, setOutputType] = useState("prompt");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedAgent = AGENTS.find((a) => a.id === agentId)!;

  const getDirection = async () => {
    if (!brief.trim()) {
      setError("Please describe what you need.");
      return;
    }

    setLoading(true);
    setError(null);
    setOutput("");

    const outputLabel = OUTPUT_TYPES.find((o) => o.value === outputType)?.label || outputType;
    const artistLabel = forArtist === "jeff-dixon" ? "Jeff M Dixon, Black male R&B artist, late 30s, Fresno California, signature black fedora, gold brand aesthetic" : "the artist";

    const userMessage = `Create a ${outputLabel} for ${artistLabel}.

Request: ${brief}

Output type: ${outputLabel}
${outputType === "calendar" ? "Provide a 4-week content calendar." : ""}
${outputType === "shot-list" ? "Include shot number, description, camera movement, and lighting for each shot." : ""}
${outputType === "brief" ? "Include overview, objectives, creative direction, deliverables, and timeline." : ""}

Be specific, actionable, and true to the brand.`;

    try {
      const res = await fetch("/api/agent/direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          systemPrompt: selectedAgent.systemPrompt,
          userMessage,
        }),
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Agent Studio</h1>
        <p className="text-[#F5F0E877] text-sm font-body mt-1 max-w-2xl">
          Get expert creative direction from your Marketing HQ agents. Select an agent, describe what you need,
          and receive a precision prompt or brief ready to use.
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
              <p className={`text-sm font-body font-semibold ${agentId === agent.id ? "text-[#C9A84C]" : "text-[#F5F0E8]"}`}>
                {agent.name}
              </p>
              <p className="text-xs text-[#C9A84C88] font-body">{agent.title}</p>
              <p className="text-xs text-[#F5F0E855] mt-1">{agent.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
              Brief for {selectedAgent.name}
            </label>
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

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-sm text-red-300 font-body">{error}</div>
          )}
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedAgent.emoji}</span>
              <div>
                <p className="text-sm font-body font-semibold text-[#C9A84C]">{selectedAgent.name}</p>
                <p className="text-xs text-[#F5F0E855]">{selectedAgent.title}</p>
              </div>
            </div>
            {output && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#C9A84C11] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C22] transition-colors font-body"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin-gold" />
              <p className="text-sm text-[#F5F0E877] font-body animate-pulse-gold">
                {selectedAgent.name} is thinking...
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-body text-sm text-[#F5F0E8CC] leading-relaxed bg-[#0A0A0F] rounded-lg p-4 border border-[#C9A84C11]">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
