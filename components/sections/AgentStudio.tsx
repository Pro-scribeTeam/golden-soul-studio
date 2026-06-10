"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

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
function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: "#C9A84C22", color: "#C9A84C" }}
      >
        J
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
}: {
  msg: ChatMessage;
  onImageClick: (url: string) => void;
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
            : { background: "#C9A84C22", color: "#C9A84C" }
        }
      >
        {isUser ? "J" : "JR"}
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
  const [toolIndicator, setToolIndicator] = useState<string>("Jordan is thinking...");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setToolIndicator("Jordan is thinking...");

    // Resize textarea back
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      // Update indicator for any tool calls
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
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)", color: "#0A0A0F" }}
          >
            JR
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif", fontSize: "16px" }}>
              Jordan Reed
            </p>
            <p className="text-xs" style={{ color: "#F5F0E855" }}>Creative Director · Golden Soul Studio</p>
          </div>
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
      <div className="flex-1 overflow-y-auto px-4 py-5" style={{ scrollbarColor: "#C9A84C22 transparent" }}>
        <div className="max-w-3xl mx-auto">
          {/* Welcome state */}
          {historyLoaded && messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, #C9A84C22, #C9A84C44)", border: "1px solid #C9A84C33" }}
              >
                🎨
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: "#C9A84C", fontFamily: "'Cormorant Garamond', serif" }}>
                  Jordan Reed, Creative Director
                </p>
                <p className="text-sm mt-1" style={{ color: "#F5F0E855" }}>
                  Ready to build the Golden Soul visual world.<br />
                  Ask me to generate an image, write a brief, or plan your next campaign.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  "Generate my anchor shot — fedora, twist locs, golden hour",
                  "Show me the Golden Soul color preset",
                  "Create a caricature concept for social media",
                ].map((suggestion) => (
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
            <MessageBubble key={msg.id} msg={msg} onImageClick={setLightboxUrl} />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator label={toolIndicator} />}

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
              placeholder="Ask Jordan anything — generate images, plan campaigns, write briefs..."
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
