"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = {
  jordan: {
    id: "jordan",
    name: "Jordan Reed",
    title: "Creative Director · Golden Soul Studio",
    initials: "JR",
    color: "#C9A84C",
    emoji: "🎨",
    welcome: "Ready to build the Golden Soul visual world.\nAsk me to generate an image, write a brief, or plan your next campaign.",
    suggestions: [
      "Generate my anchor shot — fedora, twist locs, golden hour",
      "Show me the Golden Soul color preset",
      "Create a caricature concept for social media",
    ],
    outputTags: [] as string[],
  },
  maxwell: {
    id: "maxwell",
    name: "Maxwell Cruz",
    title: "Screenwriter & Story Director",
    initials: "MC",
    color: "#6BBFB5",
    emoji: "🎬",
    welcome: "Let's build the story. Give me a concept and I'll write the full script with scene-by-scene Golden Soul Studio prompts ready to execute.",
    suggestions: [
      "Write a music video treatment for a new soul ballad",
      "Script a 60-second social content series — 5 episodes",
      "Create a short film narrative for Jeff's comeback story",
    ],
    outputTags: ["Script", "Scene Breakdown", "Shot List", "Storyboard Notes", "Production Brief", "Model Selection", "Prompt Ready", "Credit Estimate"],
  },
  nova: {
    id: "nova",
    name: "Nova Vega",
    title: "Video Producer",
    initials: "NV",
    color: "#A78BFA",
    emoji: "🎥",
    welcome: "Ready to execute. Hand me Maxwell's script or a brief — I'll handle model selection, settings, credit estimation, and quality control.",
    suggestions: [
      "What model should I use for Jeff's dance scene?",
      "Estimate credits for a 5-scene music video",
      "Optimize this shot for Instagram Reels (9:16)",
    ],
    outputTags: ["Script", "Scene Breakdown", "Shot List", "Storyboard Notes", "Production Brief", "Model Selection", "Prompt Ready", "Credit Estimate"],
  },
} as const;

type AgentId = keyof typeof AGENTS;
type Agent = typeof AGENTS[AgentId];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_urls: string[];
  created_at?: string;
}

