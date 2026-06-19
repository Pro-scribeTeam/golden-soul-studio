"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { GoldSlider } from "@/components/ui/GoldSlider";
import { GoldDropdown } from "@/components/ui/GoldDropdown";
import { LoadingRing } from "@/components/ui/LoadingRing";
import { Sparkles, Download, Copy, Save, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  q1: string;  // emotion/story
  q2: string;  // protagonist
  q3: string;  // vibe/setting
  q4: string;  // subgenres
  q5: string;  // artist references
  q6: string;  // fusion style
  q7: number;  // lyric style slider (0=raw, 100=poetic)
  q8: string;  // motifs
  q9: string;  // language style
  q10: string; // tempo
  q11: string[]; // instruments
  q12: string[]; // vocal approach
  q13: string; // avoid
  q14: string; // audience
  q15: string; // project context
  freeform: string;
}

interface AiOutput {
  titles: string[];
  hook: string;
  verse: string;
  chords: string;
}

interface SavedDraft {
  name: string;
  data: FormData;
  savedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
  q7: 50, q8: "", q9: "", q10: "",
  q11: [], q12: [],
  q13: "", q14: "", q15: "", freeform: "",
};

const INSTRUMENTS = ["Rhodes", "808s", "Log Drums", "Live Bass", "Flute", "Vinyl Crackle", "Synth Pads", "Guitar Licks", "Strings", "Brass"];
const VOCALS = ["Melismatic", "Breathy", "Conversational", "Rhythmic", "Harmonized", "Falsetto"];

const TEMPLATES: Record<string, Partial<FormData>> = {
  "Neo-Soul": {
    q1: "Quiet longing — holding space for someone who's gone",
    q2: "A woman who's healed but hasn't forgotten",
    q3: "Late-night apartment, candles low, city hum outside",
    q4: "Neo-soul + jazz chords",
    q5: "SZA meets Sade — intimate but cinematic",
    q6: "Seamless blend",
    q7: 72,
    q8: "Water, mirrors, candlelight, old letters",
    q9: "Timeless phrasing",
    q10: "Slow-burn (60–80 BPM)",
    q11: ["Rhodes", "Live Bass", "Vinyl Crackle"],
    q12: ["Breathy", "Melismatic"],
  },
  "Trap-Soul": {
    q1: "Guarded love — letting someone in but not all the way",
    q2: "A man who gives everything but keeps the last piece of himself",
    q3: "Midnight drive, city lights, no destination",
    q4: "Trap-soul + dark R&B",
    q5: "Bryson Tiller meets Brent Faiyaz",
    q6: "Seamless blend",
    q7: 35,
    q8: "Night, smoke, rain on glass, empty parking lots",
    q9: "Modern slang",
    q10: "Mid-tempo (85–100 BPM)",
    q11: ["808s", "Synth Pads", "Rhodes"],
    q12: ["Breathy", "Conversational"],
  },
  "Afrobeats Crossover": {
    q1: "Celebration of self — unapologetic joy and sensual confidence",
    q2: "Somebody who finally chose themselves",
    q3: "Rooftop at golden hour, Lagos to Los Angeles energy",
    q4: "Afrobeats + R&B + Dancehall undertone",
    q5: "Tems meets Ckay with Wizkid's effortlessness",
    q6: "Seamless blend",
    q7: 45,
    q8: "Sun, movement, color, laughter, open sky",
    q9: "Both",
    q10: "Uptempo (105+ BPM)",
    q11: ["Log Drums", "Live Bass", "Guitar Licks"],
    q12: ["Rhythmic", "Harmonized"],
  },
  "Classic R&B": {
    q1: "Deep, aching devotion — the kind that stays even after it's over",
    q2: "A lover who gave everything and still wonders if it was enough",
    q3: "Rainy Sunday morning, old apartment, memories all around",
    q4: "Classic soul + 90s R&B",
    q5: "Babyface meets Stevie Wonder warmth",
    q6: "Seamless blend",
    q7: 60,
    q8: "Rain, church, photographs, slow dances",
    q9: "Timeless phrasing",
    q10: "Slow-burn (60–80 BPM)",
    q11: ["Rhodes", "Live Bass", "Strings", "Brass"],
    q12: ["Melismatic", "Harmonized", "Falsetto"],
  },
};

