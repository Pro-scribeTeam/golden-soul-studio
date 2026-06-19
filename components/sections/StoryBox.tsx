"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, List, Film, LayoutGrid, DollarSign, Cpu,
  RefreshCw, ChevronDown, ChevronUp, Check, Lock,
  Sparkles, AlertCircle, Copy, Download, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type OutputType =
  | "script"
  | "shot_list"
  | "scene_breakdown"
  | "storyboard_notes"
  | "credit_estimate"
  | "model_selection";

type OutputStatus = "idle" | "generating" | "complete" | "locked" | "error";

interface OutputCard {
  type: OutputType;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  status: OutputStatus;
  content: unknown;
  error?: string;
}

interface ProjectState {
  project_id: string;
  project_title: string;
  project_type: string;
  project_artist: string;
  project_brief: string;
}

// Smart Edit states
type SmartEditState = "incomplete" | "ready" | "generating" | "complete";

const OUTPUT_CARDS: Omit<OutputCard, "status" | "content" | "error">[] = [
  {
    type: "script",
    label: "Script",
    shortLabel: "Script",
    icon: FileText,
    description: "6-scene music video script with narrative arc, action, dialogue, and emotional beats",
  },
  {
    type: "shot_list",
    label: "Shot List",
    shortLabel: "Shots",
    icon: List,
    description: "12–14 shots across 6 scenes with camera moves, lens feel, and Nova model routing",
  },
  {
    type: "scene_breakdown",
    label: "Scene Breakdown",
    shortLabel: "Breakdown",
    icon: LayoutGrid,
    description: "Production breakdown for all 6 scenes — Jordan tasks, Nova tasks, color grades, placement tags",
  },
  {
    type: "storyboard_notes",
    label: "Storyboard Notes",
    shortLabel: "Boards",
    icon: Film,
    description: "Frame-by-frame storyboard with exact generation prompts for Jordan and Nova",
  },
  {
    type: "credit_estimate",
    label: "Credit Estimate",
    shortLabel: "Credits",
    icon: DollarSign,
    description: "Detailed credit cost breakdown per scene with balance warning and approval gate",
  },
  {
    type: "model_selection",
    label: "Model Selection",
    shortLabel: "Models",
    icon: Cpu,
    description: "Jordan and Nova model routing log with decision tree reasoning for all 6 scenes",
  },
];

const STORAGE_KEY = "gss_storybox_v1";

function loadState(): { project: ProjectState; cards: Record<OutputType, { status: OutputStatus; content: unknown; error?: string }> } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(
  project: ProjectState,
  cards: OutputCard[]
) {
  const cardMap: Record<string, { status: OutputStatus; content: unknown; error?: string }> = {};
  for (const c of cards) {
    cardMap[c.type] = { status: c.status, content: c.content, error: c.error };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ project, cards: cardMap }));
}

// ── Credit Approval Modal ──────────────────────────────────────────────────────

