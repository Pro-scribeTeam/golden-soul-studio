"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Trash2, RefreshCw, Expand, X } from "lucide-react";

interface HistoryItem {
  id: string;
  section: string;
  model: string;
  prompt?: string;
  settings?: Record<string, unknown>;
  output_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

const SECTION_FILTERS = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "motion", label: "Motion" },
  { value: "lipsync", label: "Lip Sync" },
  { value: "color", label: "Color" },
  { value: "ugc", label: "UGC" },
  { value: "design", label: "Design" },
];

const SORT_OPTIONS = ["Newest", "Oldest", "Section"];

const SECTION_COLORS: Record<string, string> = {
  video: "#C9A84C",
  image: "#6BBFB5",
  motion: "#D4B86A",
  lipsync: "#B5D4C9",
  color: "#E8A050",
  ugc: "#A84CC9",
  design: "#4CA8C9",
  agent: "#C94C6B",
};

export default function OutputHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("Newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supabase/history${filter !== "all" ? `?section=${filter}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      // fail silently - Supabase may not be configured
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const sortedItems = [...items].sort((a, b) => {
    if (sort === "Newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "Oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === "Section") return a.section.localeCompare(b.section);
    return 0;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(sortedItems.map((i) => i.id)));
  const clearSelection = () => setSelected(new Set());

  const deleteItem = async (id: string) => {
    await fetch("/api/supabase/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const deleteSelected = async () => {
    await Promise.all([...selected].map(deleteItem));
    clearSelection();
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.includes("video") ? "mp4" : blob.type.includes("png") ? "png" : "jpg";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${filename}.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadSelected = () => {
    sortedItems
      .filter((i) => selected.has(i.id) && i.output_url)
      .forEach((item) => {
        downloadFile(item.output_url!, `golden-soul-${item.section}-${item.id}`);
      });
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#C9A84C]">Output History</h1>
          <p className="text-[#F5F0E877] text-sm font-body mt-1">Last 20 generations across all sections</p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-3 py-2 bg-[#111118] border border-[#C9A84C33] rounded-lg text-xs text-[#C9A84C] hover:bg-[#C9A84C0D] transition-colors font-body"
        >
          <RefreshCw size={12} className={loading ? "animate-spin-gold" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {SECTION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all border ${
                filter === f.value
                  ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
                  : "bg-[#111118] border-[#C9A84C33] text-[#F5F0E8AA] hover:border-[#C9A84C66]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#F5F0E855] font-body">Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2.5 py-1 rounded text-xs font-body transition-colors ${
                sort === s ? "text-[#C9A84C] font-semibold" : "text-[#F5F0E855] hover:text-[#F5F0E8AA]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#C9A84C0D] border border-[#C9A84C22] rounded-lg p-3">
          <span className="text-sm font-body text-[#C9A84C]">{selected.size} selected</span>
          <button onClick={downloadSelected} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-semibold hover:bg-[#D4B86A] transition-colors">
            <Download size={12} /> Download Selected
          </button>
          <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 text-red-300 rounded-lg text-xs font-body hover:bg-red-800 transition-colors">
            <Trash2 size={12} /> Delete Selected
          </button>
          <button onClick={clearSelection} className="ml-auto text-xs text-[#F5F0E855] hover:text-[#F5F0E8] font-body">
            Clear
          </button>
        </div>
      )}

      {/* Select all */}
      {sortedItems.length > 0 && (
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-[#C9A84C88] hover:text-[#C9A84C] font-body transition-colors">
            Select All
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-[#C9A84C22] border-t-[#C9A84C] rounded-full animate-spin-gold" />
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#C9A84C0D] flex items-center justify-center mb-4">
            <span className="text-2xl">📁</span>
          </div>
          <p className="text-[#F5F0E877] font-body text-sm">No generations yet.</p>
          <p className="text-[#F5F0E844] font-body text-xs mt-1">Your outputs will appear here after generating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`bg-[#111118] rounded-xl border overflow-hidden transition-all cursor-pointer group ${
                selected.has(item.id) ? "border-[#C9A84C]" : "border-[#C9A84C22] hover:border-[#C9A84C44]"
              }`}
              onClick={() => toggleSelect(item.id)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-[#16161F] flex items-center justify-center">
                {item.output_url || item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url || item.output_url}
                    alt={item.section}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#F5F0E822] text-2xl">
                    {item.section === "video" ? "🎬" : item.section === "image" ? "🖼️" : "✨"}
                  </div>
                )}

                {/* Selection overlay */}
                {selected.has(item.id) && (
                  <div className="absolute inset-0 bg-[#C9A84C22] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <span className="text-[#0A0A0F] text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}

                {/* Expand button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(item); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-[#0A0A0F88] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#F5F0E8]"
                >
                  <Expand size={10} />
                </button>
              </div>

              {/* Meta */}
              <div className="p-2.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: SECTION_COLORS[item.section] || "#C9A84C" }}
                  />
                  <span className="text-[10px] font-body font-semibold uppercase tracking-wider" style={{ color: SECTION_COLORS[item.section] || "#C9A84C" }}>
                    {item.section}
                  </span>
                </div>
                <p className="text-xs text-[#F5F0E8AA] font-body truncate">{item.model}</p>
                <p className="text-[10px] text-[#F5F0E844] font-body">{formatDate(item.created_at)}</p>

                {/* Actions */}
                <div className="flex gap-1 pt-1">
                  {item.output_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadFile(item.output_url!, `golden-soul-${item.section}-${item.id}`); }}
                      className="flex-1 flex items-center justify-center py-1 bg-[#C9A84C22] rounded text-[#C9A84C] hover:bg-[#C9A84C33] transition-colors"
                    >
                      <Download size={10} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    className="flex-1 flex items-center justify-center py-1 bg-[#ff444422] rounded text-red-400 hover:bg-[#ff444433] transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 bg-[#0A0A0FCC] backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setExpanded(null)}
        >
          <div
            className="bg-[#111118] border border-[#C9A84C33] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#C9A84C22]">
              <div>
                <span className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: SECTION_COLORS[expanded.section] || "#C9A84C" }}>
                  {expanded.section}
                </span>
                <p className="text-sm font-body text-[#F5F0E8]">{expanded.model}</p>
              </div>
              <button onClick={() => setExpanded(null)} className="text-[#F5F0E855] hover:text-[#F5F0E8]">
                <X size={18} />
              </button>
            </div>

            {expanded.output_url && (
              <div className="p-4">
                {expanded.section === "video" || expanded.section === "motion" || expanded.section === "lipsync" ? (
                  <video src={expanded.output_url} controls className="w-full rounded-lg" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={expanded.output_url} alt="Output" className="w-full rounded-lg" />
                )}
              </div>
            )}

            <div className="p-4 pt-0 space-y-3">
              {expanded.prompt && (
                <p className="text-sm text-[#F5F0E877] font-body">{expanded.prompt}</p>
              )}
              {expanded.settings && (
                <div className="bg-[#0A0A0F] rounded-lg p-3 text-xs font-mono text-[#F5F0E866]">
                  {Object.entries(expanded.settings).map(([k, v]) => (
                    <div key={k}><span className="text-[#C9A84C88]">{k}:</span> {String(v)}</div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {expanded.output_url && (
                  <button
                    onClick={() => downloadFile(expanded.output_url!, `golden-soul-${expanded.section}-${expanded.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A0A0F] rounded-lg text-xs font-body font-semibold hover:bg-[#D4B86A] transition-colors"
                  >
                    <Download size={12} /> Download
                  </button>
                )}
                <p className="text-xs text-[#F5F0E844] font-body self-center ml-auto">{formatDate(expanded.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