const FUSION_OPTIONS = [
  { value: "Seamless blend", label: "Seamless blend" },
  { value: "Intentionally contrasting", label: "Intentionally contrasting" },
  { value: "Don't care", label: "Don't care" },
];

const LANGUAGE_OPTIONS = [
  { value: "Modern slang", label: "Modern slang" },
  { value: "Timeless phrasing", label: "Timeless phrasing" },
  { value: "Both", label: "Both" },
];

const TEMPO_OPTIONS = [
  { value: "Slow-burn (60–80 BPM)", label: "Slow-burn (60–80 BPM)" },
  { value: "Mid-tempo (85–100 BPM)", label: "Mid-tempo (85–100 BPM)" },
  { value: "Uptempo (105+ BPM)", label: "Uptempo (105+ BPM)" },
];

const DRAFTS_KEY = "soulscript_drafts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lyricLabel(val: number) {
  if (val <= 20) return "Mostly Raw";
  if (val <= 40) return "More Raw";
  if (val <= 60) return "50/50 Raw & Poetic";
  if (val <= 80) return "More Poetic";
  return "Mostly Poetic";
}

function countAnswered(form: FormData): number {
  let n = 0;
  if (form.q1.trim()) n++;
  if (form.q2.trim()) n++;
  if (form.q3.trim()) n++;
  if (form.q4.trim()) n++;
  if (form.q5.trim()) n++;
  if (form.q6) n++;
  n++; // slider always has a value
  if (form.q8.trim()) n++;
  if (form.q9) n++;
  if (form.q10) n++;
  if (form.q11.length > 0) n++;
  if (form.q12.length > 0) n++;
  if (form.q13.trim()) n++;
  if (form.q14.trim()) n++;
  if (form.q15.trim()) n++;
  if (form.freeform.trim()) n++;
  return n;
}

const TOTAL_FIELDS = 16;

function assembleBrief(form: FormData): string {
  return `SONG BRIEF
──────────────────────────────────────────

1. Central emotion / story: ${form.q1 || "[not answered]"}
2. Protagonist: ${form.q2 || "[not answered]"}
3. Overall vibe / setting: ${form.q3 || "[not answered]"}
4. Subgenres to blend: ${form.q4 || "[not answered]"}
5. Artist / reference combos: ${form.q5 || "[not answered]"}
6. Fusion style: ${form.q6 || "[not answered]"}
7. Lyric style: ${lyricLabel(form.q7)}
8. Recurring motifs: ${form.q8 || "[not answered]"}
9. Language style: ${form.q9 || "[not answered]"}
10. Tempo & groove: ${form.q10 || "[not answered]"}
11. Instrumental flavors: ${form.q11.length ? form.q11.join(", ") : "[not answered]"}
12. Vocal approach: ${form.q12.length ? form.q12.join(", ") : "[not answered]"}
13. What to avoid: ${form.q13 || "[not answered]"}
14. Target audience: ${form.q14 || "[not answered]"}
15. Part of a larger project: ${form.q15 || "[not answered]"}

Freeform notes:
${form.freeform || "[none]"}

──────────────────────────────────────────`;
}

function loadDrafts(): Record<string, SavedDraft> {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "{}");
  } catch {
    return {};
  }
}

// ─── Checkbox pill component ──────────────────────────────────────────────────