function CreditModal({
  creditData,
  onApprove,
  onCancel,
}: {
  creditData: {
    summary?: {
      project_total_credits?: number;
      current_balance?: number;
      balance_after_generation?: number;
      warning?: string | null;
    };
  } | null;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const summary = creditData?.summary;
  const total = summary?.project_total_credits ?? 0;
  const balance = summary?.current_balance ?? 120;
  const after = summary?.balance_after_generation ?? balance - total;
  const warning = summary?.warning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Credit Approval Required</h2>
        <p className="text-zinc-400 text-sm mb-5">
          Maxwell has estimated the following credit cost. Approve to proceed with full generation.
        </p>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Estimated cost</span>
            <span className="text-white font-semibold">{total} credits</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Current balance</span>
            <span className="text-white">{balance} credits</span>
          </div>
          <div className="h-px bg-zinc-700 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Balance after</span>
            <span className={after < 0 ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
              {after} credits
            </span>
          </div>
        </div>

        {warning && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-5">
            <AlertCircle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-xs">{warning}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            Approve & Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── JSON Viewer ────────────────────────────────────────────────────────────────

function JsonViewer({ data }: { data: unknown }) {
  const [collapsed, setCollapsed] = useState(true);
  const str = JSON.stringify(data, null, 2);

  return (
    <div className="mt-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-1"
      >
        {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        {collapsed ? "Show JSON output" : "Hide JSON output"}
      </button>
      {!collapsed && (
        <pre className="text-xs bg-black/40 border border-zinc-700 rounded-lg p-3 overflow-x-auto text-emerald-300 max-h-72 overflow-y-auto">
          {str}
        </pre>
      )}
    </div>
  );
}

// ── Script Renderer ────────────────────────────────────────────────────────────

function ScriptRenderer({ data }: { data: { scenes?: Array<{ scene_id: string; title: string; action: string; emotional_beat: string; wardrobe: string; transition_out: string }> } }) {
  if (!data.scenes) return <JsonViewer data={data} />;
  return (
    <div className="mt-3 space-y-3">
      {data.scenes.map((s) => (
        <div key={s.scene_id} className="border border-zinc-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-amber-400">{s.scene_id}</span>
            <span className="text-sm font-semibold text-white">{s.title}</span>
          </div>
          <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{s.action}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{s.emotional_beat}</span>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{s.transition_out}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Scene Breakdown Renderer ────────────────────────────────────────────────────

function BreakdownRenderer({ data }: { data: { scenes?: Array<{ scene_id: string; jordan_model: string; nova_model: string; color_grade: string; placement_tag: string; credit_estimate: number; jordan_task: string }> } }) {
  if (!data.scenes) return <JsonViewer data={data} />;
  return (
    <div className="mt-3 space-y-2">
      {data.scenes.map((s) => (
        <div key={s.scene_id} className="border border-zinc-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400">{s.scene_id}</span>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{s.placement_tag}</span>
            </div>
            <span className="text-xs text-zinc-400">{s.credit_estimate} credits</span>
          </div>
          <p className="text-xs text-zinc-300 mb-2">{s.jordan_task}</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded">Jordan: {s.jordan_model}</span>
            <span className="bg-purple-900/40 text-purple-300 border border-purple-700/40 px-2 py-0.5 rounded">Nova: {s.nova_model}</span>
            <span className="bg-amber-900/30 text-amber-300 border border-amber-700/30 px-2 py-0.5 rounded">{s.color_grade}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Credit Renderer ────────────────────────────────────────────────────────────

function CreditRenderer({ data }: { data: { breakdown?: Array<{ scene_id: string; jordan_credits: number; nova_credits: number; scene_total: number }>; summary?: { jordan_total_credits: number; nova_total_credits: number; project_total_credits: number; current_balance: number; balance_after_generation: number; warning?: string | null } } }) {
  if (!data.breakdown) return <JsonViewer data={data} />;
  const s = data.summary;
  return (
    <div className="mt-3">
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-800 text-zinc-400">
              <th className="text-left p-2">Scene</th>
              <th className="text-right p-2">Jordan</th>
              <th className="text-right p-2">Nova</th>
              <th className="text-right p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.breakdown.map((row) => (
              <tr key={row.scene_id} className="border-t border-zinc-800">
                <td className="p-2 text-amber-400 font-mono">{row.scene_id}</td>
                <td className="p-2 text-right text-zinc-300">{row.jordan_credits}</td>
                <td className="p-2 text-right text-zinc-300">{row.nova_credits}</td>
                <td className="p-2 text-right text-white font-semibold">{row.scene_total}</td>
              </tr>
            ))}
          </tbody>
          {s && (
            <tfoot>
              <tr className="border-t-2 border-amber-500/40 bg-zinc-800/50">
                <td className="p-2 text-white font-semibold">TOTAL</td>
                <td className="p-2 text-right text-blue-300">{s.jordan_total_credits}</td>
                <td className="p-2 text-right text-purple-300">{s.nova_total_credits}</td>
                <td className="p-2 text-right text-amber-400 font-bold">{s.project_total_credits}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {s && (
        <div className="mt-2 flex gap-3 text-xs text-zinc-400">
          <span>Balance: <span className="text-white">{s.current_balance}</span></span>
          <span>After: <span className={s.balance_after_generation < 0 ? "text-red-400" : "text-emerald-400"}>{s.balance_after_generation}</span></span>
          {s.warning && <span className="text-amber-400">{s.warning}</span>}
        </div>
      )}
    </div>
  );
}

// ── Generic content renderer ───────────────────────────────────────────────────

function ContentRenderer({ type, data }: { type: OutputType; data: unknown }) {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  if (d.raw) {
    return <pre className="mt-3 text-xs bg-black/40 border border-zinc-700 rounded-lg p-3 overflow-x-auto text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap">{String(d.raw)}</pre>;
  }
  if (type === "script") return <ScriptRenderer data={d as Parameters<typeof ScriptRenderer>[0]["data"]} />;
  if (type === "scene_breakdown") return <BreakdownRenderer data={d as Parameters<typeof BreakdownRenderer>[0]["data"]} />;
  if (type === "credit_estimate") return <CreditRenderer data={d as Parameters<typeof CreditRenderer>[0]["data"]} />;
  return <JsonViewer data={data} />;
}

// ── Output Card Component ──────────────────────────────────────────────────────

function OutputCardView({
  card,
  index,
  onGenerate,
  onCopy,
}: {
  card: OutputCard;
  index: number;
  onGenerate: (type: OutputType) => void;
  onCopy: (card: OutputCard) => void;
}) {
  const Icon = card.icon;
  const isLocked = card.status === "locked";
  const isComplete = card.status === "complete" || isLocked;
  const isGenerating = card.status === "generating";

  return (
    <div className={`border rounded-xl p-4 transition-all ${
      isLocked
        ? "border-amber-500/50 bg-amber-500/5"
        : isComplete
        ? "border-emerald-600/50 bg-emerald-500/5"
        : "border-zinc-700 bg-zinc-900"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
            isLocked ? "bg-amber-500 text-black" : isComplete ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}>
            {isLocked ? <Lock size={13} /> : isComplete ? <Check size={13} /> : index + 1}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Icon size={13} className={isComplete ? "text-emerald-400" : "text-zinc-400"} />
              <span className="text-sm font-semibold text-white">{card.label}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{card.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {isComplete && (
            <button
              onClick={() => onCopy(card)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              title="Copy JSON"
            >
              <Copy size={13} />
            </button>
          )}
          <button
            onClick={() => onGenerate(card.type)}
            disabled={isGenerating || isLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isLocked
                ? "bg-amber-500/20 text-amber-400 cursor-not-allowed"
                : isGenerating
                ? "bg-zinc-700 text-zinc-400 cursor-wait"
                : isComplete
                ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                : "bg-amber-500 text-black hover:bg-amber-400"
            }`}
          >
            {isLocked ? (
              <><Lock size={11} /> Locked</>
            ) : isGenerating ? (
              <><Loader2 size={11} className="animate-spin" /> Generating</>
            ) : isComplete ? (
              <><RefreshCw size={11} /> Regenerate</>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {card.status === "error" && card.error && (
        <div className="flex items-center gap-2 mt-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-xs">{card.error}</p>
        </div>
      )}

      {/* Content */}
      {isComplete && !!card.content && (
        <ContentRenderer type={card.type} data={card.content} />
      )}
    </div>
  );
}

// ── Main StoryBox Component ────────────────────────────────────────────────────

export default function StoryBox() {
  const [project, setProject] = useState<ProjectState>({
    project_id: "JMDX-MV001",
    project_title: "",
    project_type: "Music Video",
    project_artist: "Jeff M Dixon",
    project_brief: "",
  });

  const [cards, setCards] = useState<OutputCard[]>(
    OUTPUT_CARDS.map((c) => ({ ...c, status: "idle", content: null }))
  );

  const [smartEditState, setSmartEditState] = useState<SmartEditState>("incomplete");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  // Restore from localStorage
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setProject(saved.project);
      setCards((prev) =>
        prev.map((c) => {
          const saved_card = saved.cards[c.type as OutputType];
          return saved_card ? { ...c, ...saved_card } : c;
        })
      );
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    saveState(project, cards);
  }, [project, cards]);

  // Compute smart edit state
  useEffect(() => {
    if (!project.project_brief.trim()) {
      setSmartEditState("incomplete");
      return;
    }
    const anyGenerating = cards.some((c) => c.status === "generating");
    if (anyGenerating) {
      setSmartEditState("generating");
      return;
    }
    const allComplete = cards.every((c) => c.status === "complete" || c.status === "locked");
    if (allComplete) {
      setSmartEditState("complete");
    } else {
      setSmartEditState("ready");
    }
  }, [project.project_brief, cards]);

  const updateCard = useCallback(
    (type: OutputType, updates: Partial<OutputCard>) => {
      setCards((prev) =>
        prev.map((c) => (c.type === type ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const generateOutput = useCallback(
    async (type: OutputType) => {
      if (!project.project_brief.trim()) return;

      // Gather previous approved outputs for context
      const previous_outputs: Record<string, unknown> = {};
      cards.forEach((c) => {
        if ((c.status === "complete" || c.status === "locked") && c.content) {
          previous_outputs[c.type] = c.content;
        }
      });

      updateCard(type, { status: "generating", error: undefined });

      try {
        const res = await fetch("/api/story/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            output_type: type,
            project_brief: project.project_brief,
            project_id: project.project_id,
            project_title: project.project_title,
            project_type: project.project_type,
            project_artist: project.project_artist,
            previous_outputs: Object.keys(previous_outputs).length > 0 ? previous_outputs : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
        updateCard(type, { status: "complete", content: data.content });
      } catch (e) {
        updateCard(type, {
          status: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    },
    [project, cards, updateCard]
  );

  const handleSmartEdit = () => {
    if (smartEditState !== "ready") return;
    // Check if credit estimate exists — if so show approval modal
    const creditCard = cards.find((c) => c.type === "credit_estimate");
    if (creditCard?.status === "complete") {
      setShowCreditModal(true);
    } else {
      // Generate credit estimate first, then offer modal after
      generateOutput("credit_estimate").then(() => {
        setShowCreditModal(true);
      });
    }
  };

  const handleCreditApprove = () => {
    setShowCreditModal(false);
    // Generate all incomplete outputs sequentially
    const incomplete = cards.filter(
      (c) => c.status !== "complete" && c.status !== "locked" && c.status !== "generating"
    );
    // Fire them all (they will chain context via previous_outputs)
    incomplete.forEach((c) => generateOutput(c.type));
  };

  const handleCopy = (card: OutputCard) => {
    navigator.clipboard.writeText(JSON.stringify(card.content, null, 2)).then(() => {
      setCopiedMsg(`${card.label} copied`);
      setTimeout(() => setCopiedMsg(null), 2000);
    });
  };

  const creditCard = cards.find((c) => c.type === "credit_estimate");
  const creditData = creditCard?.content as Parameters<typeof CreditModal>[0]["creditData"];

  const smartEditLabel: Record<SmartEditState, string> = {
    incomplete: "Add brief to begin",
    ready: "Smart Edit — Generate All",
    generating: "Generating...",
    complete: "All Outputs Complete",
  };

  const completedCount = cards.filter((c) => c.status === "complete" || c.status === "locked").length;

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-white">
      {/* Credit Modal */}
      {showCreditModal && (
        <CreditModal
          creditData={creditData}
          onApprove={handleCreditApprove}
          onCancel={() => setShowCreditModal(false)}
        />
      )}

      {/* Toast */}
      {copiedMsg && (
        <div className="fixed top-4 right-4 z-40 bg-zinc-800 border border-zinc-600 text-white text-sm px-4 py-2 rounded-lg shadow-xl">
          {copiedMsg}
        </div>
      )}

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white">Story Box</h1>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Maxwell Cruz
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            AI Story Director — generates production documents for the Golden Soul Studio pipeline
          </p>
        </div>

        {/* Project Header */}
        <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Project ID</label>
              <input
                type="text"
                value={project.project_id}
                onChange={(e) => setProject((p) => ({ ...p, project_id: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="JMDX-MV001"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Project Type</label>
              <input
                type="text"
                value={project.project_type}
                onChange={(e) => setProject((p) => ({ ...p, project_type: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="Music Video"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Project Title</label>
              <input
                type="text"
                value={project.project_title}
                onChange={(e) => setProject((p) => ({ ...p, project_title: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="Untitled"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Artist</label>
              <input
                type="text"
                value={project.project_artist}
                onChange={(e) => setProject((p) => ({ ...p, project_artist: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="Jeff M Dixon"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Project Brief</label>
            <textarea
              value={project.project_brief}
              onChange={(e) => setProject((p) => ({ ...p, project_brief: e.target.value }))}
              rows={5}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Describe the song, mood, visual direction, key moments, and creative intent. The more context Maxwell has, the stronger the production documents."
            />
          </div>
        </div>

        {/* Smart Edit Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSmartEdit}
            disabled={smartEditState === "incomplete" || smartEditState === "generating" || smartEditState === "complete"}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              smartEditState === "ready"
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                : smartEditState === "generating"
                ? "bg-zinc-700 text-zinc-400 cursor-wait"
                : smartEditState === "complete"
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {smartEditState === "generating" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : smartEditState === "complete" ? (
              <Check size={15} />
            ) : (
              <Sparkles size={15} />
            )}
            {smartEditLabel[smartEditState]}
          </button>

          {completedCount > 0 && (
            <span className="text-xs text-zinc-400">
              {completedCount} / {cards.length} complete
            </span>
          )}

          <button
            onClick={() => {
              if (confirm("Reset all outputs? Project brief will be kept.")) {
                setCards((prev) => prev.map((c) => ({ ...c, status: "idle", content: null, error: undefined })));
              }
            }}
            className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset outputs
          </button>
        </div>

        {/* Output Cards */}
        <div className="space-y-3">
          {cards.map((card, i) => (
            <OutputCardView
              key={card.type}
              card={card}
              index={i}
              onGenerate={generateOutput}
              onCopy={handleCopy}
            />
          ))}
        </div>

        {/* Suggestions panel */}
        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Maxwell&apos;s Workflow</h3>
          <div className="space-y-1.5 text-xs text-zinc-500">
            <p>1. Fill in the project brief with song details, mood, and visual direction.</p>
            <p>2. Click <span className="text-zinc-300 font-medium">Smart Edit</span> to auto-generate all 6 outputs, or generate them individually.</p>
            <p>3. Maxwell uses previous outputs as context — generate in order for best consistency.</p>
            <p>4. Credit Estimate triggers approval before the full pipeline runs.</p>
            <p>5. Export to ProCut or copy JSON for Agent Studio scene commands.</p>
          </div>
        </div>

        {/* Export / Download All */}
        {completedCount > 0 && (
          <button
            onClick={() => {
              const payload = {
                project,
                outputs: Object.fromEntries(
                  cards.filter((c) => c.content).map((c) => [c.type, c.content])
                ),
                exported_at: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${project.project_id}-maxwell-package.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
          >
            <Download size={14} />
            Export Production Package ({completedCount} outputs)
          </button>
        )}
      </div>
    </div>
  );
}