interface ToolCall {
  name: string;
  indicator: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function newSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "default";
  let id = localStorage.getItem("gss_agent_session");
  if (!id) {
    id = newSessionId();
    localStorage.setItem("gss_agent_session", id);
  }
  return id;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div
      className="w-4 h-4 border-2 rounded-full animate-spin"
      style={{ borderColor: "#C9A84C22", borderTopColor: "#C9A84C" }}
    />
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ label, agentInitials, agentColor }: { label: string; agentInitials: string; agentColor: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={{ background: `${agentColor}22`, color: agentColor }}
      >
        {agentInitials}
      </div>
      <div
        className="rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2"
        style={{ background: "#16161F", color: "#F5F0E8AA" }}
      >
        <Spinner />
        <span>{label}</span>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  onImageClick,
  agentInitials,
  agentColor,
}: {
  msg: ChatMessage;
  onImageClick: (url: string) => void;
  agentInitials: string;
  agentColor: string;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex items-start gap-3 mb-5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={
          isUser
            ? { background: "#C9A84C", color: "#0A0A0F" }
            : { background: `${agentColor}22`, color: agentColor }
        }
      >
        {isUser ? "J" : agentInitials}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={
            isUser
              ? {
                  background: "#C9A84C22",
                  color: "#F5F0E8",
                  borderRadius: "18px 4px 18px 18px",
                  border: "1px solid #C9A84C44",
                }
              : {
                  background: "#16161F",
                  color: "#F5F0E8CC",
                  borderRadius: "4px 18px 18px 18px",
                  border: "1px solid #ffffff0d",
                }
          }
        >
          {msg.content}
        </div>

        {/* Inline images */}
        {msg.image_urls && msg.image_urls.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {msg.image_urls.map((url, i) => {
              const isVideo = /\.(mp4|webm|mov)/i.test(url);
              return isVideo ? (
                <video
                  key={i}
                  src={url}
                  controls
                  className="rounded-xl w-full max-w-md cursor-pointer"
                  style={{ border: "1px solid #C9A84C22" }}
                />
              ) : (
                <img
                  key={i}
                  src={url}
                  alt="Generated output"
                  className="rounded-xl w-full max-w-md cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ border: "1px solid #C9A84C22" }}
                  onClick={() => onImageClick(url)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <img
        src={url}
        alt="Full size"
        className="max-w-full max-h-full rounded-2xl object-contain"
        style={{ boxShadow: "0 0 60px #C9A84C33" }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: "#1a1a22", color: "#F5F0E8", border: "1px solid #C9A84C33" }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Import modal ──────────────────────────────────────────────────────────────
function ImportModal({ sessionId, onClose, onImported }: { sessionId: string; onClose: () => void; onImported: () => void }) {
  const [json, setJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    let parsed;
    try { parsed = JSON.parse(json); } catch { setError("Invalid JSON"); return; }
    if (!Array.isArray(parsed)) { setError("Expected a JSON array of {role, content} objects"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, messages: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      onImported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 space-y-4"
        style={{ background: "#111118", border: "1px solid #C9A84C33" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold" style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif" }}>
          Import Conversation
        </h2>
        <p className="text-xs" style={{ color: "#F5F0E877" }}>
          Paste a JSON array of messages: <code className="text-xs" style={{ color: "#6BBFB5" }}>{"[{\"role\":\"user\",\"content\":\"...\"}]"}</code>
        </p>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={8}
          placeholder='[{"role":"user","content":"..."}, {"role":"assistant","content":"..."}]'
          className="w-full px-3 py-2 text-xs font-mono resize-none rounded-lg"
          style={{ background: "#0A0A0F", border: "1px solid #C9A84C22", color: "#F5F0E8", outline: "none" }}
        />
        {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={loading || !json.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity"
            style={{ background: "#C9A84C", color: "#0A0A0F", opacity: loading || !json.trim() ? 0.5 : 1 }}
          >
            {loading ? "Importing..." : "Import"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm"
            style={{ background: "#16161F", color: "#F5F0E8AA", border: "1px solid #ffffff11" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AgentStudio() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("default");
  const [loading, setLoading] = useState(false);
  const [toolIndicator, setToolIndicator] = useState<string>("Thinking...");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>("jordan");
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const agent: Agent = AGENTS[selectedAgentId];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Lock main scroll so chat manages its own ────────────────────────────────
  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (main) {
      main.style.overflow = "hidden";
      return () => { main.style.overflow = ""; };
    }
  }, []);

  // ── Load session and history ────────────────────────────────────────────────
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    loadHistory(sid);
  }, []);

  const loadHistory = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/agent/history?session_id=${encodeURIComponent(sid)}&limit=50`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: ChatMessage) => ({
          ...m,
          image_urls: m.image_urls || [],
        })));
      }
    } catch {
      // silent — history is not critical
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Switch agent (starts a new session) ──────────────────────────────────────
  const switchAgent = (id: AgentId) => {
    if (id === selectedAgentId) { setShowAgentPicker(false); return; }
    setSelectedAgentId(id);
    setShowAgentPicker(false);
    const sid = newSessionId();
    localStorage.setItem("gss_agent_session", sid);
    setSessionId(sid);
    setMessages([]);
    setHistoryLoaded(true);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      image_urls: [],
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setToolIndicator(`${agent.name} is thinking...`);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId, agent_id: selectedAgentId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      if (data.tool_calls && data.tool_calls.length > 0) {
        const lastTool = data.tool_calls[data.tool_calls.length - 1] as ToolCall;
        setToolIndicator(lastTool.indicator);
      }

      const assistantMsg: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: data.content || "",
        image_urls: data.images || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  // ── New session ─────────────────────────────────────────────────────────────
  const newSession = () => {
    const sid = newSessionId();
    localStorage.setItem("gss_agent_session", sid);
    setSessionId(sid);
    setMessages([]);
    setHistoryLoaded(true);
  };

  // ── Textarea auto-resize + Enter to send ────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", background: "#0A0A0F" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid #C9A84C1A", background: "#0A0A0F" }}
      >
        {/* Agent selector */}
        <div className="relative">
          <button
            onClick={() => setShowAgentPicker((v) => !v)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all"
            style={{ background: showAgentPicker ? "#16161F" : "transparent" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${agent.color}33, ${agent.color}66)`,
                color: agent.color,
                border: `1px solid ${agent.color}44`,
              }}
            >
              {agent.initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: agent.color, fontFamily: "'Cormorant Garamond', serif", fontSize: "16px" }}>
                {agent.name}
              </p>
              <p className="text-xs" style={{ color: "#F5F0E855" }}>{agent.title}</p>
            </div>
            <svg
              style={{
                marginLeft: "4px",
                transform: showAgentPicker ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                color: "#F5F0E844",
                flexShrink: 0,
              }}
              width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {/* Dropdown */}
          {showAgentPicker && (
            <div
              className="absolute top-full left-0 mt-2 w-72 rounded-2xl overflow-hidden z-40"
              style={{ background: "#111118", border: "1px solid #C9A84C22", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
            >
              {(Object.values(AGENTS) as Agent[]).map((a) => (
                <button
                  key={a.id}
                  onClick={() => switchAgent(a.id as AgentId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                  style={{ borderBottom: "1px solid #ffffff08" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${a.color}22`, color: a.color, border: `1px solid ${a.color}33` }}
                  >
                    {a.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: a.id === selectedAgentId ? a.color : "#F5F0E8CC" }}>
                      {a.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#F5F0E855" }}>{a.title}</p>
                  </div>
                  {a.id === selectedAgentId && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "#16161F", color: "#F5F0E877", border: "1px solid #ffffff11" }}
          >
            Import
          </button>
          <button
            onClick={newSession}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "#16161F", color: "#F5F0E877", border: "1px solid #ffffff11" }}
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ scrollbarColor: "#C9A84C22 transparent" }}
        onClick={() => setShowAgentPicker(false)}
      >
        <div className="max-w-3xl mx-auto">
          {/* Welcome state */}
          {historyLoaded && messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: `${agent.color}1A`, border: `1px solid ${agent.color}33` }}
              >
                {agent.emoji}
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: agent.color, fontFamily: "'Cormorant Garamond', serif" }}>
                  {agent.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#F5F0E855" }}>{agent.title}</p>
                <p className="text-sm mt-2" style={{ color: "#F5F0E855" }}>
                  {agent.welcome}
                </p>
              </div>

              {agent.outputTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                  {agent.outputTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs"
                      style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {agent.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="px-3 py-2 rounded-xl text-xs text-left transition-all"
                    style={{ background: "#16161F", color: "#F5F0E8AA", border: "1px solid #C9A84C22" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onImageClick={setLightboxUrl}
              agentInitials={agent.initials}
              agentColor={agent.color}
            />
          ))}

          {/* Typing indicator */}
          {loading && (
            <TypingIndicator
              label={toolIndicator}
              agentInitials={agent.initials}
              agentColor={agent.color}
            />
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#2a0a0a", border: "1px solid #f8717144", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid #C9A84C1A", background: "#0A0A0F" }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-2xl"
            style={{ background: "#111118", border: "1px solid #C9A84C22" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agent.name} anything...`}
              rows={1}
              disabled={loading}
              className="w-full resize-none bg-transparent text-sm outline-none rounded-2xl"
              style={{
                color: "#F5F0E8",
                lineHeight: "1.5",
                fontFamily: "'Montserrat', sans-serif",
                minHeight: "52px",
                maxHeight: "160px",
                overflowY: "auto",
                padding: "16px 56px 16px 16px",
                display: "block",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: loading || !input.trim() ? "#C9A84C22" : "#C9A84C",
                color: loading || !input.trim() ? "#C9A84C55" : "#0A0A0F",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "#F5F0E833" }}>
            Enter to send · Shift+Enter for new line · Images render inline
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          sessionId={sessionId}
          onClose={() => setShowImport(false)}
          onImported={() => loadHistory(sessionId)}
        />
      )}
    </div>
  );
}
