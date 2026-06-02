"use client";

import React, { useState } from "react";
import { Download, Save, Share2, RefreshCw, Play, Image as ImageIcon } from "lucide-react";

interface OutputCardProps {
  outputUrl?: string;
  thumbnailUrl?: string;
  model: string;
  section: string;
  prompt?: string;
  settings?: Record<string, unknown>;
  onSave?: () => void;
  onRegenerate?: () => void;
  isVideo?: boolean;
}

export function OutputCard({
  outputUrl,
  thumbnailUrl,
  model,
  section,
  prompt,
  settings,
  onSave,
  onRegenerate,
  isVideo = false,
}: OutputCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `golden-soul-${section}-${Date.now()}`;
    a.click();
  };

  const handleShare = async () => {
    if (!outputUrl) return;
    try {
      await navigator.clipboard.writeText(outputUrl);
      alert("URL copied to clipboard");
    } catch {
      alert(outputUrl);
    }
  };

  return (
    <div className="bg-[#111118] border border-[#C9A84C22] rounded-xl overflow-hidden animate-slide-up">
      {/* Preview */}
      <div className="relative bg-[#16161F] aspect-video flex items-center justify-center">
        {outputUrl ? (
          isVideo ? (
            <video
              src={outputUrl}
              poster={thumbnailUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={outputUrl}
              alt="Generated output"
              className="w-full h-full object-contain"
            />
          )
        ) : thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt="Thumbnail"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#F5F0E844]">
            {isVideo ? <Play size={32} /> : <ImageIcon size={32} />}
            <span className="text-xs">No preview</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#C9A84C] font-body font-semibold uppercase tracking-wider">
              {section}
            </p>
            <p className="text-sm text-[#F5F0E8] font-body font-medium mt-0.5">{model}</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-[#F5F0E844] hover:text-[#C9A84C] transition-colors"
          >
            {showSettings ? "Hide" : "Settings"}
          </button>
        </div>

        {prompt && (
          <p className="text-xs text-[#F5F0E877] line-clamp-2 font-body">{prompt}</p>
        )}

        {showSettings && settings && (
          <div className="bg-[#0A0A0F] rounded-lg p-3 text-xs font-mono text-[#F5F0E866] space-y-1">
            {Object.entries(settings).map(([k, v]) => (
              <div key={k}>
                <span className="text-[#C9A84C88]">{k}:</span>{" "}
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={!outputUrl}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-semibold hover:bg-[#D4B86A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            Download
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="p-2 bg-[#16161F] border border-[#C9A84C33] rounded-lg text-[#C9A84C] hover:bg-[#C9A84C11] transition-colors"
              title="Save to history"
            >
              <Save size={14} />
            </button>
          )}
          <button
            onClick={handleShare}
            disabled={!outputUrl}
            className="p-2 bg-[#16161F] border border-[#C9A84C33] rounded-lg text-[#C9A84C] hover:bg-[#C9A84C11] transition-colors disabled:opacity-40"
            title="Share"
          >
            <Share2 size={14} />
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-2 bg-[#16161F] border border-[#C9A84C33] rounded-lg text-[#C9A84C] hover:bg-[#C9A84C11] transition-colors"
              title="Regenerate"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