function CheckPill({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all duration-150 ${
        checked
          ? "bg-[#C9A84C] text-[#0A0A0F] border-[#C9A84C]"
          : "bg-transparent text-[#F5F0E8AA] border-[#C9A84C33] hover:border-[#C9A84C66] hover:text-[#F5F0E8]"
      }`}
    >
      {checked && <span className="mr-1">✓</span>}{label}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function QLabel({ num, text }: { num: string; text: string }) {
  return (
    <label className="block mb-2 text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">
      <span className="text-[#C9A84C] font-semibold">{num}.</span> {text}
    </label>
  );
}

const inputClass =
  "w-full px-3 py-2.5 bg-[#111118] border border-[#C9A84C33] rounded-lg text-sm font-body text-[#F5F0E8] placeholder-[#F5F0E844] outline-none focus:border-[#C9A84C] transition-colors resize-none";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SoulScript() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<AiOutput | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savedDrafts, setSavedDrafts] = useState<Record<string, SavedDraft>>({});
  const [selectedDraft, setSelectedDraft] = useState("");
  const [showDrafts, setShowDrafts] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    setSavedDrafts(loadDrafts());
  }, []);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  }, []);

  const toggleCheck = useCallback((key: "q11" | "q12", val: string) => {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }, []);

  const applyTemplate = useCallback((name: string) => {
    const t = TEMPLATES[name];
    if (t) setForm((f) => ({ ...f, ...t }));
  }, []);

  const saveDraft = useCallback(() => {
    const name = draftName.trim() || `Draft ${new Date().toLocaleDateString()}`;
    const drafts = loadDrafts();
    drafts[name] = { name, data: form, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    setSavedDrafts(drafts);
    setDraftName("");
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [form, draftName]);

  const loadDraft = useCallback((name: string) => {
    const drafts = loadDrafts();
    if (drafts[name]) {
      setForm(drafts[name].data);
      setSelectedDraft("");
      setShowDrafts(false);
    }
  }, []);

  const deleteDraft = useCallback((name: string) => {
    const drafts = loadDrafts();
    delete drafts[name];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    setSavedDrafts({ ...drafts });
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    setAiOutput(null);
    try {
      const brief = assembleBrief(form);
      const res = await fetch("/api/soulscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setAiOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [form]);

  const exportTxt = useCallback(() => {
    let content = `S O U L S C R I P T   S O N G   B R I E F\n`;
    content += `──────────────────────────────────────────\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += assembleBrief(form).replace("SONG BRIEF\n──────────────────────────────────────────\n\n", "");

    if (aiOutput) {
      content += `\n\nAI GENERATED CONTENT\n──────────────────────────────────────────\n\n`;
      content += `TITLE IDEAS:\n${aiOutput.titles.join("\n")}\n\n`;
      content += `HOOK:\n${aiOutput.hook}\n\n`;
      content += `VERSE:\n${aiOutput.verse}\n\n`;
      content += `CHORDS:\n${aiOutput.chords}\n`;
    }

    content += `\n──────────────────────────────────────────\nMade with SoulScript Studio — Golden Soul Studio`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SoulScript_Song_Brief.txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }, [form, aiOutput]);

  const copyBrief = useCallback(async () => {
    try {
      let text = assembleBrief(form);
      if (aiOutput) {
        text += `\n\nAI GENERATED:\n\nTITLES:\n${aiOutput.titles.join("\n")}\n\nHOOK:\n${aiOutput.hook}\n\nVERSE:\n${aiOutput.verse}\n\nCHORDS:\n${aiOutput.chords}`;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard copy failed — try exporting instead.");
    }
  }, [form, aiOutput]);

  const resetForm = useCallback(() => {
    if (confirm("Clear all answers and start over?")) {
      setForm(EMPTY_FORM);
      setAiOutput(null);
      setError("");
    }
  }, []);

  const answered = countAnswered(form);
  const progressPct = Math.round((answered / TOTAL_FIELDS) * 100);
  const draftList = Object.keys(savedDrafts);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F0E8] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-body font-bold mb-2"
            style={{ background: "linear-gradient(to right, #C9A84C, #8B6914)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SoulScript Studio
          </h1>
          <p className="text-sm text-[#F5F0E8AA]">Define your R&amp;B vision. Generate with AI. Export ready.</p>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-[#111118] rounded-xl p-4 border border-[#C9A84C22]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider">Brief completion</span>
            <span className="text-sm font-body font-semibold text-[#C9A84C]">{answered} / {TOTAL_FIELDS}</span>
          </div>
          <div className="w-full bg-[#3A3A4A] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-[#C9A84C] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider mb-3">Quick-start template</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TEMPLATES).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyTemplate(name)}
                className="px-3 py-1.5 text-xs font-body border border-[#C9A84C33] rounded-lg text-[#F5F0E8AA] hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#111118] rounded-2xl border border-[#C9A84C22] p-6 space-y-6">

          {/* Q1 */}
          <div>
            <QLabel num="1" text="Central emotion or story?" />
            <textarea
              className={inputClass}
              rows={3}
              placeholder={`e.g., "Regret with hope," "Sensual confidence," "Protecting your peace"`}
              value={form.q1}
              onChange={(e) => set("q1", e.target.value)}
            />
          </div>

          {/* Q2 */}
          <div>
            <QLabel num="2" text="Who's the protagonist?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Healed but cautious," "Unapologetically free"`}
              value={form.q2}
              onChange={(e) => set("q2", e.target.value)}
            />
          </div>

          {/* Q3 */}
          <div>
            <QLabel num="3" text="Overall vibe or setting?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Rainy-day reflection," "Late-night drive"`}
              value={form.q3}
              onChange={(e) => set("q3", e.target.value)}
            />
          </div>

          {/* Q4 */}
          <div>
            <QLabel num="4" text="Subgenres to blend?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Trap-soul + Afrobeats," "Neo-soul + jazz chords"`}
              value={form.q4}
              onChange={(e) => set("q4", e.target.value)}
            />
          </div>

          {/* Q5 */}
          <div>
            <QLabel num="5" text="Artist / reference combos?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "SZA meets Tems," "Chris Brown with Stevie Wonder warmth"`}
              value={form.q5}
              onChange={(e) => set("q5", e.target.value)}
            />
          </div>

          {/* Q6 */}
          <div>
            <GoldDropdown
              label="6. Fusion style?"
              value={form.q6}
              options={FUSION_OPTIONS}
              onChange={(v) => set("q6", v)}
              placeholder="Select..."
            />
          </div>

          {/* Q7 */}
          <div>
            <GoldSlider
              label="7. Lyrics: Raw or Poetic?"
              min={0}
              max={100}
              value={form.q7}
              defaultValue={50}
              onChange={(v) => set("q7", v)}
              formatValue={lyricLabel}
            />
          </div>

          {/* Q8 */}
          <div>
            <QLabel num="8" text="Recurring motifs?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Water, time, city lights, vintage cars"`}
              value={form.q8}
              onChange={(e) => set("q8", e.target.value)}
            />
          </div>

          {/* Q9 */}
          <div>
            <GoldDropdown
              label="9. Language style?"
              value={form.q9}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => set("q9", v)}
              placeholder="Select..."
            />
          </div>

          {/* Q10 */}
          <div>
            <GoldDropdown
              label="10. Tempo & groove?"
              value={form.q10}
              options={TEMPO_OPTIONS}
              onChange={(v) => set("q10", v)}
              placeholder="Select..."
            />
          </div>

          {/* Q11 */}
          <div>
            <QLabel num="11" text="Instrumental flavors?" />
            <div className="flex flex-wrap gap-2 mt-1">
              {INSTRUMENTS.map((inst) => (
                <CheckPill
                  key={inst}
                  label={inst}
                  checked={form.q11.includes(inst)}
                  onToggle={() => toggleCheck("q11", inst)}
                />
              ))}
            </div>
          </div>

          {/* Q12 */}
          <div>
            <QLabel num="12" text="Vocal approach?" />
            <div className="flex flex-wrap gap-2 mt-1">
              {VOCALS.map((v) => (
                <CheckPill
                  key={v}
                  label={v}
                  checked={form.q12.includes(v)}
                  onToggle={() => toggleCheck("q12", v)}
                />
              ))}
            </div>
          </div>

          {/* Q13 */}
          <div>
            <QLabel num="13" text="What to avoid?" />
            <textarea
              className={inputClass}
              rows={2}
              placeholder={`e.g., "Clichés like 'fire in my soul,'" "Overused progressions"`}
              value={form.q13}
              onChange={(e) => set("q13", e.target.value)}
            />
          </div>

          {/* Q14 */}
          <div>
            <QLabel num="14" text="Target audience?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Gen Z R&B fans," "Global Afrobeats listeners"`}
              value={form.q14}
              onChange={(e) => set("q14", e.target.value)}
            />
          </div>

          {/* Q15 */}
          <div>
            <QLabel num="15" text="Part of a larger project?" />
            <input
              type="text"
              className={inputClass}
              placeholder={`e.g., "Album about healing," "EP on self-love"`}
              value={form.q15}
              onChange={(e) => set("q15", e.target.value)}
            />
          </div>

          {/* Freeform */}
          <div>
            <QLabel num="+" text="Anything else — title ideas, a lyric snippet, a memory…" />
            <textarea
              className={inputClass}
              rows={3}
              placeholder={`e.g., "Song title: 'Time' — it's about not letting the world steal your peace."`}
              value={form.freeform}
              onChange={(e) => set("freeform", e.target.value)}
            />
          </div>
        </div>

        {/* Draft management */}
        <div className="mt-4 bg-[#111118] rounded-xl border border-[#C9A84C22] p-4">
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider w-full"
            onClick={() => setShowDrafts((s) => !s)}
          >
            <Save size={13} />
            Saved Drafts ({draftList.length})
            {showDrafts ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
          </button>

          {showDrafts && (
            <div className="mt-3 space-y-3">
              {/* Save new draft */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`${inputClass} flex-1`}
                  placeholder="Draft name (e.g. 'Time — healing EP')"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveDraft()}
                />
                <GoldButton variant="secondary" size="sm" onClick={saveDraft}>
                  {draftSaved ? <Check size={14} /> : <Save size={14} />}
                  {draftSaved ? "Saved!" : "Save"}
                </GoldButton>
              </div>

              {/* Draft list */}
              {draftList.length > 0 ? (
                <div className="space-y-1">
                  {draftList.map((name) => (
                    <div key={name} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#C9A84C11] group">
                      <span className="flex-1 text-sm font-body text-[#F5F0E8CC] truncate">{name}</span>
                      <span className="text-xs text-[#F5F0E855]">
                        {new Date(savedDrafts[name].savedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => loadDraft(name)}
                        className="text-xs text-[#C9A84C] hover:text-[#D4B86A] font-body"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(name)}
                        className="text-[#F5F0E833] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#F5F0E844] font-body">No saved drafts yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <GoldButton
            variant="primary"
            size="lg"
            onClick={generate}
            loading={loading}
            disabled={loading}
            className="flex-1 min-w-[200px]"
          >
            <Sparkles size={16} />
            Generate with AI
          </GoldButton>
          <GoldButton variant="secondary" size="lg" onClick={exportTxt}>
            <Download size={16} />
            Export .txt
          </GoldButton>
          <GoldButton variant="secondary" size="lg" onClick={copyBrief}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Brief"}
          </GoldButton>
          <GoldButton variant="ghost" size="lg" onClick={resetForm}>
            Start Over
          </GoldButton>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-sm text-red-300 font-body">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 bg-[#111118] rounded-xl border border-[#C9A84C22] p-6">
            <LoadingRing label="Writing your song..." />
          </div>
        )}

        {/* AI Output */}
        {aiOutput && !loading && (
          <div className="mt-6 bg-[#111118] rounded-2xl border border-[#C9A84C44] p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[#C9A84C22]">
              <Sparkles size={16} className="text-[#C9A84C]" />
              <h2 className="text-sm font-body font-semibold text-[#C9A84C] uppercase tracking-wider">AI Generated</h2>
            </div>

            {/* Titles */}
            <div>
              <p className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider mb-3">Title Ideas</p>
              <div className="space-y-2">
                {aiOutput.titles.map((t, i) => (
                  <div key={i} className="px-4 py-2.5 rounded-lg bg-[#C9A84C11] border border-[#C9A84C22] text-[#F5F0E8] font-body text-sm">
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Hook */}
            <div>
              <p className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider mb-3">Hook / Chorus</p>
              <div className="px-4 py-3 rounded-lg bg-[#1A1A24] border border-[#C9A84C22] font-body text-sm text-[#F5F0E8] whitespace-pre-line leading-relaxed">
                {aiOutput.hook}
              </div>
            </div>

            {/* Verse */}
            <div>
              <p className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider mb-3">Sample Verse</p>
              <div className="px-4 py-3 rounded-lg bg-[#1A1A24] border border-[#C9A84C22] font-body text-sm text-[#F5F0E8] whitespace-pre-line leading-relaxed">
                {aiOutput.verse}
              </div>
            </div>

            {/* Chords */}
            <div>
              <p className="text-xs font-body text-[#F5F0E8AA] uppercase tracking-wider mb-3">Chord Progression</p>
              <div className="px-4 py-2.5 rounded-lg bg-[#C9A84C11] border border-[#C9A84C22] font-body text-sm text-[#C9A84C] font-semibold tracking-wide">
                {aiOutput.chords}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#F5F0E833] font-body mt-8">
          SoulScript Studio — For songwriters who believe sound + soul = song.
        </p>
      </div>
    </div>
  );
}
