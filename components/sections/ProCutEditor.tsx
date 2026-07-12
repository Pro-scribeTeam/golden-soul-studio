"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLayout } from "@/components/layout/LayoutProvider";
import { storeMedia, restoreUrl } from "@/lib/mediaStore";
import {
  ChevronLeft, Undo2, Redo2, Settings, Share2, Download,
  Scissors, MousePointer2, MoveHorizontal, ArrowLeftRight,
  Plus, Music, Type, Palette, Sparkles, Shuffle, Move,
  ZoomIn, Hand, HelpCircle, Maximize2, Play, Pause,
  SkipBack, SkipForward, Square, Volume2, Eye, EyeOff,
  Lock, Unlock, X, Search, ChevronDown, ChevronRight,
  AlertTriangle, Check, Loader2, Film, Music2, Layers,
  Upload, Wand2, BarChart2, Mic, BookOpen, Star, Clock, Save, FilePlus, FolderOpen,
} from "lucide-react";

// ── Colors (spec 2.1) ──────────────────────────────────────────────────────
const C = {
  bg:      "#0A0A0A",
  panel:   "#111111",
  border:  "#2A2A2A",
  gold:    "#D4A820",
  text:    "#F5F5F5",
  muted:   "#888888",
  red:     "#E05555",
  teal:    "#4CAF9A",
  dTeal:   "#112420",
  dBlue:   "#101830",
  dPurp:   "#1A1028",
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
type Tool = "select"|"razor"|"trim"|"slide"|"import"|"audio"|"text"
          |"color"|"effects"|"transitions"|"motion"|"zoom"|"hand";
type ITab = "assets"|"inspector"|"effects"|"color"|"audio"|"text"|"story";

interface Clip {
  id: string; trackId: string; name: string;
  start: number; duration: number;
  type: "video"|"audio"|"text";
  src: "generated"|"uploaded"|"drive";
  url?: string;
  mediaKey?: string; // stable IndexedDB key — survives page reload
  inPoint?: number;  // source in-point seconds (for razor splits)
  speed?: number;    // percentage, 100 = normal
  opacity?: number;  // 0–100
  effects?: string[];
  colorGrade?: string;
  colorAdjustments?: Record<string,number>; // named slider values
  volume?: number;   // 0–200
  muted?: boolean;
  transition?: string;        // transition at clip in-point (left end)
  transitionDuration?: number; // seconds, default 1.0
  transitionEnd?: string;     // transition at clip out-point (right end)
  transitionEndDuration?: number;
  // Text clip properties
  textContent?: string;
  textFont?: string;
  textSize?: number;
  textColor?: string;
  textAlign?: "left"|"center"|"right";
  textPosition?: "top"|"center"|"bottom";
  textAnimation?: string;
  // Audio plugin values per track (stored on audio clip)
  audioPlugins?: Record<string, Record<string,number>>; // plugin->param->value
}
interface Track {
  id: string; type: "video"|"audio"|"text";
  name: string; muted: boolean; locked: boolean; visible: boolean;
}
interface Msg { id: string; role: "user"|"assistant"; content: string; }

// ── Seed data ──────────────────────────────────────────────────────────────
const INIT_TRACKS: Track[] = [
  { id:"v1", type:"video", name:"Video 1",  muted:false, locked:false, visible:true },
  { id:"v2", type:"video", name:"Video 2",  muted:false, locked:false, visible:true },
  { id:"a1", type:"audio", name:"Music",    muted:false, locked:false, visible:true },
  { id:"a2", type:"audio", name:"SFX",      muted:false, locked:false, visible:true },
];
const PLATFORMS = ["YouTube","YouTube Shorts","Instagram Feed","Instagram Reels","TikTok","Facebook","Vimeo","Custom"];
const COLOR_PRESETS = [
  "None",
  "Golden Soul","Midnight Fedora","Ivory Gospel","Golden Hour","Teal + Orange",
  "Film Noir","Cinematic Blue","Warm Vintage","VHS Retro","Music Video",
  "Bleach Bypass","Cross Process","Day for Night","Neon Nights","Pastel Dream",
  "High Key","Low Key","Matte Finish","Sunset Gold","Teal Shadow",
  "Desert Heat","Arctic Blue","Emerald Forest","Burgundy Deep","Raw / Natural",
];
const COLOR_GRADE_FILTERS: Record<string,string> = {
  "None":            "",
  "Golden Soul":     "sepia(0.35) saturate(1.4) hue-rotate(8deg) brightness(1.05)",
  "Midnight Fedora": "contrast(1.45) brightness(0.82) saturate(0.65)",
  "Ivory Gospel":    "sepia(0.2) brightness(1.12) saturate(0.88) contrast(1.05)",
  "Golden Hour":     "sepia(0.55) saturate(1.6) hue-rotate(12deg) brightness(1.1)",
  "Teal + Orange":   "saturate(1.7) hue-rotate(-12deg) contrast(1.1)",
  "Film Noir":       "grayscale(0.85) contrast(1.55) brightness(0.88)",
  "Cinematic Blue":  "saturate(0.75) hue-rotate(195deg) brightness(0.92) contrast(1.1)",
  "Warm Vintage":    "sepia(0.6) saturate(1.25) brightness(1.06) contrast(0.95)",
  "VHS Retro":       "contrast(1.25) saturate(1.45) hue-rotate(-8deg) brightness(1.02)",
  "Music Video":     "contrast(1.35) saturate(1.55) brightness(1.06)",
  "Bleach Bypass":   "grayscale(0.35) contrast(1.65) brightness(0.95) saturate(0.55)",
  "Cross Process":   "saturate(1.9) hue-rotate(25deg) contrast(1.2) brightness(1.05)",
  "Day for Night":   "brightness(0.55) saturate(0.5) hue-rotate(195deg) contrast(1.2)",
  "Neon Nights":     "saturate(2.2) brightness(0.8) contrast(1.4) hue-rotate(260deg)",
  "Pastel Dream":    "saturate(0.65) brightness(1.18) contrast(0.85)",
  "High Key":        "brightness(1.35) contrast(0.8) saturate(0.9)",
  "Low Key":         "brightness(0.65) contrast(1.35) saturate(0.75)",
  "Matte Finish":    "contrast(0.88) brightness(1.05) saturate(0.8)",
  "Sunset Gold":     "sepia(0.45) saturate(1.8) hue-rotate(18deg) brightness(1.08) contrast(1.05)",
  "Teal Shadow":     "saturate(1.45) hue-rotate(168deg) brightness(0.9) contrast(1.15)",
  "Desert Heat":     "sepia(0.5) saturate(1.6) hue-rotate(-10deg) brightness(1.06) contrast(1.1)",
  "Arctic Blue":     "saturate(0.55) hue-rotate(200deg) brightness(1.1) contrast(1.2)",
  "Emerald Forest":  "saturate(1.4) hue-rotate(140deg) brightness(0.9) contrast(1.05)",
  "Burgundy Deep":   "saturate(1.2) hue-rotate(330deg) brightness(0.8) contrast(1.3)",
  "Raw / Natural":   "saturate(0.95) contrast(1.02) brightness(1.01)",
};

const TRANSITIONS = [
  {name:"Cut",       desc:"Instant hard cut (default)"},
  {name:"Crossfade", desc:"Smooth dissolve between clips"},
  {name:"Dip Black", desc:"Fade to/from black"},
  {name:"Flash",     desc:"White flash cut"},
  {name:"Wipe",      desc:"Horizontal wipe left to right"},
  {name:"Zoom In",   desc:"Punch-in zoom cut"},
];

function getClipCSSFilter(clip:Clip|null):string {
  if(!clip) return "";
  const parts:string[]=[];
  if(clip.colorGrade){const f=COLOR_GRADE_FILTERS[clip.colorGrade];if(f)parts.push(f);}
  // Apply manual color adjustments
  const adj=clip.colorAdjustments??{};
  if(adj["Brightness"]){const v=adj["Brightness"]/100;parts.push(`brightness(${1+v*0.6})`);}
  if(adj["Contrast"]){const v=adj["Contrast"]/100;parts.push(`contrast(${1+v*0.7})`);}
  if(adj["Saturation"]){const v=adj["Saturation"]/100;parts.push(`saturate(${1+v*1.2})`);}
  if(adj["Hue Shift"]){parts.push(`hue-rotate(${adj["Hue Shift"]}deg)`);}
  if(adj["Temperature"]){const v=adj["Temperature"]/100;parts.push(`sepia(${Math.abs(v)*0.3})`);}
  if(adj["Grain Amount"]){/* overlay only */}
  const fx=clip.effects??[];
  if(fx.includes("Gaussian Blur"))    parts.push("blur(2px)");
  if(fx.includes("Motion Blur"))      parts.push("blur(1.5px)");
  if(fx.includes("Sharpen"))          parts.push("contrast(1.4) brightness(1.05)");
  if(fx.includes("Glow Bloom"))       parts.push("brightness(1.35) saturate(1.5)");
  if(fx.includes("Chromatic Aberr.")) parts.push("saturate(1.6) hue-rotate(6deg)");
  if(fx.includes("VHS Tracking"))     parts.push("contrast(1.2) saturate(1.4) brightness(1.05)");
  if(fx.includes("Pixel Sort"))       parts.push("saturate(2.2) hue-rotate(35deg) contrast(1.3)");
  if(fx.includes("Film Burn"))        parts.push("sepia(0.8) saturate(1.8) brightness(1.2)");
  if(fx.includes("God Ray"))          parts.push("brightness(1.4) saturate(1.2)");
  if(fx.includes("Anamorphic Flare")) parts.push("brightness(1.15) contrast(1.05)");
  return parts.join(" ");
}

const EFFECTS = [
  { name:"Motion Blur",      cat:"Motion"     },
  { name:"Gaussian Blur",    cat:"Blur"       },
  { name:"Film Grain",       cat:"Grain"      },
  { name:"Anamorphic Flare", cat:"Lens"       },
  { name:"Bokeh Overlay",    cat:"Overlays"   },
  { name:"VHS Tracking",     cat:"Overlays"   },
  { name:"Film Burn",        cat:"Overlays"   },
  { name:"Dust Particles",   cat:"Particles"  },
  { name:"Embers",           cat:"Particles"  },
  { name:"Chromatic Aberr.", cat:"Glitch"     },
  { name:"Pixel Sort",       cat:"Glitch"     },
  { name:"Glow Bloom",       cat:"Stylize"    },
  { name:"Vignette",         cat:"Stylize"    },
  { name:"Sharpen",          cat:"Stylize"    },
  { name:"Fisheye",          cat:"Distortion" },
  { name:"God Ray",          cat:"Lens"       },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtTC(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60),
        sec = Math.floor(s%60), f = Math.floor((s%1)*24);
  return [h,m,sec,f].map(n=>String(n).padStart(2,"0")).join(":");
}
function clipBg(c: Clip) {
  if (c.type==="audio") return C.dTeal;
  if (c.type==="text")  return "#1A1500";
  if (c.src==="drive") return C.dPurp;
  if (c.src==="uploaded") return C.dBlue;
  return C.dTeal;
}
function sBtnSty(active=false): React.CSSProperties { return {
  display:"flex", alignItems:"center", gap:4,
  padding:"3px 8px", borderRadius:5,
  background: active ? `${C.gold}22` : "transparent",
  border:`1px solid ${active ? C.gold+"44" : C.border}`,
  color: active ? C.gold : C.muted,
  cursor:"pointer", fontSize:11,
};}

function detectFileType(f: File): "video"|"audio"|"image" {
  if (f.type.startsWith("video")) return "video";
  if (f.type.startsWith("audio")) return "audio";
  if (f.type.startsWith("image")) return "image";
  const ext = (f.name.split(".").pop() || "").toLowerCase();
  if (["mp4","mov","avi","mkv","webm","m4v","mts","ts","wmv","flv","ogv","3gp","m2ts"].includes(ext)) return "video";
  if (["mp3","wav","aac","flac","ogg","m4a","opus","wma","aiff","alac"].includes(ext)) return "audio";
  return "image";
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width:14, height:14, borderRadius:"50%",
      border:`2px solid ${C.gold}22`, borderTopColor:C.gold,
      animation:"spin 0.7s linear infinite",
    }}/>
  );
}

// ── ToolBtn (Zone 2 icon buttons) ─────────────────────────────────────────
function ToolBtn({ icon:Icon, label, kbd, active, onClick }: {
  icon:React.ElementType; label:string; kbd?:string;
  active?:boolean; onClick?:()=>void;
}) {
  const [h,setH]=useState(false);
  const [pos,setPos]=useState({top:0,left:0});
  return (
    <div style={{position:"relative"}}>
      <button
        onMouseEnter={e=>{
          setH(true);
          const r=e.currentTarget.getBoundingClientRect();
          setPos({top:r.top+r.height/2, left:r.right+10});
        }}
        onMouseLeave={()=>setH(false)}
        onClick={onClick}
        style={{
          width:40, height:40, borderRadius:8, border:"1px solid transparent",
          background: active?`${C.gold}22`:"transparent",
          color: active?C.gold:C.muted,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative", transition:"all 0.12s",
          ...(active && {border:`1px solid ${C.gold}33`}),
        }}>
        {active && <div style={{
          position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)",
          width:3, height:20, background:C.gold, borderRadius:"0 2px 2px 0",
        }}/>}
        <Icon size={16}/>
      </button>
      {h && (
        <div style={{
          position:"fixed", left:pos.left, top:pos.top,
          transform:"translateY(-50%)", zIndex:9999,
          background:"#1A1A1A", border:`1px solid ${C.border}`,
          borderRadius:6, padding:"4px 10px", whiteSpace:"nowrap",
          fontSize:11, color:C.text,
          display:"flex", gap:6, alignItems:"center",
          pointerEvents:"none", boxShadow:"0 4px 12px #00000088",
        }}>
          {label}
          {kbd && <span style={{
            color:C.muted, fontSize:9,
            background:"#2A2A2A", borderRadius:3, padding:"1px 5px",
          }}>{kbd}</span>}
        </div>
      )}
    </div>
  );
}

// ── TransportBtn ───────────────────────────────────────────────────────────
function TBtn({ icon:Icon, onClick, title }: {
  icon:React.ElementType; onClick?:()=>void; title?:string;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width:26, height:26, borderRadius:5, border:"none",
      background:"transparent", color:C.muted,
      display:"flex", alignItems:"center", justifyContent:"center",
      cursor:"pointer",
    }}><Icon size={13}/></button>
  );
}

// Hold-to-scroll transport button
function HoldTBtn({ icon:Icon, onAction, title }: {
  icon:React.ElementType; onAction:()=>void; title?:string;
}) {
  const ivRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const stop=()=>{ if(ivRef.current){ clearInterval(ivRef.current); ivRef.current=null; } };
  return (
    <button
      title={title}
      onClick={onAction}
      onMouseDown={()=>{ ivRef.current=setInterval(onAction,120); }}
      onMouseUp={stop}
      onMouseLeave={stop}
      style={{
        width:26, height:26, borderRadius:5, border:"none",
        background:"transparent", color:C.muted,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer",
      }}><Icon size={13}/></button>
  );
}

// ── ZONE 1: Top Bar ────────────────────────────────────────────────────────
function TopBar({ name, setName, onExport, onSettings, onSave, onNew, onImportProject, onCut, onCopy, onPaste, onDelete, onUndo, onRedo, hasSelection, canPaste }: {
  name:string; setName:(v:string)=>void;
  onExport:()=>void; onSettings:()=>void;
  onSave:()=>void; onNew:()=>void; onImportProject:()=>void;
  onCut:()=>void; onCopy:()=>void; onPaste:()=>void; onDelete:()=>void;
  onUndo:()=>void; onRedo:()=>void;
  hasSelection:boolean; canPaste:boolean;
}) {
  const [editing,setEditing]=useState(false);
  const editBtnSty=(enabled:boolean):React.CSSProperties=>({
    padding:"3px 8px", borderRadius:5, background:"transparent",
    border:`1px solid transparent`,
    color: enabled ? C.text : `${C.muted}55`,
    cursor: enabled ? "pointer" : "default", fontSize:11,
  });
  return (
    <div style={{
      gridColumn:"1/-1", gridRow:"1",
      height:52, background:C.panel,
      borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", padding:"0 12px", gap:8,
    }}>
      {/* LEFT */}
      <div style={{display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0}}>
        <Link href="/agent" style={{
          display:"flex", alignItems:"center", gap:3, padding:"4px 8px",
          borderRadius:6, color:C.muted, fontSize:12,
          textDecoration:"none", border:`1px solid ${C.border}`,
          whiteSpace:"nowrap",
        }}>
          <ChevronLeft size={13}/> Studio
        </Link>
        <div style={{width:1, height:16, background:C.border}}/>
        {editing ? (
          <input autoFocus value={name}
            onChange={e=>setName(e.target.value)}
            onBlur={()=>setEditing(false)}
            onKeyDown={e=>e.key==="Enter"&&setEditing(false)}
            style={{
              background:"transparent", border:`1px solid ${C.gold}44`,
              borderRadius:4, color:C.text, fontSize:13,
              padding:"2px 6px", outline:"none", width:180,
            }}/>
        ) : (
          <button onClick={()=>setEditing(true)} style={{
            background:"transparent", border:"none", color:C.text,
            fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:5,
          }}>
            {name}
            <div style={{width:5,height:5,borderRadius:"50%",background:C.gold}} title="Unsaved"/>
          </button>
        )}
        <span style={{fontSize:10, color:C.muted, whiteSpace:"nowrap"}}>Saved 2m ago</span>
      </div>

      {/* CENTER */}
      <div style={{display:"flex", alignItems:"center", gap:3}}>
        <button title="Undo (⌘Z)" onClick={onUndo} style={{
          display:"flex", alignItems:"center", padding:"4px 6px",
          borderRadius:5, background:"transparent",
          border:"1px solid transparent", color:C.muted, cursor:"pointer",
        }}><Undo2 size={13}/></button>
        <button title="Redo (⌘⇧Z)" onClick={onRedo} style={{
          display:"flex", alignItems:"center", padding:"4px 6px",
          borderRadius:5, background:"transparent",
          border:"1px solid transparent", color:C.muted, cursor:"pointer",
        }}><Redo2 size={13}/></button>
        <div style={{width:1,height:16,background:C.border,margin:"0 2px"}}/>
        <button onClick={onCut}    disabled={!hasSelection} style={editBtnSty(hasSelection)}  title="Cut (⌘X)">Cut</button>
        <button onClick={onCopy}   disabled={!hasSelection} style={editBtnSty(hasSelection)}  title="Copy (⌘C)">Copy</button>
        <button onClick={onPaste}  disabled={!canPaste}     style={editBtnSty(canPaste)}       title="Paste (⌘V)">Paste</button>
        <button onClick={onDelete} disabled={!hasSelection} style={editBtnSty(hasSelection)}  title="Delete (⌫)">Delete</button>
      </div>

      {/* RIGHT */}
      <div style={{display:"flex", alignItems:"center", gap:6, flex:1, justifyContent:"flex-end"}}>
        <button onClick={onNew} style={{
          display:"flex", alignItems:"center", gap:4, padding:"4px 8px",
          borderRadius:6, background:"transparent",
          border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontSize:11,
        }}><FilePlus size={13}/> New</button>
        <button onClick={onImportProject} style={{
          display:"flex", alignItems:"center", gap:4, padding:"4px 8px",
          borderRadius:6, background:"transparent",
          border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontSize:11,
        }}><FolderOpen size={13}/> Import</button>
        <button onClick={onSave} style={{
          display:"flex", alignItems:"center", gap:4, padding:"4px 8px",
          borderRadius:6, background:"transparent",
          border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontSize:11,
        }}><Save size={13}/> Save</button>
        <button onClick={onSettings} style={{
          display:"flex", alignItems:"center", gap:4, padding:"4px 8px",
          borderRadius:6, background:"transparent",
          border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontSize:11,
        }}><Settings size={13}/> Settings</button>
        <button style={{
          display:"flex", alignItems:"center", gap:4, padding:"4px 8px",
          borderRadius:6, background:"transparent",
          border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", fontSize:11,
        }}><Share2 size={13}/> Share</button>
        <button onClick={onExport} style={{
          display:"flex", alignItems:"center", gap:6, padding:"7px 16px",
          borderRadius:8, background:C.gold, color:"#0A0A0A",
          border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
        }}><Download size={13}/> Export</button>
      </div>
    </div>
  );
}

const TOOL_HINTS: Record<Tool,string> = {
  select:      "SELECT — click to select a clip · drag to move it",
  razor:       "RAZOR — click any clip to split it at that point",
  trim:        "TRIM — drag the left or right edge of a clip to trim it",
  slide:       "SLIDE — drag a clip to move it on the timeline",
  import:      "IMPORT — file dialog opened · drag files onto tracks too",
  audio:       "AUDIO — adjust volume, mute, EQ & effects in the Audio tab →",
  text:        "TEXT — click any timeline track to place a text overlay",
  color:       "COLOR — select a clip, then apply a grade in the Color tab →",
  effects:     "EFFECTS — select a clip, then apply FX in the FX tab →",
  transitions: "TRANSITIONS — browse effects in the FX tab →",
  motion:      "MOTION — animate clip properties in the FX tab →",
  zoom:        "ZOOM — click timeline to zoom in · Shift+click to zoom out",
  hand:        "PAN — click + drag on the timeline to scroll",
};

// ── ZONE 2: Tools Panel ────────────────────────────────────────────────────
function ToolsPanel({ tool, setTool, onTab, onImport }: {
  tool:Tool; setTool:(t:Tool)=>void; onTab:(t:ITab)=>void; onImport:()=>void;
}) {
  const groups: Array<Array<{id:Tool; icon:React.ElementType; label:string; kbd:string; tab?:ITab}>> = [
    [
      {id:"select",      icon:MousePointer2, label:"Select",       kbd:"V"},
      {id:"razor",       icon:Scissors,      label:"Razor/Split",  kbd:"B"},
      {id:"trim",        icon:MoveHorizontal,label:"Trim",         kbd:"T"},
      {id:"slide",       icon:ArrowLeftRight,label:"Slide",        kbd:"U"},
    ],
    [
      {id:"import",      icon:Plus,          label:"Import Media", kbd:"⌘I", tab:"assets"},
      {id:"audio",       icon:Music,         label:"Audio Tools",  kbd:"A",  tab:"audio"},
      {id:"text",        icon:Type,          label:"Text Tool",    kbd:"T",  tab:"text"},
      {id:"color",       icon:Palette,       label:"Color Tool",   kbd:"G",  tab:"color"},
      {id:"effects",     icon:Sparkles,      label:"Effects",      kbd:"⌘F", tab:"effects"},
      {id:"transitions", icon:Shuffle,       label:"Transitions",  kbd:"⌘T", tab:"effects"},
      {id:"motion",      icon:Move,          label:"Motion/Keys",  kbd:"K",  tab:"effects"},
    ],
    [
      {id:"zoom",        icon:ZoomIn,        label:"Zoom",         kbd:"Z"},
      {id:"hand",        icon:Hand,          label:"Pan",          kbd:"H"},
    ],
  ];
  return (
    <div style={{
      gridColumn:"1", gridRow:"2",
      background:C.panel, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"8px 0", gap:3, overflowY:"auto",
    }}>
      {groups.map((grp, gi) => (
        <React.Fragment key={gi}>
          {gi>0 && <div style={{width:32, height:1, background:C.border, margin:"3px 0"}}/>}
          {grp.map(t=>(
            <ToolBtn key={t.id} icon={t.icon} label={t.label} kbd={t.kbd}
              active={tool===t.id}
              onClick={()=>{
                setTool(t.id);
                if(t.tab) onTab(t.tab);
                if(t.id==="import") onImport();
              }}
            />
          ))}
        </React.Fragment>
      ))}
      <div style={{flex:1}}/>
      <div style={{width:32, height:1, background:C.border, margin:"3px 0"}}/>
      <ToolBtn icon={HelpCircle} label="Shortcuts" kbd="?"/>
      <ToolBtn icon={Maximize2}  label="Fullscreen Preview" kbd="⌘⇧F"/>
    </div>
  );
}

// ── ZONE 3: Preview Window ─────────────────────────────────────────────────
function PreviewWindow({ clips, playhead, setPlayhead, playing, setPlaying, narrative, duration, onToggleMax, isMaximized }: {
  clips:Clip[];
  playhead:number; setPlayhead:(t:number)=>void;
  playing:boolean; setPlaying:(v:boolean)=>void;
  narrative:boolean; duration:number;
  onToggleMax:()=>void; isMaximized:boolean;
}) {
  const wRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadedVideoUrl = useRef<string>("");
  // Prevents calling vid.play() on every RAF frame before the video actually starts;
  // reset whenever playing becomes false or the clip url changes.
  const playInitiatedRef = useRef(false);
  // Per-clip audio elements — one per clip so Music + SFX play simultaneously
  const audioElementsRef   = useRef<Map<string, HTMLAudioElement>>(new Map());
  const loadedAudioUrlsRef = useRef<Map<string, string>>(new Map());
  const loadingAudioIdsRef = useRef<Set<string>>(new Set());
  // Web Audio API routing for detached audio — avoids two-element decode contention
  const waCtxRef    = useRef<AudioContext|null>(null);
  const waSourceRef = useRef<MediaElementAudioSourceNode|null>(null);
  const waGainRef   = useRef<GainNode|null>(null);

  // ── Proxy mode: draw video frames onto a low-res canvas instead of
  // compositing the full-HD video texture every frame. Reduces GPU cost
  // significantly during editing; export always uses original source URLs.
  const [proxyMode, setProxyMode] = useState(true);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const proxyRafRef = useRef<number>(-1);

  useEffect(()=>{
    if(!proxyMode){ cancelAnimationFrame(proxyRafRef.current); return; }
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const draw = ()=>{
      const vid = videoRef.current;
      if(vid && vid.readyState >= 2 && vid.videoWidth > 0){
        // Replicate object-fit:contain letterboxing inside the canvas
        const vAR = vid.videoWidth / vid.videoHeight;
        const cAR = canvas.width / canvas.height;
        let dx=0, dy=0, dw=canvas.width, dh=canvas.height;
        if(vAR > cAR){ dh = canvas.width  / vAR; dy = (canvas.height - dh) / 2; }
        else          { dw = canvas.height * vAR; dx = (canvas.width  - dw) / 2; }
        ctx.fillStyle="#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(vid, dx, dy, dw, dh);
      }
      proxyRafRef.current = requestAnimationFrame(draw);
    };

    proxyRafRef.current = requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(proxyRafRef.current); };
  },[proxyMode]);

  // Active clips at current playhead position
  const activeVideoClip = clips
    .filter(c => c.type==="video" && !!c.url && c.start<=playhead && c.start+c.duration>playhead)
    .at(-1) ?? null;
  const activeAudioClips = clips
    .filter(c => c.type==="audio" && !!c.url && c.start<=playhead && c.start+c.duration>playhead);
  // Detached audio: clip sharing mediaKey with the active video (routed via Web Audio, not its own element)
  const detachedAudioClip = activeAudioClips.find(
    c => c.mediaKey && activeVideoClip?.mediaKey && c.mediaKey === activeVideoClip.mediaKey
  ) ?? null;

  // Sync video element with timeline
  useEffect(()=>{
    const vid = videoRef.current;
    if(!vid) return;
    const url = activeVideoClip?.url ?? "";
    const clipStart = activeVideoClip?.start ?? 0;
    const inPoint = activeVideoClip?.inPoint ?? 0;
    const target = Math.max(0, inPoint + (playhead - clipStart));

    // Source changed — reload
    if(loadedVideoUrl.current !== url) {
      loadedVideoUrl.current = url;
      playInitiatedRef.current = false;
      vid.pause();
      if(url) {
        vid.src = url;
        vid.addEventListener("loadedmetadata", ()=>{
          vid.currentTime = target;
          if(playing){ playInitiatedRef.current = true; vid.play().catch(()=>{}); }
        }, {once:true});
        vid.load();
      } else {
        vid.removeAttribute("src");
        vid.load();
      }
      return;
    }
    if(!url) return;

    // Play / pause / scrub
    if(playing) {
      // Guard: only call play() once per play action — vid.play() is async and vid.paused
      // stays true for several frames, causing multiple seeks and stutters without this.
      if(!playInitiatedRef.current) {
        playInitiatedRef.current = true;
        vid.currentTime = target;
        vid.play().catch(err => { if(err.name !== "AbortError") console.warn("play():", err); });
      }
      // else: video is already playing naturally — don't interfere
    } else {
      playInitiatedRef.current = false;
      if(!vid.paused) vid.pause();
      vid.currentTime = target; // scrubbing while paused
    }
  },[playing, playhead, activeVideoClip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync audio-only clips
  // Detect detached audio: audio clip that came from the same source as the active video clip
  const isDetachedAudio = !!detachedAudioClip;

  // Web Audio routing for detached audio.
  // Root cause of "slow-motion lag": loading a second HTMLMediaElement from a large MP4 blob
  // causes decode contention — both elements compete for the same media engine resources.
  // Fix: tap the VIDEO element's already-decoded audio output via a MediaElementSourceNode
  // and route it through a GainNode to the speakers. No second decode pipeline needed.
  useEffect(()=>{
    const vid=videoRef.current;
    if(!vid) return;
    if(!isDetachedAudio){
      // Tear down Web Audio routing when returning to normal
      waSourceRef.current?.disconnect();
      waGainRef.current?.disconnect();
      waSourceRef.current=null;
      waGainRef.current=null;
      return;
    }
    if(!waCtxRef.current) waCtxRef.current=new AudioContext();
    const ctx=waCtxRef.current;
    if(ctx.state==="suspended") ctx.resume().catch(()=>{});
    if(!waSourceRef.current){
      try{
        waSourceRef.current=ctx.createMediaElementSource(vid);
        waGainRef.current=ctx.createGain();
        waSourceRef.current.connect(waGainRef.current);
        waGainRef.current.connect(ctx.destination);
      }catch{ /* already created — no-op */ }
    }
    vid.muted=false; // unmute — audio flows through Web Audio not HTML5 output
  },[isDetachedAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update Web Audio gain when detached audio clip volume changes
  useEffect(()=>{
    if(!waGainRef.current||!waCtxRef.current||!isDetachedAudio) return;
    waGainRef.current.gain.setTargetAtTime(
      Math.min(1,(detachedAudioClip?.volume??100)/100),
      waCtxRef.current.currentTime, 0.01
    );
  },[detachedAudioClip?.volume, isDetachedAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync all non-detached audio clips — each gets its own HTMLAudioElement for simultaneous playback
  useEffect(()=>{
    const nonDetachedClips = activeAudioClips.filter(c => c !== detachedAudioClip);
    const activeIds = new Set(nonDetachedClips.map(c => c.id));

    // Tear down elements for clips no longer at the playhead
    for(const [id, aud] of audioElementsRef.current){
      if(!activeIds.has(id)){
        aud.pause(); aud.removeAttribute("src"); aud.load();
        audioElementsRef.current.delete(id);
        loadedAudioUrlsRef.current.delete(id);
        loadingAudioIdsRef.current.delete(id);
      }
    }

    for(const clip of nonDetachedClips){
      let aud = audioElementsRef.current.get(clip.id);
      if(!aud){ aud=new Audio(); aud.preload="auto"; audioElementsRef.current.set(clip.id,aud); }

      const target = Math.max(0,(clip.inPoint??0)+(playhead-clip.start));
      const url = clip.url??"";

      aud.volume = Math.min(1,(clip.volume??100)/100);
      aud.muted  = clip.muted??false;
      aud.playbackRate = clip.speed ? clip.speed/100 : 1;

      if(loadedAudioUrlsRef.current.get(clip.id) !== url){
        loadedAudioUrlsRef.current.set(clip.id, url);
        aud.pause(); loadingAudioIdsRef.current.delete(clip.id);
        if(url){
          const capturedAud = aud;
          const capturedId  = clip.id;
          loadingAudioIdsRef.current.add(capturedId);
          capturedAud.src = url;
          capturedAud.addEventListener("loadedmetadata",()=>{
            loadingAudioIdsRef.current.delete(capturedId);
            capturedAud.currentTime = target;
            if(playing) capturedAud.play().catch(()=>{});
          },{once:true});
          capturedAud.load();
        } else { aud.removeAttribute("src"); aud.load(); }
        continue;
      }
      if(!url) continue;
      if(playing){
        if(aud.paused&&!loadingAudioIdsRef.current.has(clip.id)){ aud.currentTime=target; aud.play().catch(()=>{}); }
      } else {
        if(!aud.paused) aud.pause();
        aud.currentTime=target;
      }
    }
  },[playing,playhead,activeAudioClips,detachedAudioClip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply clip speed to video playback rate
  useEffect(()=>{
    const vid=videoRef.current;
    if(!vid) return;
    vid.playbackRate=activeVideoClip?.speed?activeVideoClip.speed/100:1;
  },[activeVideoClip?.speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply video clip volume/mute — when Web Audio is active, keep video unmuted
  useEffect(()=>{
    const vid=videoRef.current;
    if(!vid) return;
    vid.volume=Math.min(1,(activeVideoClip?.volume??100)/100);
    if(!isDetachedAudio) vid.muted=activeVideoClip?.muted??false;
  },[activeVideoClip?.volume,activeVideoClip?.muted,isDetachedAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  const videoFilter = getClipCSSFilter(activeVideoClip);
  const videoOpacity = (activeVideoClip?.opacity ?? 100) / 100;
  const hasVignette = activeVideoClip?.effects?.includes("Vignette");
  const hasGrain = activeVideoClip?.effects?.includes("Film Grain");
  const hasChromatic = activeVideoClip?.effects?.includes("Chromatic Aberr.");

  // ── Transition rendering ──────────────────────────────────────────────────
  const tClipStart  = activeVideoClip?.start ?? 0;
  const tClipEnd    = tClipStart + (activeVideoClip?.duration ?? 0);
  const tSinceStart = playhead - tClipStart;
  const tBeforeEnd  = tClipEnd  - playhead;
  const inTransName  = activeVideoClip?.transition;
  const inTransDur   = activeVideoClip?.transitionDuration ?? 1;
  const outTransName = activeVideoClip?.transitionEnd;
  const outTransDur  = activeVideoClip?.transitionEndDuration ?? 1;
  // 0→1 through IN transition (0 = playhead just entered clip, 1 = done)
  const inProg  = inTransName  && tSinceStart >= 0 && tSinceStart < inTransDur  ? tSinceStart / inTransDur  : 1;
  // 0→1 through OUT transition (0 = hasn't started, 1 = at clip boundary)
  const outProg = outTransName && tBeforeEnd  >= 0 && tBeforeEnd  < outTransDur ? 1 - tBeforeEnd / outTransDur : 0;

  let transVideoOpacity   = videoOpacity;
  let transOverlayOpacity = 0;
  let transOverlayColor   = "#000";
  let transTransform      = "";
  let transClipPath       = "";

  if (inTransName && inProg < 1) {
    const p = inProg;
    if      (inTransName === "Crossfade") { transVideoOpacity = Math.min(transVideoOpacity, p); }
    else if (inTransName === "Dip Black") { transOverlayOpacity = Math.max(transOverlayOpacity, 1 - p); transOverlayColor = "#000"; }
    else if (inTransName === "Flash")     { transOverlayOpacity = Math.max(transOverlayOpacity, 1 - p); transOverlayColor = "#fff"; }
    else if (inTransName === "Wipe")      { transClipPath  = `inset(0 ${((1-p)*100).toFixed(1)}% 0 0)`; }
    else if (inTransName === "Zoom In")   { transTransform = `scale(${(1+(1-p)*0.3).toFixed(3)})`; }
  }
  if (outTransName && outProg > 0) {
    const p = outProg;
    if      (outTransName === "Crossfade") { transVideoOpacity = Math.min(transVideoOpacity, 1 - p); }
    else if (outTransName === "Dip Black") { transOverlayOpacity = Math.max(transOverlayOpacity, p); transOverlayColor = "#000"; }
    else if (outTransName === "Flash")     { transOverlayOpacity = Math.max(transOverlayOpacity, p); transOverlayColor = "#fff"; }
    else if (outTransName === "Wipe")      { transClipPath  = `inset(0 ${(p*100).toFixed(1)}% 0 0)`; }
    else if (outTransName === "Zoom In")   { transTransform = `scale(${(1+p*0.3).toFixed(3)})`; }
  }

  const handleWave=(e:React.MouseEvent)=>{
    if(!wRef.current) return;
    const r=wRef.current.getBoundingClientRect();
    setPlayhead(Math.max(0,Math.min(duration, ((e.clientX-r.left)/r.width)*duration)));
  };

  const hasVideo = !!activeVideoClip?.url;

  return (
    <div style={{flex:1, background:"#000", display:"flex", flexDirection:"column", minWidth:0}}>
      {/* Canvas */}
      <div style={{flex:1, background:"#050505", position:"relative", overflow:"hidden"}}>
        {/* Video element — always mounted, shown when active video clip exists */}
        <video ref={videoRef} preload="auto" playsInline
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"contain", background:"#000",
            display: hasVideo ? "block" : "none",
            visibility: proxyMode && hasVideo ? "hidden" : "visible",
            filter: videoFilter || undefined,
            opacity: transVideoOpacity,
            transform: transTransform || undefined,
            clipPath: transClipPath || undefined,
          }}
        />
        {/* Proxy canvas — low-res 854×480 composite drawn via RAF when proxyMode=true */}
        <canvas ref={canvasRef} width={854} height={480}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            display: proxyMode && hasVideo ? "block" : "none",
            filter: videoFilter || undefined,
            opacity: transVideoOpacity,
            transform: transTransform || undefined,
            clipPath: transClipPath || undefined,
          }}
        />
        {/* Transition overlay (Dip Black, Flash) */}
        {transOverlayOpacity > 0 && (
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            background:transOverlayColor, opacity:transOverlayOpacity, zIndex:10,
          }}/>
        )}
        {/* Placeholder when no video clip at playhead */}
        {!hasVideo && (
          <div style={{
            position:"absolute", inset:0, display:"flex",
            alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:"72%", maxWidth:600, aspectRatio:"16/9",
              background:"#0E0E0E", border:`1px solid ${C.border}`,
              borderRadius:4, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:8,
            }}>
              {activeAudioClips.length > 0 ? (
                <>
                  <Music2 size={36} color={C.gold}/>
                  <span style={{fontSize:11, color:C.muted}}>Audio: {activeAudioClips.map(c=>c.name).join(", ")}</span>
                </>
              ) : (
                <>
                  <Film size={36} color={C.border}/>
                  <span style={{fontSize:11, color:C.muted}}>Preview Canvas</span>
                  <span style={{fontSize:10, color:`${C.muted}66`}}>Drag a clip to the timeline to begin</span>
                </>
              )}
            </div>
          </div>
        )}
        {/* Vignette overlay */}
        {hasVignette && (
          <div style={{position:"absolute",inset:0,pointerEvents:"none",
            background:"radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.78) 100%)"}}/>
        )}
        {/* Film grain overlay */}
        {hasGrain && (
          <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.18,
            backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize:"200px 200px"}}/>
        )}
        {/* Chromatic aberration overlay */}
        {hasChromatic && (
          <div style={{position:"absolute",inset:0,pointerEvents:"none",
            boxShadow:"inset 3px 0 0 rgba(255,0,0,0.18), inset -3px 0 0 rgba(0,0,255,0.18)"}}/>
        )}
        {/* Text clip overlays */}
        {clips
          .filter(c=>c.type==="text"&&c.start<=playhead&&c.start+c.duration>playhead)
          .map(clip=>{
            const anim=clip.textAnimation&&clip.textAnimation!=="None"?clip.textAnimation:null;
            const ANIM_MAP:Record<string,string>={"Fade In":"pcut-fadeIn","Slide Up":"pcut-slideUp","Slide Down":"pcut-slideDown","Slide Left":"pcut-slideLeft","Slide Right":"pcut-slideRight","Zoom In":"pcut-zoomIn","Typewriter":"pcut-typewriter","Bounce":"pcut-bounce","Flash":"pcut-flash"};
            const animName=anim?ANIM_MAP[anim]:undefined;
            const animDur=anim==="Flash"?"0.5s":anim==="Typewriter"?`${Math.min(clip.duration*0.8,3)}s`:"0.7s";
            const opacity=(clip.opacity??100)/100;
            return (
              <div key={`${clip.id}-${clip.start}`} style={{
                position:"absolute",inset:0,pointerEvents:"none",zIndex:20,
                display:"flex",
                alignItems:clip.textPosition==="top"?"flex-start":clip.textPosition==="bottom"?"flex-end":"center",
                justifyContent:clip.textAlign==="left"?"flex-start":clip.textAlign==="right"?"flex-end":"center",
                padding:"6%",
                opacity,
              }}>
                <span style={{
                  fontSize:clip.textSize??48,
                  fontFamily:clip.textFont&&clip.textFont!=="Default"?clip.textFont:undefined,
                  color:clip.textColor??"#FFFFFF",
                  textAlign:clip.textAlign??"center",
                  textShadow:"0 2px 12px rgba(0,0,0,0.9),0 0 4px rgba(0,0,0,0.6)",
                  whiteSpace:"pre-wrap",
                  maxWidth:"90%",
                  lineHeight:1.25,
                  ...(animName&&{
                    animationName:animName,
                    animationDuration:animDur,
                    animationTimingFunction:anim==="Bounce"?"cubic-bezier(0.36,0.07,0.19,0.97)":"ease-out",
                    animationFillMode:anim==="Flash"?"none":"both",
                    animationIterationCount:anim==="Flash"?"infinite":"1",
                  }),
                }}>
                  {clip.textContent||clip.name}
                </span>
              </div>
            );
          })
        }
        {/* Narrative badge */}
        <div style={{
          position:"absolute", top:10, left:10,
          padding:"4px 10px", borderRadius:20, fontSize:10,
          background: narrative ? "#0F1A1A" : "#1A100A",
          border:`1px solid ${narrative ? C.gold+"44" : "#E0853344"}`,
          color: narrative ? C.gold : "#E08533",
          display:"flex", alignItems:"center", gap:5,
        }}>
          {narrative ? <Film size={11}/> : <AlertTriangle size={11}/>}
          {narrative ? "Music Video — Triumphant" : "No Story Context"}
        </div>
        {/* Timecode + maximize toggle */}
        <div style={{position:"absolute", top:8, right:8, display:"flex", alignItems:"center", gap:6}}>
          <span style={{fontSize:10, color:`${C.muted}77`, fontFamily:"monospace"}}>{fmtTC(playhead)}</span>
          <button onClick={()=>setProxyMode(m=>!m)} title={proxyMode?"Proxy mode ON (480p) — click for HD":"HD mode — click for Proxy (480p)"}
            style={{
              height:22, padding:"0 7px", borderRadius:4,
              background: proxyMode ? C.gold+"22" : "#00000088",
              border:`1px solid ${proxyMode ? C.gold+"66" : C.border}`,
              color: proxyMode ? C.gold : C.muted, cursor:"pointer",
              fontSize:9, fontWeight:700, letterSpacing:"0.05em",
            }}>
            {proxyMode ? "P" : "HD"}
          </button>
          <button onClick={onToggleMax} title={isMaximized?"Restore panel":"Maximize preview"} style={{
            width:22, height:22, borderRadius:4, background:"#00000088",
            border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Maximize2 size={11}/>
          </button>
        </div>
      </div>

      {/* Transport */}
      <div style={{
        height:52, background:C.panel, borderTop:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", padding:"0 12px", gap:6,
      }}>
        <div style={{fontFamily:"monospace", fontSize:11, display:"flex", gap:4}}>
          <span style={{color:C.text}}>{fmtTC(playhead)}</span>
          <span style={{color:C.muted}}>/ {fmtTC(duration)}</span>
        </div>
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:3}}>
          <TBtn icon={SkipBack}     onClick={()=>setPlayhead(0)} title="Go to Start"/>
          <HoldTBtn icon={SkipBack} onAction={()=>setPlayhead(Math.max(0,Math.round((playhead-1)*10)/10))} title="Rewind 1s (hold to scroll)"/>
          <TBtn icon={ChevronLeft}  onClick={()=>setPlayhead(Math.max(0,playhead-1/24))} title="Step Back 1 frame"/>
          <TBtn icon={Square}       onClick={()=>{setPlaying(false);setPlayhead(0);}} title="Stop"/>
          <button onClick={()=>setPlaying(!playing)} style={{
            width:34, height:34, borderRadius:8, background:C.gold,
            border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          }}>
            {playing ? <Pause size={15} color="#0A0A0A"/> : <Play size={15} color="#0A0A0A"/>}
          </button>
          <TBtn icon={ChevronRight}  onClick={()=>setPlayhead(Math.min(duration,playhead+1/24))} title="Step Forward 1 frame"/>
          <HoldTBtn icon={SkipForward} onAction={()=>setPlayhead(Math.min(duration,Math.round((playhead+1)*10)/10))} title="Fast Forward 1s (hold to scroll)"/>
          <TBtn icon={SkipForward}   onClick={()=>setPlayhead(duration)} title="Go to End"/>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:6}}>
          <Volume2 size={12} color={C.muted}/>
          <div style={{width:56, height:3, background:C.border, borderRadius:2, position:"relative"}}>
            <div style={{width:"75%", height:"100%", background:C.gold, borderRadius:2}}/>
          </div>
        </div>
      </div>

      {/* Waveform strip */}
      <div ref={wRef} onClick={handleWave} style={{
        height:34, background:"#0C0C0C", borderTop:`1px solid #1A1A1A`,
        cursor:"crosshair", position:"relative", overflow:"hidden",
      }}>
        {Array.from({length:100}).map((_,i)=>(
          <div key={i} style={{
            position:"absolute", left:`${i}%`, bottom:"50%",
            width:2, height:`${15+Math.abs(Math.sin(i*0.7+1)*55)}%`,
            transform:"translateY(50%)", borderRadius:1,
            background: i/100 < playhead/duration ? C.gold : C.teal,
            opacity:0.55,
          }}/>
        ))}
        <div style={{
          position:"absolute", left:`${(playhead/duration)*100}%`,
          top:0, bottom:0, width:2, background:C.gold,
          transform:"translateX(-50%)", pointerEvents:"none",
        }}/>
        {narrative && <>
          <div style={{position:"absolute",left:0,width:"30%",top:0,bottom:0,background:"#1A3A5A18"}}/>
          <div style={{position:"absolute",left:"30%",width:"45%",top:0,bottom:0,background:"#5A3A1A18"}}/>
          <div style={{position:"absolute",left:"75%",width:"25%",top:0,bottom:0,background:"#5A4A1A18"}}/>
        </>}
      </div>
    </div>
  );
}

// ── ZONE 4: Inspector ──────────────────────────────────────────────────────
function InspectorPanel({ activeTab, setActiveTab, selectedClip, narrative, setNarrative, storyText, setStoryText, assets, setAssets, onUpdateClip, onAddClip, onDetachAudio, tracks, allClips, onToggleTrack, playhead, snapshot }: {
  activeTab:ITab; setActiveTab:(t:ITab)=>void;
  selectedClip:Clip|null; narrative:boolean; setNarrative:(v:boolean)=>void;
  storyText:string; setStoryText:(v:string)=>void;
  assets:Asset[]; setAssets:React.Dispatch<React.SetStateAction<Asset[]>>;
  onUpdateClip:(id:string, updates:Partial<Clip>)=>void;
  onAddClip:(name:string)=>void;
  onDetachAudio:()=>void;
  tracks:Track[]; allClips:Clip[];
  onToggleTrack:(id:string,prop:"muted"|"locked"|"visible")=>void;
  playhead:number;
  snapshot:()=>void;
}) {
  const TABS: Array<{id:ITab; label:string}> = [
    {id:"assets",    label:"Assets"},
    {id:"inspector", label:"Clip"},
    {id:"effects",   label:"FX"},
    {id:"color",     label:"Color"},
    {id:"audio",     label:"Audio"},
    {id:"text",      label:"Text"},
    {id:"story",     label:"AI"},
  ];
  return (
    <div style={{
      gridColumn:"3", gridRow:"2",
      background:C.panel, borderLeft:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Tab bar */}
      <div style={{
        display:"flex", borderBottom:`1px solid ${C.border}`,
        overflowX:"auto", flexShrink:0,
      }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            flex:1, padding:"10px 4px",
            background:"transparent", border:"none",
            borderBottom: activeTab===t.id ? `2px solid ${C.gold}` : "2px solid transparent",
            color: activeTab===t.id ? C.gold : C.muted,
            fontSize:10, cursor:"pointer", whiteSpace:"nowrap",
            fontWeight: activeTab===t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
        {activeTab==="assets"    && <AssetsTab assets={assets} setAssets={setAssets}/>}
        {activeTab==="inspector" && <InspectorTab clip={selectedClip} onUpdateClip={onUpdateClip} onDetachAudio={onDetachAudio} playhead={playhead}/>}
        {activeTab==="effects"   && <EffectsTab clip={selectedClip} onUpdateClip={onUpdateClip}/>}
        {activeTab==="color"     && <ColorTab clip={selectedClip} onUpdateClip={onUpdateClip} snapshot={snapshot}/>}
        {activeTab==="audio"     && <AudioTab tracks={tracks} allClips={allClips} onUpdateClip={onUpdateClip} onToggleTrack={onToggleTrack} snapshot={snapshot}/>}
        {activeTab==="text"      && <TextTab onAddClip={onAddClip} selectedClip={selectedClip} onUpdateClip={onUpdateClip} snapshot={snapshot}/>}
        {activeTab==="story"     && <StoryTab narrative={narrative} setNarrative={setNarrative} storyText={storyText} setStoryText={setStoryText}/>}
      </div>
    </div>
  );
}

// ── Tab: Assets ────────────────────────────────────────────────────────────
interface Asset { name:string; dur:string; type:"video"|"audio"|"image"; src:"uploaded"|"generated"|"drive"; url?:string; thumb?:string; mediaKey?:string; }
interface HistoryItem { id:string; section:string; model:string; prompt?:string; output_url?:string; thumbnail_url?:string; created_at:string; }

function sectionToType(s:string): "video"|"image" {
  return (s==="video"||s==="motion"||s==="lipsync") ? "video" : "image";
}

function extractVideoThumb(url:string): Promise<string> {
  return new Promise(resolve=>{
    const video=document.createElement("video");
    video.crossOrigin="anonymous";
    video.preload="metadata";
    video.muted=true;
    video.src=url;
    const draw=()=>{
      try {
        const canvas=document.createElement("canvas");
        canvas.width=320; canvas.height=180;
        canvas.getContext("2d")?.drawImage(video,0,0,320,180);
        resolve(canvas.toDataURL("image/jpeg",0.75));
      } catch { resolve(""); }
    };
    video.addEventListener("loadedmetadata",()=>{ video.currentTime=0.5; },{once:true});
    video.addEventListener("seeked",draw,{once:true});
    video.addEventListener("error",()=>resolve(""),{once:true});
    video.load();
  });
}

function AssetsTab({ assets, setAssets }: { assets:Asset[]; setAssets:React.Dispatch<React.SetStateAction<Asset[]>>; }) {
  const [view,setView]=useState<"local"|"history">("local");
  const [filter,setFilter]=useState("All");
  const [q,setQ]=useState("");
  const [preview,setPreview]=useState<Asset|null>(null);
  const [history,setHistory]=useState<HistoryItem[]>([]);
  const [histLoading,setHistLoading]=useState(false);
  const [added,setAdded]=useState<Set<string>>(new Set());
  const fileRef=useRef<HTMLInputElement>(null);
  const filters=["All","Video","Audio","Images","Uploaded","Generated"];

  const loadHistory=useCallback(async()=>{
    setHistLoading(true);
    try {
      const res=await fetch("/api/supabase/history");
      if(res.ok){ const d=await res.json(); setHistory(Array.isArray(d)?d:[]); }
    } catch { /* silent */ }
    finally{ setHistLoading(false); }
  },[]);

  useEffect(()=>{ if(view==="history") loadHistory(); },[view,loadHistory]);

  const handleFiles=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(e.target.files||[]);
    const newOnes:Asset[]=files.map(f=>{
      const type=detectFileType(f);
      const mediaKey=`media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return {
        name: f.name.replace(/\.[^.]+$/,""),
        dur: type==="image"?`${(f.size/1024).toFixed(0)}KB`:"—",
        type, src:"uploaded",
        url: URL.createObjectURL(f),
        mediaKey,
      };
    });
    // Optimistically add assets first so UI responds immediately
    setAssets(p=>[...p,...newOnes]);
    e.target.value="";
    // Store blobs in IndexedDB for save/import persistence
    for(let i=0;i<files.length;i++){
      const key=newOnes[i].mediaKey;
      if(key) storeMedia(key, files[i]).catch(()=>{});
    }
    // Then extract first-frame thumbnails for videos in background
    for(const asset of newOnes){
      if(asset.type==="video"&&asset.url){
        const thumb=await extractVideoThumb(asset.url);
        if(thumb) setAssets(p=>p.map(a=>a.url===asset.url&&!a.thumb?{...a,thumb}:a));
      }
    }
  };

  const importFromHistory=(item:HistoryItem)=>{
    if(!item.output_url) return;
    const label=item.prompt ? item.prompt.slice(0,40) : `${item.section} · ${item.model}`;
    setAssets(p=>[...p,{
      name: label,
      dur:"—",
      type: sectionToType(item.section),
      src:"generated",
      url: item.output_url,
      thumb: item.thumbnail_url||item.output_url,
    }]);
    setAdded(p=>new Set(p).add(item.id));
  };

  const visible=assets.filter(a=>{
    const mf=filter==="All"||(filter==="Video"&&a.type==="video")||(filter==="Audio"&&a.type==="audio")||(filter==="Images"&&a.type==="image")||(filter==="Uploaded"&&a.src==="uploaded")||(filter==="Generated"&&a.src==="generated");
    return mf&&a.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>
      {/* Source tabs */}
      <div style={{display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
        {(["local","history"] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{
            flex:1, padding:"8px 4px", background:"transparent", border:"none",
            borderBottom: view===v?`2px solid ${C.gold}`:"2px solid transparent",
            color: view===v?C.gold:C.muted, fontSize:10, cursor:"pointer", fontWeight:view===v?600:400,
          }}>{v==="local"?"My Files":"Output History"}</button>
        ))}
      </div>

      {view==="local" ? (
        <>
          <div style={{padding:"8px 10px", borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex", gap:4, background:"#0D0D0D", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px"}}>
              <Search size={12} color={C.muted}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search assets..." style={{flex:1, background:"transparent", border:"none", outline:"none", color:C.text, fontSize:11}}/>
            </div>
            <div style={{display:"flex", gap:3, marginTop:7, flexWrap:"wrap"}}>
              {filters.map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{
                  padding:"2px 6px", borderRadius:10, fontSize:9,
                  background:filter===f?`${C.gold}22`:"transparent",
                  border:`1px solid ${filter===f?C.gold+"44":C.border}`,
                  color:filter===f?C.gold:C.muted, cursor:"pointer",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1, overflowY:"auto", padding:"8px 10px"}}>
            {visible.length===0 ? (
              <div style={{textAlign:"center", padding:"24px 0", color:C.muted, fontSize:10}}>
                {assets.length===0?"No media yet. Upload or import from Output History.":"No assets match this filter."}
              </div>
            ) : (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                {visible.map((a,i)=>(
                  <div key={i}
                    draggable
                    onDragStart={e=>{
                      e.dataTransfer.effectAllowed="copy";
                      e.dataTransfer.setData("application/procut-asset", JSON.stringify({name:a.name,type:a.type,src:a.src,url:a.url,mediaKey:a.mediaKey}));
                    }}
                    style={{background:"#0D0D0D", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", cursor:"grab", position:"relative"}}>
                    <div style={{height:52, background:a.type==="video"?C.dTeal:a.type==="audio"?C.dBlue:C.dPurp, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative"}}>
                      {a.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.thumb} alt={a.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      ) : a.type==="video"?<Film size={18} color={C.teal}/>:a.type==="audio"?<Music size={18} color={C.gold}/>:<Eye size={18} color={`${C.gold}88`}/>}
                      <div style={{position:"absolute",bottom:2,left:3,fontSize:7,color:C.gold,background:"#000A",padding:"1px 3px",borderRadius:2}}>{a.src}</div>
                      <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setPreview(a);}}
                        style={{position:"absolute",top:3,right:3,width:18,height:18,borderRadius:4,
                          background:"rgba(0,0,0,0.65)",border:`1px solid ${C.border}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"pointer",color:C.text,padding:0}}>
                        <Eye size={9}/>
                      </button>
                    </div>
                    <div style={{padding:"4px 6px", display:"flex", alignItems:"center", gap:3}}>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{fontSize:9, color:C.text, margin:0, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis"}}>{a.name}</p>
                        <p style={{fontSize:9, color:C.muted, margin:0}}>{a.dur}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setAssets(p=>p.filter((_,j)=>j!==i));}}
                        style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0,flexShrink:0,lineHeight:1}}>
                        <X size={10}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileRef} type="file" multiple accept="video/*,audio/*,image/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.mts,.wmv,.mp3,.wav,.aac,.flac,.m4a,.ogg,.heic" style={{display:"none"}} onChange={handleFiles}/>
            <button onClick={()=>fileRef.current?.click()} style={{
              width:"100%", marginTop:10, padding:"8px",
              borderRadius:8, border:`1px dashed ${C.border}`,
              background:"transparent", color:C.muted, cursor:"pointer", fontSize:11,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              <Upload size={12}/> Upload Media
            </button>
          </div>
        </>
      ) : (
        <div style={{flex:1, overflowY:"auto", padding:"8px 10px"}}>
          {histLoading ? (
            <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 0", gap:8}}>
              <Spinner/><span style={{fontSize:10,color:C.muted}}>Loading history...</span>
            </div>
          ) : history.length===0 ? (
            <div style={{textAlign:"center", padding:"24px 0", color:C.muted, fontSize:10}}>
              No output history found. Generate something first.
            </div>
          ) : (
            <>
              <p style={{fontSize:9, color:C.muted, margin:"0 0 8px 0"}}>Click to import into editor</p>
              <div style={{display:"flex", flexDirection:"column", gap:5}}>
                {history.map(item=>(
                  <div key={item.id}
                    draggable={!!item.output_url}
                    onDragStart={e=>{
                      if(!item.output_url) return;
                      const label=item.prompt?item.prompt.slice(0,40):`${item.section} · ${item.model}`;
                      e.dataTransfer.effectAllowed="copy";
                      e.dataTransfer.setData("application/procut-asset", JSON.stringify({
                        name:label, type:sectionToType(item.section), src:"generated", url:item.output_url,
                      }));
                    }}
                    style={{
                      display:"flex", alignItems:"center", gap:8,
                      background:"#0D0D0D", border:`1px solid ${added.has(item.id)?C.gold+"44":C.border}`,
                      borderRadius:8, overflow:"hidden", padding:0,
                      cursor: item.output_url?"grab":"default",
                    }}>
                    {/* Thumb */}
                    <div style={{width:48, height:48, flexShrink:0, background:C.dTeal, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden"}}>
                      {(item.thumbnail_url||item.output_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnail_url||item.output_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      ) : <Film size={16} color={C.teal}/>}
                    </div>
                    {/* Info */}
                    <div style={{flex:1, minWidth:0, padding:"4px 0"}}>
                      <p style={{fontSize:10, color:C.text, margin:0, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis"}}>
                        {item.prompt ? item.prompt.slice(0,38)+"…" : item.model}
                      </p>
                      <p style={{fontSize:9, color:C.muted, margin:0, textTransform:"capitalize"}}>{item.section}</p>
                    </div>
                    {/* Import btn */}
                    <button onClick={()=>importFromHistory(item)} disabled={!item.output_url} style={{
                      flexShrink:0, marginRight:8,
                      padding:"4px 8px", borderRadius:5, fontSize:9,
                      background: added.has(item.id)?`${C.gold}22`:"transparent",
                      border:`1px solid ${added.has(item.id)?C.gold+"44":C.border}`,
                      color: added.has(item.id)?C.gold:C.muted,
                      cursor: item.output_url?"pointer":"default",
                    }}>
                      {added.has(item.id)?"Added":"+ Add"}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={loadHistory} style={{
                width:"100%", marginTop:10, padding:"6px",
                borderRadius:8, border:`1px solid ${C.border}`,
                background:"transparent", color:C.muted, cursor:"pointer", fontSize:10,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}>
                <Star size={10}/> Refresh History
              </button>
            </>
          )}
        </div>
      )}

      {/* Asset preview modal */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{
          position:"fixed", inset:0, zIndex:600,
          background:"rgba(0,0,0,0.88)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:500, maxWidth:"92vw",
            background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:14, overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:`1px solid ${C.border}`}}>
              <div>
                <p style={{fontSize:12, color:C.text, margin:0, fontWeight:600}}>{preview.name}</p>
                <p style={{fontSize:9, color:C.muted, margin:"2px 0 0", textTransform:"capitalize"}}>{preview.type} · {preview.src}</p>
              </div>
              <button onClick={()=>setPreview(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4}}>
                <X size={15}/>
              </button>
            </div>

            {/* Media */}
            <div style={{padding:12}}>
              {preview.type==="video" ? (
                <video src={preview.url} controls autoPlay playsInline
                  style={{width:"100%", borderRadius:8, background:"#000", maxHeight:300, display:"block"}}/>
              ) : preview.type==="audio" ? (
                <div style={{padding:"20px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:14}}>
                  <div style={{width:64, height:64, borderRadius:"50%", background:`${C.gold}1A`, border:`1px solid ${C.gold}33`, display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Music2 size={28} color={C.gold}/>
                  </div>
                  <audio src={preview.url} controls style={{width:"100%"}}/>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url||preview.thumb} alt={preview.name}
                  style={{width:"100%", borderRadius:8, maxHeight:320, objectFit:"contain", display:"block", background:"#050505"}}/>
              )}
            </div>

            <p style={{fontSize:9, color:C.muted, textAlign:"center", margin:"0 0 12px", opacity:0.6}}>
              Close and drag the card onto a timeline track
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Inspector ─────────────────────────────────────────────────────────
function InspectorTab({ clip, onUpdateClip, onDetachAudio, playhead }: {
  clip:Clip|null;
  onUpdateClip:(id:string,updates:Partial<Clip>)=>void;
  onDetachAudio?:()=>void;
  playhead:number;
}) {
  if (!clip) return (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
      <p style={{fontSize:11, color:C.muted, textAlign:"center"}}>
        Select a clip on the timeline to inspect its properties.
      </p>
    </div>
  );
  const speed = clip.speed ?? 100;
  const opacity = clip.opacity ?? 100;
  const appliedFx = clip.effects ?? [];
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:11, color:C.gold, margin:"0 0 10px 0", fontWeight:600}}>{clip.name}</p>
      {[
        ["Timeline In",  fmtTC(clip.start)],
        ["Timeline Out", fmtTC(clip.start+clip.duration)],
        ["Duration",     `${clip.duration}s`],
        ["Type",         clip.type],
        ["Source",       clip.src],
      ].map(([l,v])=>(
        <div key={l} style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
          <span style={{fontSize:11, color:C.muted}}>{l}</span>
          <span style={{fontSize:11, color:C.text}}>{v}</span>
        </div>
      ))}
      <button onClick={()=>onUpdateClip(clip.id,{start:Math.round(playhead*10)/10})} style={{
        width:"100%", padding:"6px 8px", borderRadius:6, cursor:"pointer", fontSize:10,
        background:`${C.gold}11`, border:`1px solid ${C.gold}44`,
        color:C.gold, display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:10,
      }}>
        <Move size={11}/> Snap to Playhead ({fmtTC(playhead)})
      </button>
      <div style={{marginTop:10}}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>DURATION (s)</p>
        <input type="number" min={0.1} step={0.1} value={clip.duration}
          onChange={e=>onUpdateClip(clip.id,{duration:Math.max(0.1,Number(e.target.value))})}
          style={{width:"100%", background:"#0D0D0D", border:`1px solid ${C.border}`,
            borderRadius:6, color:C.text, padding:"4px 8px", fontSize:11, outline:"none"}}/>
      </div>
      <div style={{marginTop:10}}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>SPEED (%)</p>
        <input type="number" min={10} max={400} value={speed}
          onChange={e=>onUpdateClip(clip.id,{speed:Number(e.target.value)})}
          style={{width:"100%", background:"#0D0D0D", border:`1px solid ${C.border}`,
            borderRadius:6, color:C.text, padding:"4px 8px", fontSize:11, outline:"none"}}/>
      </div>
      <div style={{marginTop:10}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
          <p style={{fontSize:10, color:C.muted, margin:0}}>OPACITY</p>
          <span style={{fontSize:10, color:C.text}}>{opacity}%</span>
        </div>
        <input type="range" min={0} max={100} value={opacity}
          onChange={e=>onUpdateClip(clip.id,{opacity:Number(e.target.value)})}
          style={{width:"100%", accentColor:C.gold}}/>
      </div>
      <div style={{marginTop:12}}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>AI ENHANCE</p>
        {["Stabilize","Upscale","Denoise","Interpolate"].map(a=>{
          const active=appliedFx.includes(a);
          return (
            <button key={a} onClick={()=>onUpdateClip(clip.id,{effects:active?appliedFx.filter(x=>x!==a):[...appliedFx,a]})}
              style={{
                width:"100%", marginTop:6, padding:"6px",
                borderRadius:6, cursor:"pointer", fontSize:11,
                background: active?`${C.gold}22`:"transparent",
                border:`1px solid ${active?C.gold+"66":C.border}`,
                color: active?C.gold:C.muted,
              }}>{active?"✓ ":""}{a}</button>
          );
        })}
      </div>
      {appliedFx.length>0 && (
        <div style={{marginTop:10, padding:"6px 8px", background:"#0D1A0D", borderRadius:6, border:`1px solid ${C.teal}33`}}>
          <p style={{fontSize:9, color:C.teal, margin:0}}>Applied: {appliedFx.join(", ")}</p>
        </div>
      )}
      {clip.type==="video"&&clip.url&&onDetachAudio&&(
        <div style={{marginTop:16}}>
          <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>AUDIO</p>
          <button onClick={onDetachAudio} style={{
            width:"100%", padding:"6px 8px", borderRadius:6, cursor:"pointer", fontSize:10,
            background:"transparent", border:`1px solid ${C.border}`,
            color:C.muted, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            <Music size={11}/> Detach Audio to Music Track
          </button>
          {clip.muted&&(
            <p style={{fontSize:9,color:C.teal,margin:"4px 0 0",textAlign:"center"}}>Audio detached — playing on Music track</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Effects ───────────────────────────────────────────────────────────
function EffectsTab({ clip, onUpdateClip }: { clip:Clip|null; onUpdateClip:(id:string,updates:Partial<Clip>)=>void }) {
  const [q,setQ]=useState(""), [cat,setCat]=useState("All"), [transPos,setTransPos]=useState<"in"|"out">("in");
  const cats=["All","Motion","Blur","Grain","Lens","Overlays","Particles","Glitch","Stylize","Distortion"];
  const filtered=EFFECTS.filter(e=>(cat==="All"||e.cat===cat)&&e.name.toLowerCase().includes(q.toLowerCase()));
  const appliedFx = clip?.effects ?? [];
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>
      {!clip && (
        <div style={{padding:"8px 10px", background:`${C.gold}0A`, borderBottom:`1px solid ${C.border}`}}>
          <p style={{fontSize:10, color:C.muted, margin:0}}>Select a clip to apply effects</p>
        </div>
      )}
      {clip && appliedFx.length>0 && (
        <div style={{padding:"6px 10px", background:"#0D1A0D", borderBottom:`1px solid ${C.teal}22`}}>
          <p style={{fontSize:9, color:C.teal, margin:0}}>Applied: {appliedFx.join(" · ")}</p>
        </div>
      )}
      <div style={{padding:"8px 10px", borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex", gap:4, background:"#0D0D0D", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px"}}>
          <Search size={12} color={C.muted}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search effects..."
            style={{flex:1, background:"transparent", border:"none", outline:"none", color:C.text, fontSize:11}}/>
        </div>
        <div style={{display:"flex", gap:3, marginTop:7, flexWrap:"wrap"}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{
              padding:"2px 6px", borderRadius:10, fontSize:9,
              background:cat===c?`${C.gold}22`:"transparent",
              border:`1px solid ${cat===c?C.gold+"44":C.border}`,
              color:cat===c?C.gold:C.muted, cursor:"pointer",
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"6px 10px"}}>
        {filtered.map(e=>{
          const applied=appliedFx.includes(e.name);
          return (
            <div key={e.name} style={{
              display:"flex", alignItems:"center",
              padding:"7px 8px", borderRadius:7, marginBottom:3,
              border:`1px solid ${applied?C.gold+"44":C.border}`,
              background: applied?"#1A1400":"#0D0D0D",
            }}>
              <div style={{flex:1}}>
                <p style={{fontSize:11, color:applied?C.gold:C.text, margin:0}}>{e.name}</p>
                <p style={{fontSize:9, color:C.muted, margin:0}}>{e.cat}</p>
              </div>
              <button
                disabled={!clip}
                onClick={()=>{ if(!clip) return; onUpdateClip(clip.id,{effects:applied?appliedFx.filter(n=>n!==e.name):[...appliedFx,e.name]}); }}
                style={{
                  padding:"3px 8px", borderRadius:5, fontSize:10, cursor:clip?"pointer":"default",
                  background: applied?`${C.red}22`:`${C.gold}22`,
                  border:`1px solid ${applied?C.red+"44":C.gold+"44"}`,
                  color: applied?C.red:C.gold,
                }}>{applied?"Remove":"Apply"}</button>
            </div>
          );
        })}

        {/* Transitions */}
        <div style={{marginTop:14, paddingTop:10, borderTop:`1px solid ${C.border}`}}>
          <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0", letterSpacing:"0.05em"}}>TRANSITIONS</p>
          {!clip&&<p style={{fontSize:10,color:`${C.muted}88`,margin:0}}>Select a clip to add a transition</p>}
          <p style={{fontSize:9,color:`${C.muted}88`,margin:"0 0 6px 0"}}>Drag onto clip edge · or choose IN / OUT then click Set</p>
          {/* IN / OUT toggle */}
          <div style={{display:"flex", gap:4, marginBottom:8}}>
            {(["in","out"] as const).map(pos=>(
              <button key={pos} onClick={()=>setTransPos(pos)} style={{
                flex:1, padding:"4px 0", borderRadius:5, fontSize:10, cursor:"pointer",
                background: transPos===pos?`${C.gold}22`:"transparent",
                border:`1px solid ${transPos===pos?C.gold+"55":C.border}`,
                color: transPos===pos?C.gold:C.muted,
              }}>{pos==="in"?"▶ CLIP IN":"CLIP OUT ◀"}</button>
            ))}
          </div>
          {TRANSITIONS.map(t=>{
            const active = transPos==="in" ? clip?.transition===t.name : clip?.transitionEnd===t.name;
            return (
              <div key={t.name}
                draggable
                onDragStart={e=>{
                  e.dataTransfer.setData("application/procut-transition",t.name);
                  e.dataTransfer.setData("application/procut-transition-pos", transPos);
                  e.dataTransfer.effectAllowed="copy";
                }}
                style={{
                  display:"flex", alignItems:"center",
                  padding:"7px 8px", borderRadius:7, marginBottom:3,
                  border:`1px solid ${active?C.gold+"44":C.border}`,
                  background: active?"#1A1400":"#0D0D0D",
                  cursor:"grab",
                }}>
                <div style={{flex:1}}>
                  <p style={{fontSize:11, color:active?C.gold:C.text, margin:0}}>{t.name}</p>
                  <p style={{fontSize:9, color:C.muted, margin:0}}>{t.desc}</p>
                </div>
                <button
                  disabled={!clip}
                  onClick={()=>{
                    if(!clip) return;
                    if(transPos==="in") onUpdateClip(clip.id,{transition:active?undefined:t.name});
                    else onUpdateClip(clip.id,{transitionEnd:active?undefined:t.name});
                  }}
                  style={{
                    padding:"3px 8px", borderRadius:5, fontSize:10, cursor:clip?"pointer":"default",
                    background: active?`${C.red}22`:`${C.gold}22`,
                    border:`1px solid ${active?C.red+"44":C.gold+"44"}`,
                    color: active?C.red:C.gold, flexShrink:0,
                  }}>{active?"Remove":"Set"}</button>
              </div>
            );
          })}
          {/* Duration slider */}
          {clip && (transPos==="in" ? clip.transition : clip.transitionEnd) && (
            <div style={{marginTop:8, padding:"8px 10px", background:"#0D0D0D", borderRadius:7, border:`1px solid ${C.gold}33`}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                <p style={{fontSize:9, color:C.muted, margin:0}}>{transPos==="in"?"IN":"OUT"} DURATION</p>
                <span style={{fontSize:9, color:C.gold}}>
                  {(transPos==="in" ? (clip.transitionDuration??1) : (clip.transitionEndDuration??1)).toFixed(1)}s
                </span>
              </div>
              <input type="range" min={0.1} max={3} step={0.1}
                value={transPos==="in" ? (clip.transitionDuration??1) : (clip.transitionEndDuration??1)}
                onChange={e=>{
                  if(transPos==="in") onUpdateClip(clip.id,{transitionDuration:Number(e.target.value)});
                  else onUpdateClip(clip.id,{transitionEndDuration:Number(e.target.value)});
                }}
                style={{width:"100%", accentColor:C.gold}}/>
              <div style={{display:"flex", justifyContent:"space-between", marginTop:2}}>
                <span style={{fontSize:8, color:`${C.muted}66`}}>0.1s</span>
                <span style={{fontSize:8, color:`${C.muted}66`}}>3s</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Color ─────────────────────────────────────────────────────────────
const COLOR_SLIDER_DEFS: Record<string, Array<{key:string; min:number; max:number; def:number}>> = {
  "EXPOSURE": [
    {key:"Brightness",  min:-100, max:100, def:0},
    {key:"Contrast",    min:-100, max:100, def:0},
    {key:"Highlights",  min:-100, max:100, def:0},
    {key:"Shadows",     min:-100, max:100, def:0},
    {key:"Whites",      min:-100, max:100, def:0},
    {key:"Blacks",      min:-100, max:100, def:0},
  ],
  "COLOR": [
    {key:"Temperature", min:-100, max:100, def:0},
    {key:"Tint",        min:-100, max:100, def:0},
    {key:"Saturation",  min:-100, max:100, def:0},
    {key:"Vibrance",    min:-100, max:100, def:0},
    {key:"Hue Shift",   min:-180, max:180, def:0},
  ],
  "CURVES": [
    {key:"Lift",   min:-100, max:100, def:0},
    {key:"Gamma",  min:-100, max:100, def:0},
    {key:"Gain",   min:-100, max:100, def:0},
  ],
  "VIGNETTE": [
    {key:"Vignette Intensity", min:0, max:100, def:0},
    {key:"Vignette Feather",   min:0, max:100, def:50},
  ],
  "GRAIN": [
    {key:"Grain Amount", min:0, max:100, def:0},
    {key:"Grain Size",   min:1, max:10,  def:3},
  ],
};

function ColorTab({ clip, onUpdateClip, snapshot }: {
  clip:Clip|null;
  onUpdateClip:(id:string,updates:Partial<Clip>)=>void;
  snapshot:()=>void;
}) {
  const preset = clip?.colorGrade ?? "None";
  const [section,setSection]=useState<string|null>("EXPOSURE");
  const adj = clip?.colorAdjustments ?? {};

  const setAdj=(key:string, v:number)=>{
    if(!clip) return;
    onUpdateClip(clip.id,{colorAdjustments:{...adj,[key]:v}});
  };

  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      {!clip && (
        <div style={{padding:"6px 8px", background:`${C.gold}0A`, borderRadius:6, marginBottom:10}}>
          <p style={{fontSize:10, color:C.muted, margin:0}}>Select a clip to apply color grading</p>
        </div>
      )}
      {/* Preset dropdown */}
      <p style={{fontSize:10, color:C.muted, margin:"0 0 5px 0"}}>PRESET</p>
      <select
        disabled={!clip}
        value={preset}
        onChange={e=>{
          if(!clip) return;
          snapshot();
          onUpdateClip(clip.id,{colorGrade:e.target.value==="None"?undefined:e.target.value});
        }}
        style={{
          width:"100%", padding:"6px 8px", marginBottom:10,
          background:"#0D0D0D", border:`1px solid ${clip?.colorGrade?C.gold:C.border}`,
          borderRadius:6, color:clip?.colorGrade?C.gold:C.text,
          fontSize:11, outline:"none", cursor:"pointer", appearance:"auto",
        }}
      >
        {COLOR_PRESETS.map(p=>(
          <option key={p} value={p} style={{background:"#1A1A1A"}}>{p}</option>
        ))}
      </select>

      {/* Manual adjustments */}
      {Object.entries(COLOR_SLIDER_DEFS).map(([sec,controls])=>(
        <div key={sec} style={{marginBottom:8, borderBottom:`1px solid ${C.border}22`, paddingBottom:4}}>
          <button onClick={()=>setSection(section===sec?null:sec)} style={{
            width:"100%", display:"flex", justifyContent:"space-between",
            alignItems:"center", background:"transparent", border:"none",
            color:section===sec?C.gold:C.muted, fontSize:10, cursor:"pointer", padding:"4px 0",
          }}>
            <span style={{fontWeight:section===sec?600:400}}>{sec}</span>
            {section===sec ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
          </button>
          {section===sec && (
            <div style={{paddingLeft:4, paddingTop:4}}>
              {controls.map(({key:ctrl,min,max,def})=>{
                const val=adj[ctrl]??def;
                const changed=val!==def;
                return (
                  <div key={ctrl} style={{display:"flex", alignItems:"center", gap:6, marginBottom:7}}>
                    <span style={{fontSize:9, color:changed?C.gold:C.muted, width:76, flexShrink:0}}>{ctrl}</span>
                    <input type="range" min={min} max={max} value={val}
                      onMouseDown={()=>{ if(clip) snapshot(); }}
                      onChange={e=>setAdj(ctrl,Number(e.target.value))}
                      style={{flex:1, accentColor:C.gold}}/>
                    <span style={{fontSize:9, color:changed?C.gold:C.muted, width:30, textAlign:"right"}}>{val}</span>
                    {changed && (
                      <button onClick={()=>{ if(clip){snapshot();setAdj(ctrl,def);}}}
                        style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:0,fontSize:9}}>✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <button onClick={()=>{
        if(!clip) return;
        snapshot();
        onUpdateClip(clip.id,{colorGrade:undefined,colorAdjustments:{}});
      }} style={{
        width:"100%", padding:"6px", marginTop:4,
        borderRadius:6, border:`1px solid ${C.border}`,
        background:"transparent", color:C.muted, cursor:"pointer", fontSize:10,
      }}>Reset All</button>
    </div>
  );
}

// ── Tab: Audio ─────────────────────────────────────────────────────────────
const PLUGIN_PARAMS: Record<string, Array<{key:string; label:string; min:number; max:number; def:number}>> = {
  EQ: [
    {key:"low",  label:"Low (Hz)",    min:-12, max:12, def:0},
    {key:"low_mid", label:"Low Mid",  min:-12, max:12, def:0},
    {key:"mid",  label:"Mid",         min:-12, max:12, def:0},
    {key:"high_mid",label:"High Mid", min:-12, max:12, def:0},
    {key:"high", label:"High (kHz)",  min:-12, max:12, def:0},
  ],
  Comp: [
    {key:"threshold", label:"Threshold (dB)", min:-60, max:0,   def:-18},
    {key:"ratio",     label:"Ratio",           min:1,  max:20,  def:4},
    {key:"attack",    label:"Attack (ms)",     min:1,  max:200, def:10},
    {key:"release",   label:"Release (ms)",    min:10, max:1000,def:100},
    {key:"gain",      label:"Makeup Gain",     min:0,  max:24,  def:0},
  ],
  Reverb: [
    {key:"room",    label:"Room Size",  min:0, max:100, def:30},
    {key:"wet",     label:"Wet Mix",    min:0, max:100, def:20},
    {key:"damping", label:"Damping",    min:0, max:100, def:50},
    {key:"predelay",label:"Pre-Delay",  min:0, max:100, def:0},
  ],
  Noise: [
    {key:"sensitivity", label:"Sensitivity", min:0, max:100, def:50},
    {key:"strength",    label:"Reduction",   min:0, max:100, def:60},
    {key:"smoothing",   label:"Smoothing",   min:0, max:100, def:40},
  ],
};

const SFX_LIST = [
  {name:"Kick Hit",     icon:"🥁"},
  {name:"Hi-Hat",       icon:"🎵"},
  {name:"Snare Crack",  icon:"🎯"},
  {name:"Vinyl Crackle",icon:"📻"},
  {name:"Camera Click", icon:"📷"},
  {name:"Whoosh",       icon:"💨"},
  {name:"Riser",        icon:"📈"},
  {name:"Downer",       icon:"📉"},
  {name:"Glass Break",  icon:"💥"},
  {name:"Bass Drop",    icon:"🔊"},
  {name:"Door Slam",    icon:"🚪"},
  {name:"Crowd Cheer",  icon:"🙌"},
];

function AudioTab({ tracks, allClips, onUpdateClip, onToggleTrack, snapshot }: {
  tracks:Track[]; allClips:Clip[];
  onUpdateClip:(id:string,updates:Partial<Clip>)=>void;
  onToggleTrack:(id:string,prop:"muted"|"locked"|"visible")=>void;
  snapshot:()=>void;
}) {
  const audioTracks=tracks.filter(t=>t.type==="audio");
  const [openPlugins,setOpenPlugins]=useState<Record<string,string|null>>({});
  const [soloed,setSoloed]=useState<string|null>(null);
  const [sfxAdded,setSfxAdded]=useState<Set<string>>(new Set());

  const togglePlugin=(tid:string,plugin:string)=>setOpenPlugins(p=>({
    ...p,[tid]:p[tid]===plugin?null:plugin,
  }));

  const getTrackClip=(tid:string)=>allClips.find(c=>c.trackId===tid&&c.type==="audio");
  const getTrackVol=(tid:string)=>getTrackClip(tid)?.volume??100;
  const setTrackVol=(tid:string,vol:number)=>{
    allClips.filter(c=>c.trackId===tid&&c.type==="audio").forEach(c=>onUpdateClip(c.id,{volume:vol}));
  };

  const getPluginVal=(tid:string,plugin:string,key:string)=>{
    const c=getTrackClip(tid);
    return c?.audioPlugins?.[plugin]?.[key];
  };
  const setPluginVal=(tid:string,plugin:string,key:string,val:number)=>{
    const c=getTrackClip(tid); if(!c) return;
    const plugins={...c.audioPlugins,[plugin]:{...(c.audioPlugins?.[plugin]??{}),[key]:val}};
    onUpdateClip(c.id,{audioPlugins:plugins});
  };

  const handleSolo=(tid:string)=>{
    const wasSoloed=soloed===tid;
    const newSoloed=wasSoloed?null:tid;
    setSoloed(newSoloed);
    // mute all other audio tracks when soloing
    audioTracks.forEach(t=>{
      if(t.id!==tid && !wasSoloed) onToggleTrack(t.id,"muted");
      else if(wasSoloed && t.muted) onToggleTrack(t.id,"muted"); // unmute all
    });
  };

  const slider=(label:string,min:number,max:number,val:number,onChange:(v:number)=>void,onDown:()=>void)=>(
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
      <span style={{fontSize:9,color:C.muted,width:72,flexShrink:0}}>{label}</span>
      <input type="range" min={min} max={max} value={val}
        onMouseDown={onDown}
        onChange={e=>onChange(Number(e.target.value))}
        style={{flex:1,accentColor:C.gold}}/>
      <span style={{fontSize:9,color:C.gold,width:26,textAlign:"right"}}>{val}</span>
    </div>
  );

  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0"}}>MASTER MIXER</p>
      {audioTracks.length===0 ? (
        <p style={{fontSize:10, color:`${C.muted}66`, textAlign:"center", padding:"16px 0"}}>
          No audio tracks yet. Drop an audio clip or use Detach Audio.
        </p>
      ) : audioTracks.map(t=>{
        const vol=getTrackVol(t.id);
        const isSoloed=soloed===t.id;
        const openPlugin=openPlugins[t.id]??null;
        return (
          <div key={t.id} style={{
            background:"#0D0D0D", border:`1px solid ${t.muted&&!isSoloed?C.red+"33":isSoloed?`${C.gold}55`:C.border}`,
            borderRadius:8, padding:"8px 10px", marginBottom:8,
          }}>
            {/* Track header */}
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
              <span style={{fontSize:11, color:C.text, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis"}}>{t.name}</span>
              <button onClick={()=>{snapshot();onToggleTrack(t.id,"muted");}} style={{
                width:22, height:22, borderRadius:4, fontSize:9, fontWeight:700,
                background: t.muted?`${C.red}44`:"transparent",
                border:`1px solid ${t.muted?C.red:C.border}`,
                color: t.muted?C.red:C.muted, cursor:"pointer",
              }} title="Mute">M</button>
              <button onClick={()=>handleSolo(t.id)} style={{
                width:22, height:22, borderRadius:4, fontSize:9, fontWeight:700,
                background: isSoloed?`${C.gold}44`:"transparent",
                border:`1px solid ${isSoloed?C.gold:C.border}`,
                color: isSoloed?C.gold:C.muted, cursor:"pointer",
              }} title="Solo">S</button>
            </div>
            {/* Volume */}
            {slider("Volume",0,200,vol,v=>{snapshot();setTrackVol(t.id,v);},()=>snapshot())}
            {/* Plugins */}
            <div style={{display:"flex", gap:3, marginTop:6, flexWrap:"wrap"}}>
              {Object.keys(PLUGIN_PARAMS).map(plugin=>{
                const on=openPlugin===plugin;
                return (
                  <button key={plugin} onClick={()=>togglePlugin(t.id,plugin)} style={{
                    padding:"2px 8px", borderRadius:5, fontSize:9,
                    background: on?`${C.gold}22`:"transparent",
                    border:`1px solid ${on?C.gold+"55":C.border}`,
                    color: on?C.gold:C.muted, cursor:"pointer",
                  }}>{plugin}</button>
                );
              })}
            </div>
            {/* Plugin panel */}
            {openPlugin && PLUGIN_PARAMS[openPlugin] && (
              <div style={{marginTop:8, padding:"8px", background:"#111", borderRadius:6, border:`1px solid ${C.gold}22`}}>
                <p style={{fontSize:9, color:C.gold, margin:"0 0 8px 0", fontWeight:600}}>{openPlugin}</p>
                {PLUGIN_PARAMS[openPlugin].map(({key,label,min,max,def})=>{
                  const val=getPluginVal(t.id,openPlugin,key)??def;
                  return slider(label,min,max,val,v=>setPluginVal(t.id,openPlugin,key,v),()=>snapshot());
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* SFX section */}
      <div style={{background:"#0D0D0D",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",marginTop:4}}>
        <p style={{fontSize:10,color:C.muted,margin:"0 0 8px 0"}}>SFX LIBRARY</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {SFX_LIST.map(sfx=>{
            const added=sfxAdded.has(sfx.name);
            return (
              <button key={sfx.name} onClick={()=>setSfxAdded(p=>{const n=new Set(p);if(added)n.delete(sfx.name);else n.add(sfx.name);return n;})} style={{
                padding:"5px 6px", borderRadius:6, cursor:"pointer", textAlign:"left",
                background:added?`${C.teal}22`:"transparent",
                border:`1px solid ${added?`${C.teal}55`:C.border}`,
                color:added?C.teal:C.muted, fontSize:10,
              }}>{sfx.icon} {sfx.name}</button>
            );
          })}
        </div>
        {sfxAdded.size>0 && (
          <p style={{fontSize:9,color:C.teal,margin:"6px 0 0",textAlign:"center"}}>{sfxAdded.size} SFX queued</p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Text ──────────────────────────────────────────────────────────────
const TEXT_FONTS = ["Default","Inter","Georgia","Courier New","Impact","Trebuchet MS","Playfair Display","Oswald","Montserrat"];
const TEXT_ANIMATIONS = ["None","Fade In","Slide Up","Slide Down","Slide Left","Slide Right","Zoom In","Typewriter","Bounce","Flash"];

function TextTab({ onAddClip, selectedClip, onUpdateClip, snapshot }: {
  onAddClip:(name:string)=>void;
  selectedClip:Clip|null;
  onUpdateClip:(id:string,updates:Partial<Clip>)=>void;
  snapshot:()=>void;
}) {
  const [added,setAdded]=useState<string[]>([]);
  const items=[
    {label:"Text Overlay",    desc:"Full typographic control + animation"},
    {label:"Lower Third",     desc:"Broadcast-style name/title bars"},
    {label:"Title Card",      desc:"Full-frame cinematic title screens"},
    {label:"Lyric Captions",  desc:"Word-by-word karaoke sync"},
    {label:"Credits",         desc:"Scrolling or static end credits"},
    {label:"Watermark",       desc:"Logo with position & opacity control"},
    {label:"Countdown",       desc:"Animated countdown overlay"},
  ];
  const addItem=(name:string)=>{
    onAddClip(name);
    setAdded(p=>[...p,`${name}-${Date.now()}`]);
  };

  const textClip = selectedClip?.type==="text" ? selectedClip : null;
  const upd=(k:keyof Clip,v:unknown)=>{
    if(!textClip) return;
    snapshot();
    onUpdateClip(textClip.id,{[k]:v} as Partial<Clip>);
  };

  const labelStyle:React.CSSProperties={fontSize:10,color:C.muted,margin:"0 0 4px 0"};
  const inputStyle:React.CSSProperties={
    width:"100%",padding:"5px 8px",background:"#0D0D0D",
    border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:11,outline:"none",
    boxSizing:"border-box",
  };

  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      {/* Text editing panel when text clip is selected */}
      {textClip ? (
        <div>
          <p style={{fontSize:10,color:C.gold,margin:"0 0 10px 0",fontWeight:600}}>{textClip.name}</p>

          <p style={labelStyle}>CONTENT</p>
          <textarea
            value={textClip.textContent??""}
            onChange={e=>upd("textContent",e.target.value)}
            rows={3}
            placeholder="Enter text here…"
            style={{...inputStyle,resize:"vertical",lineHeight:1.5,fontFamily:"inherit",marginBottom:10}}
          />

          <p style={labelStyle}>FONT</p>
          <select value={textClip.textFont??"Default"}
            onChange={e=>upd("textFont",e.target.value)}
            style={{...inputStyle,marginBottom:10,appearance:"auto",cursor:"pointer"}}>
            {TEXT_FONTS.map(f=><option key={f} value={f} style={{background:"#1A1A1A"}}>{f}</option>)}
          </select>

          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}>
              <p style={labelStyle}>SIZE</p>
              <input type="number" min={8} max={200} value={textClip.textSize??48}
                onChange={e=>upd("textSize",Number(e.target.value))}
                style={inputStyle}/>
            </div>
            <div style={{flex:1}}>
              <p style={labelStyle}>COLOR</p>
              <input type="color" value={textClip.textColor??"#FFFFFF"}
                onChange={e=>upd("textColor",e.target.value)}
                style={{...inputStyle,padding:"2px 4px",height:32,cursor:"pointer"}}/>
            </div>
          </div>

          <p style={labelStyle}>ALIGNMENT</p>
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {(["left","center","right"] as const).map(a=>(
              <button key={a} onClick={()=>upd("textAlign",a)} style={{
                flex:1,padding:"5px",borderRadius:6,cursor:"pointer",fontSize:10,
                background:textClip.textAlign===a?`${C.gold}22`:"#0D0D0D",
                border:`1px solid ${textClip.textAlign===a?C.gold:C.border}`,
                color:textClip.textAlign===a?C.gold:C.muted,
              }}>{a[0].toUpperCase()+a.slice(1)}</button>
            ))}
          </div>

          <p style={labelStyle}>POSITION</p>
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {(["top","center","bottom"] as const).map(pos=>(
              <button key={pos} onClick={()=>upd("textPosition",pos)} style={{
                flex:1,padding:"5px",borderRadius:6,cursor:"pointer",fontSize:10,
                background:textClip.textPosition===pos?`${C.gold}22`:"#0D0D0D",
                border:`1px solid ${textClip.textPosition===pos?C.gold:C.border}`,
                color:textClip.textPosition===pos?C.gold:C.muted,
              }}>{pos[0].toUpperCase()+pos.slice(1)}</button>
            ))}
          </div>

          <p style={labelStyle}>ANIMATION</p>
          <select value={textClip.textAnimation??"None"}
            onChange={e=>upd("textAnimation",e.target.value)}
            style={{...inputStyle,marginBottom:10,appearance:"auto",cursor:"pointer"}}>
            {TEXT_ANIMATIONS.map(a=><option key={a} value={a} style={{background:"#1A1A1A"}}>{a}</option>)}
          </select>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <p style={labelStyle}>OPACITY</p>
            <span style={{fontSize:10,color:C.text}}>{textClip.opacity??100}%</span>
          </div>
          <input type="range" min={0} max={100} step={1}
            value={textClip.opacity??100}
            onChange={e=>upd("opacity",Number(e.target.value))}
            style={{width:"100%",accentColor:C.gold,marginBottom:10}}/>

          <div style={{padding:"6px 8px",background:"#0D1A0D",borderRadius:6,border:`1px solid ${C.teal}33`}}>
            <p style={{fontSize:9,color:C.teal,margin:0}}>Changes apply live to the preview</p>
          </div>
        </div>
      ) : (
        <>
          <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>ADD TEXT LAYER</p>
          <p style={{fontSize:9, color:C.muted, margin:"0 0 10px 0", opacity:0.7}}>Placed at the current playhead · click to select + edit</p>
          {items.map(item=>(
            <button key={item.label} draggable
              onDragStart={e=>{
                e.dataTransfer.setData("application/procut-asset",JSON.stringify({name:item.label,type:"text",src:"uploaded"}));
                e.dataTransfer.effectAllowed="copy";
              }}
              onClick={()=>addItem(item.label)} style={{
              width:"100%", marginBottom:6, padding:"8px 10px",
              background:"#0D0D0D", border:`1px solid ${C.border}`,
              borderRadius:8, cursor:"grab", textAlign:"left",
            }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${C.gold}55`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor=C.border)}
            >
              <p style={{fontSize:11, color:C.gold, margin:0, fontWeight:600}}>+ {item.label}</p>
              <p style={{fontSize:9, color:C.muted, margin:0}}>{item.desc}</p>
            </button>
          ))}
          {added.length>0 && (
            <div style={{marginTop:10, padding:"6px 8px", background:"#0D1A0D", borderRadius:6, border:`1px solid ${C.teal}33`}}>
              <p style={{fontSize:9, color:C.teal, margin:0}}>{added.length} text layer{added.length!==1?"s":""} added · select to edit</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Story (ProCut AI) ─────────────────────────────────────────────────
function StoryTab({ narrative, setNarrative, storyText, setStoryText }: {
  narrative:boolean; setNarrative:(v:boolean)=>void;
  storyText:string; setStoryText:(v:string)=>void;
}) {
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("");
  const endRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const send=useCallback(async(text?:string)=>{
    const msg=(text||input).trim();
    if(!msg||loading) return;
    const contextPrefix=storyText ? `[Story Context]\n${storyText}\n\n[Editor Question]\n` : "";
    setMsgs(p=>[...p,{id:`u${Date.now()}`,role:"user",content:msg}]);
    setInput("");
    setLoading(true);
    try {
      const res=await fetch("/api/procut/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:contextPrefix+msg}),
      });
      const data=await res.json();
      setMsgs(p=>[...p,{id:`a${Date.now()}`,role:"assistant",content:data.content||"No response."}]);
    } catch {
      setMsgs(p=>[...p,{id:`e${Date.now()}`,role:"assistant",content:"ProCut is unavailable."}]);
    } finally { setLoading(false); }
  },[input,loading,storyText]);

  const ACTIONS=[
    {e:"🎬",l:"Analyze My Edit",    p:"Analyze my current edit against the story context. Give me a full editorial notes report: pacing score, arc coverage, missing beats, overlong sections, and top recommendations."},
    {e:"💡",l:"Suggest Cuts",       p:"For the current scene, suggest the optimal cut sequence. Consider clip content, pacing, emotional tone, and beat sync. Give me the order with reasoning per cut."},
    {e:"🔀",l:"Suggest Transition", p:"What is the single best transition to use between my current two clips? Name it and explain why in one sentence based on the emotional context."},
    {e:"⏱",l:"Suggest Pacing",     p:"Analyze my current edit pacing. Where should I tighten? Where should I breathe? Base your suggestions on the emotional arc."},
    {e:"🎨",l:"Suggest Color Arc",  p:"Recommend a color grading progression across the full edit that maps to the emotional arc from opening to resolution. Give me per-act color grade recommendations."},
    {e:"🎵",l:"Suggest Music Sync", p:"Analyze where my cuts should align to the music. Give me a timestamp-by-timestamp sync map with the action and reason for each suggested cut point."},
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>
      {/* Story context banner */}
      <div style={{padding:"8px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
        {narrative && !editing ? (
          <div style={{background:"#0F1A12", borderRadius:8, padding:"8px 10px"}}>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#4CAF50", flexShrink:0}}/>
              <span style={{fontSize:10, color:"#4CAF50", flex:1}}>Story context loaded</span>
              <button onClick={()=>{setDraft(storyText);setEditing(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:9,padding:0}}>Edit</button>
            </div>
            <p style={{fontSize:9, color:`${C.muted}`, margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.5}}>{storyText}</p>
          </div>
        ) : (
          <div>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:6}}>
              {narrative ? <BookOpen size={11} color={C.gold}/> : <AlertTriangle size={11} color="#E08533"/>}
              <span style={{fontSize:10, color:narrative?C.gold:"#E08533"}}>{editing?"Edit story context":"No story context — paste your script or treatment"}</span>
            </div>
            <textarea
              value={editing?draft:(storyText||"")}
              onChange={e=>editing?setDraft(e.target.value):setStoryText(e.target.value)}
              placeholder={"Paste your script, treatment, shot list, or story notes here.\n\nProCut will use this as editorial context for all AI suggestions."}
              rows={5}
              style={{
                width:"100%", background:"#0D0D0D",
                border:`1px solid ${C.border}`, borderRadius:6,
                color:C.text, fontSize:10, padding:"6px 8px",
                resize:"vertical", outline:"none", lineHeight:1.5,
                fontFamily:"inherit", boxSizing:"border-box",
              }}
            />
            <div style={{display:"flex", gap:5, marginTop:6}}>
              {editing && (
                <button onClick={()=>setEditing(false)} style={{
                  flex:1, padding:"5px", borderRadius:6, fontSize:10,
                  background:"transparent", border:`1px solid ${C.border}`,
                  color:C.muted, cursor:"pointer",
                }}>Cancel</button>
              )}
              <button onClick={()=>{
                const text=editing?draft:storyText;
                if(!text.trim()) return;
                if(editing){setStoryText(draft);setEditing(false);}
                setNarrative(true);
              }} style={{
                flex:2, padding:"5px", borderRadius:6, fontSize:10,
                background:`${C.gold}22`, border:`1px solid ${C.gold}44`,
                color:C.gold, cursor:"pointer",
              }}>{editing?"Save Context":"Set as Story Context"}</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{padding:"8px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
        <p style={{fontSize:9, color:C.muted, margin:"0 0 5px 0", letterSpacing:"0.05em"}}>SMART SUGGESTIONS</p>
        <div style={{display:"flex", flexDirection:"column", gap:3}}>
          {ACTIONS.map(a=>(
            <button key={a.l} onClick={()=>send(a.p)} disabled={loading} style={{
              padding:"5px 8px", background:"#141420",
              border:`1px solid ${C.border}`, borderRadius:7,
              color:C.text, fontSize:10, cursor:"pointer",
              display:"flex", alignItems:"center", gap:7, textAlign:"left",
              opacity: loading?0.5:1,
            }}>
              <span style={{fontSize:12}}>{a.e}</span> {a.l}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{flex:1, overflowY:"auto", padding:"8px 10px"}}>
        {msgs.length===0 && (
          <div style={{textAlign:"center", padding:"16px 0", color:C.muted, fontSize:10}}>
            ProCut is ready. Use a suggestion or ask anything.
          </div>
        )}
        {msgs.map(m=>(
          <div key={m.id} style={{
            marginBottom:8,
            display:"flex", flexDirection:"column",
            alignItems: m.role==="user"?"flex-end":"flex-start",
          }}>
            <div style={{
              maxWidth:"92%", padding:"6px 10px",
              borderRadius: m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",
              background: m.role==="user"?`${C.gold}1A`:"#141420",
              border:`1px solid ${m.role==="user"?C.gold+"33":C.border}`,
              color:C.text, fontSize:10, lineHeight:1.6, whiteSpace:"pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex", alignItems:"center", gap:8, padding:"4px 0"}}>
            <Spinner/><span style={{fontSize:10, color:C.muted}}>ProCut is analyzing...</span>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"8px 10px", borderTop:`1px solid ${C.border}`, flexShrink:0}}>
        <div style={{
          display:"flex", gap:5, background:"#141420",
          border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 8px",
        }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask ProCut anything..." disabled={loading}
            style={{flex:1, background:"transparent", border:"none", outline:"none",
              color:C.text, fontSize:10}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()} style={{
            background:"none", border:"none",
            color:input.trim()?C.gold:C.muted, cursor:"pointer", padding:2,
          }}><Play size={12}/></button>
        </div>
      </div>
    </div>
  );
}

// ── ZONE 5: Timeline ───────────────────────────────────────────────────────
const LABEL_W=160, TRACK_H=58, AUDIO_H=46;

function Timeline({ tracks, clips, setClips, tool, playhead, setPlayhead, zoom, setZoom, selectedIds, setSelectedIds, primaryId, setPrimaryId, duration, snapshot, onToggleTrack, onAddTrack, onUpdateClip, onVResizeStart, beatSync, setBeatSync, bpm, setBpm }: {
  tracks:Track[]; clips:Clip[]; setClips:React.Dispatch<React.SetStateAction<Clip[]>>;
  tool:Tool;
  playhead:number; setPlayhead:(t:number)=>void;
  beatSync:boolean; setBeatSync:(v:boolean)=>void;
  bpm:number; setBpm:(v:number)=>void;
  zoom:number; setZoom:(z:number)=>void;
  selectedIds:Set<string>; setSelectedIds:(s:Set<string>)=>void;
  primaryId:string|null; setPrimaryId:(id:string|null)=>void;
  duration:number;
  snapshot:()=>void;
  onToggleTrack:(id:string, prop:"muted"|"locked"|"visible")=>void;
  onAddTrack:()=>void;
  onUpdateClip:(id:string, updates:Partial<Clip>)=>void;
  onVResizeStart:(e:React.MouseEvent)=>void;
}) {
  const rulerRef=useRef<HTMLDivElement>(null);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [moveDrag,setMoveDrag]=useState<{clipIds:string[];startX:number;origStarts:Record<string,number>}|null>(null);
  const [panDrag,setPanDrag]=useState<{startX:number;scrollX:number}|null>(null);
  const [trimDrag,setTrimDrag]=useState<{clipId:string;edge:"left"|"right";startX:number;origStart:number;origDuration:number;origInPoint:number}|null>(null);
  const [playheadDrag,setPlayheadDrag]=useState(false);
  const [contextMenu,setContextMenu]=useState<{x:number;y:number;clipId:string}|null>(null);
  const totalPx=Math.max(duration*zoom+200, 600);

  // Beat interval in seconds
  const beatSec = 60/bpm;

  // Snap value to nearest beat if beatSync active
  const snapToBeat=(t:number)=>{
    if(!beatSync||bpm<=0) return t;
    return Math.round(t/beatSec)*beatSec;
  };

  // Select/slide tool — move one or many clips
  useEffect(()=>{
    if(!moveDrag) return;
    const move=(e:MouseEvent)=>{
      const delta=(e.clientX-moveDrag.startX)/zoom;
      setClips(p=>p.map(c=>{
        const orig=moveDrag.origStarts[c.id];
        if(orig===undefined) return c;
        const raw=Math.max(0,orig+delta);
        const snapped=snapToBeat(raw);
        return {...c,start:Math.round(snapped*10)/10};
      }));
    };
    const up=()=>setMoveDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[moveDrag,zoom,setClips,beatSync,bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hand tool — pan scroll
  useEffect(()=>{
    if(!panDrag) return;
    const move=(e:MouseEvent)=>{
      if(scrollRef.current) scrollRef.current.scrollLeft=panDrag.scrollX-(e.clientX-panDrag.startX);
    };
    const up=()=>setPanDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[panDrag]);

  // Trim handles — resize clip from left or right edge only
  useEffect(()=>{
    if(!trimDrag) return;
    const move=(e:MouseEvent)=>{
      const delta=(e.clientX-trimDrag.startX)/zoom;
      setClips(p=>p.map(c=>{
        if(c.id!==trimDrag.clipId) return c;
        if(trimDrag.edge==="left"){
          // Left trim: left edge moves, right edge stays fixed
          // Clamp so start doesn't go below 0 and duration stays >= 0.2s
          const rawDelta=Math.min(delta, trimDrag.origDuration-0.2); // can't trim more than clip length
          const newStart=Math.max(0, Math.round((trimDrag.origStart+rawDelta)*10)/10);
          const actualDelta=newStart-trimDrag.origStart; // actual shift after clamping
          const newDur=Math.max(0.2, Math.round((trimDrag.origDuration-actualDelta)*10)/10);
          const newInPoint=Math.max(0, Math.round((trimDrag.origInPoint+actualDelta)*10)/10);
          return {...c, start:newStart, duration:newDur, inPoint:newInPoint};
        } else {
          // Right trim: right edge moves, left edge + inPoint stay fixed
          const rawDelta=Math.max(delta, 0.2-trimDrag.origDuration); // can't trim below 0.2s
          const newDur=Math.max(0.2, Math.round((trimDrag.origDuration+rawDelta)*10)/10);
          return {...c, duration:newDur};
        }
      }));
    };
    const up=()=>setTrimDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[trimDrag,zoom,setClips]);

  // Playhead drag on ruler
  useEffect(()=>{
    if(!playheadDrag) return;
    const move=(e:MouseEvent)=>{
      if(!rulerRef.current) return;
      const r=rulerRef.current.getBoundingClientRect();
      const scrollX=scrollRef.current?.scrollLeft??0;
      setPlayhead(Math.max(0,Math.min(duration,(e.clientX-r.left+scrollX)/zoom)));
    };
    const up=()=>setPlayheadDrag(false);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[playheadDrag,zoom,duration,setPlayhead]);

  // Close context menu on any click outside
  useEffect(()=>{
    if(!contextMenu) return;
    const close=()=>setContextMenu(null);
    window.addEventListener("mousedown",close);
    return()=>window.removeEventListener("mousedown",close);
  },[contextMenu]);

  // Drop from assets panel
  const handleDrop=(e:React.DragEvent<HTMLDivElement>, track:Track)=>{
    e.preventDefault();
    setDragOver(null);
    const raw=e.dataTransfer.getData("application/procut-asset");
    if(!raw) return;
    let asset:{name:string;type:string;src:string;url?:string;mediaKey?:string};
    try{asset=JSON.parse(raw);}catch{return;}
    const rect=e.currentTarget.getBoundingClientRect();
    const secs=Math.max(0,Math.round(((e.clientX-rect.left)/zoom)*10)/10);
    const clipType:Clip["type"]=asset.type==="audio"?"audio":asset.type==="text"?"text":"video";
    const clipId=`c${Date.now()}`;
    snapshot();
    setSelectedIds(new Set([clipId]));
    setPrimaryId(clipId);
    setClips(p=>[...p,{
      id:clipId,trackId:track.id,name:asset.name,
      start:secs,duration:asset.type==="audio"?30:asset.type==="text"?5:10,
      type:clipType,src:asset.src as Clip["src"],url:asset.url,mediaKey:asset.mediaKey,
    }]);
    // Read actual media duration and update clip
    if(asset.url&&(asset.type==="video"||asset.type==="audio")){
      const el=document.createElement(asset.type==="audio"?"audio":"video");
      el.src=asset.url;
      el.addEventListener("loadedmetadata",()=>{
        const dur=isFinite(el.duration)&&el.duration>0?Math.ceil(el.duration):10;
        setClips(p=>p.map(c=>c.id===clipId?{...c,duration:dur}:c));
      },{once:true});
      el.load();
    }
  };

  // Clip interaction based on active tool
  const handleClipInteract=(e:React.MouseEvent,clip:Clip)=>{
    if(tool==="select"){
      e.preventDefault();e.stopPropagation();
      if(e.shiftKey){
        // Multi-select: toggle this clip
        const newIds=new Set(selectedIds);
        if(newIds.has(clip.id)) newIds.delete(clip.id);
        else newIds.add(clip.id);
        setSelectedIds(newIds);
        setPrimaryId(clip.id);
        // Drag all selected clips
        if(newIds.size>0){
          snapshot();
          setMoveDrag({
            clipIds:[...newIds],
            startX:e.clientX,
            origStarts:Object.fromEntries(clips.filter(c=>newIds.has(c.id)).map(c=>[c.id,c.start])),
          });
        }
      } else {
        // Single select
        setSelectedIds(new Set([clip.id]));
        setPrimaryId(clip.id);
        snapshot();
        setMoveDrag({clipIds:[clip.id],startX:e.clientX,origStarts:{[clip.id]:clip.start}});
      }
    } else if(tool==="razor"){
      e.preventDefault();e.stopPropagation();
      const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
      const relSecs=(e.clientX-rect.left)/zoom;
      const durA=relSecs; const durB=clip.duration-durA;
      if(durA>0.1&&durB>0.1){
        const splitAt=clip.start+relSecs;
        snapshot();
        setClips(p=>[
          ...p.filter(c=>c.id!==clip.id),
          {...clip,id:`${clip.id}_a`,duration:durA},
          {...clip,id:`${clip.id}_b`,start:splitAt,duration:durB,inPoint:(clip.inPoint??0)+durA},
        ]);
        setSelectedIds(new Set()); setPrimaryId(null);
      }
    } else if(tool==="trim"){
      // Only select the clip — trim drag is handled exclusively by the edge handles
      e.preventDefault();e.stopPropagation();
      setSelectedIds(new Set([clip.id])); setPrimaryId(clip.id);
    } else if(tool==="slide"){
      e.preventDefault();e.stopPropagation();
      setSelectedIds(new Set([clip.id])); setPrimaryId(clip.id);
      snapshot();
      setMoveDrag({clipIds:[clip.id],startX:e.clientX,origStarts:{[clip.id]:clip.start}});
    } else if(tool==="hand"||tool==="zoom"){
      // let event bubble to handleLaneMouseDown
    } else {
      e.stopPropagation();
      const isSel=selectedIds.has(clip.id)&&selectedIds.size===1;
      if(isSel){setSelectedIds(new Set());setPrimaryId(null);}
      else{setSelectedIds(new Set([clip.id]));setPrimaryId(clip.id);}
    }
  };

  // Lane background click for zoom/hand
  const handleLaneMouseDown=(e:React.MouseEvent)=>{
    if(tool==="hand"&&scrollRef.current){
      // Don't intercept ruler mousedown — ruler uses onClick for playhead positioning
      if(rulerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      setPanDrag({startX:e.clientX,scrollX:scrollRef.current.scrollLeft});
    } else if(tool==="zoom"){
      if(rulerRef.current?.contains(e.target as Node)) return;
      const newZ=e.shiftKey?Math.max(20,Math.floor(zoom*0.75)):Math.min(250,Math.floor(zoom*1.4));
      setZoom(newZ);
    }
  };

  const clickRuler=(e:React.MouseEvent)=>{
    if(!rulerRef.current) return;
    const r=rulerRef.current.getBoundingClientRect();
    const scrollX=scrollRef.current?.scrollLeft??0;
    setPlayhead(Math.max(0,Math.min(duration,(e.clientX-r.left+scrollX)/zoom)));
  };

  const laneCursor: React.CSSProperties["cursor"]=
    tool==="razor"?"crosshair":
    tool==="hand"?(panDrag?"grabbing":"grab"):
    tool==="zoom"?"zoom-in":
    "default";

  const clipCursor: React.CSSProperties["cursor"]=
    tool==="razor"?"crosshair":
    tool==="hand"?"grab":
    tool==="select"||tool==="slide"?(moveDrag?"grabbing":"grab"):
    tool==="trim"?"ew-resize":
    "pointer";

  const ticks=Array.from({length:Math.ceil(duration)+1},(_,i)=>i);

  return (
    <>
    <div style={{
      gridColumn:"1/-1", gridRow:"3",
      background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Vertical resize handle */}
      <div
        onMouseDown={onVResizeStart}
        style={{
          height:5, cursor:"row-resize", flexShrink:0,
          background:"transparent", borderTop:`1px solid ${C.border}`,
          transition:"border-color 0.15s",
        }}
        onMouseEnter={e=>(e.currentTarget.style.borderTopColor=C.gold)}
        onMouseLeave={e=>(e.currentTarget.style.borderTopColor=C.border)}
      />
      {/* Toolbar */}
      <div style={{
        height:30, background:C.panel, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", padding:"0 8px", gap:8, flexShrink:0,
      }}>
        <button onClick={onAddTrack} style={sBtnSty()}><Plus size={11}/> Track</button>
        <button style={sBtnSty()}><Layers size={11}/> Nest</button>
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <span style={{fontSize:10, color:C.muted}}>Zoom</span>
          <input type="range" min={20} max={250} value={zoom}
            onChange={e=>setZoom(Number(e.target.value))}
            style={{width:90, accentColor:C.gold}}/>
          <button onClick={()=>setZoom(80)} style={sBtnSty()}>Fit All</button>
        </div>
        <button
          onClick={()=>setBeatSync(!beatSync)}
          style={sBtnSty(beatSync)}
          title={beatSync?"Beat Sync ON — clips snap to beats":"Enable Beat Sync"}
        >
          <Music2 size={11}/> Beat Sync
        </button>
        {beatSync && (
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <input
              type="number"
              value={bpm}
              min={40} max={300}
              onChange={e=>setBpm(Math.max(40,Math.min(300,Number(e.target.value)||120)))}
              style={{
                width:48,height:20,fontSize:10,textAlign:"center",
                background:"#1A1A1A",border:`1px solid ${C.gold}44`,
                borderRadius:4,color:C.gold,padding:"0 4px",
              }}
              title="BPM"
            />
            <span style={{fontSize:9,color:C.muted}}>BPM</span>
          </div>
        )}
      </div>

      {/* Tool hint bar */}
      <div style={{
        height:22, background:`${C.gold}0A`, borderBottom:`1px solid ${C.gold}22`,
        display:"flex", alignItems:"center", padding:"0 12px", flexShrink:0,
      }}>
        <span style={{fontSize:10, color:C.gold, fontWeight:600, marginRight:6}}>▶</span>
        <span style={{fontSize:10, color:`${C.gold}CC`}}>{TOOL_HINTS[tool]}</span>
      </div>

      {/* Body */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        {/* Track labels */}
        <div style={{
          width:LABEL_W, flexShrink:0, background:C.panel,
          borderRight:`1px solid ${C.border}`, overflowY:"auto",
        }}>
          <div style={{height:26, borderBottom:`1px solid ${C.border}`}}/>
          {tracks.map(t=>{
            const h=t.type==="audio"?AUDIO_H:TRACK_H;
            return (
              <div key={t.id} style={{
                height:h, borderBottom:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", padding:"0 8px", gap:5,
              }}>
                <span style={{
                  fontSize:9, color:C.muted, width:14, height:14,
                  background:C.border, borderRadius:3,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:700, flexShrink:0,
                }}>{t.type[0].toUpperCase()}</span>
                <span style={{fontSize:10, color:C.text, flex:1, overflow:"hidden",
                  whiteSpace:"nowrap", textOverflow:"ellipsis"}}>{t.name}</span>
                <button onClick={()=>onToggleTrack(t.id,"visible")} style={{background:"none",border:"none",cursor:"pointer",color:t.visible?C.muted:`${C.red}88`,padding:1}}>
                  {t.visible?<Eye size={10}/>:<EyeOff size={10}/>}
                </button>
                <button onClick={()=>onToggleTrack(t.id,"locked")} style={{background:"none",border:"none",cursor:"pointer",color:t.locked?C.gold:C.muted,padding:1}}>
                  {t.locked?<Lock size={10}/>:<Unlock size={10}/>}
                </button>
                {t.type==="audio" && (
                  <button onClick={()=>onToggleTrack(t.id,"muted")} style={{
                    background:"none",border:"none",cursor:"pointer",padding:1,
                    color:t.muted?C.red:C.muted, fontSize:9, fontWeight:700,
                  }}>M</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Lane scroll area */}
        <div ref={scrollRef} onMouseDown={handleLaneMouseDown} style={{flex:1, overflowX:"auto", overflowY:"auto", position:"relative", cursor:laneCursor}}>
          <div style={{minWidth:totalPx, position:"relative"}}>
            {/* Ruler */}
            <div ref={rulerRef}
              onMouseDown={e=>{clickRuler(e);setPlayheadDrag(true);}}
              onContextMenu={e=>{e.preventDefault();clickRuler(e);}}
              style={{
                height:26, background:"#0C0C0C",
                borderBottom:`1px solid ${C.border}`,
                position:"sticky", top:0, zIndex:10,
                cursor:"col-resize",
              }}>
              {ticks.map(i=>(
                <div key={i} style={{
                  position:"absolute", left:i*zoom,
                  top:0, display:"flex", flexDirection:"column",
                }}>
                  <div style={{width:1, height:8, background:C.border}}/>
                  {i%2===0 && <span style={{fontSize:8, color:C.muted, marginLeft:2}}>{i}s</span>}
                </div>
              ))}
              {/* Beat markers on ruler */}
              {beatSync && bpm>0 && Array.from({length:Math.floor(duration/beatSec)+1},(_,i)=>i).map(i=>{
                const t=i*beatSec;
                const isBar=i%4===0;
                return (
                  <div key={`beat-${i}`} style={{
                    position:"absolute",left:t*zoom,top:0,
                    width:1, height:isBar?16:10,
                    background:isBar?`${C.gold}BB`:`${C.gold}44`,
                    pointerEvents:"none",
                  }}/>
                );
              })}
              {/* Playhead triangle + line on ruler */}
              <div style={{
                position:"absolute", left:playhead*zoom,
                top:0, bottom:0, width:2, background:C.gold,
                transform:"translateX(-50%)", zIndex:5, pointerEvents:"none",
              }}>
                <div style={{
                  position:"absolute", top:0, left:"50%",
                  transform:"translateX(-50%)",
                  width:0, height:0,
                  borderLeft:"5px solid transparent",
                  borderRight:"5px solid transparent",
                  borderTop:`8px solid ${C.gold}`,
                  pointerEvents:"auto", cursor:"col-resize",
                }}/>
              </div>
            </div>

            {/* Track lanes */}
            {tracks.map(t=>{
              const h=t.type==="audio"?AUDIO_H:TRACK_H;
              const tc=clips.filter(c=>c.trackId===t.id);
              return (
                <div key={t.id}
                  onDragOver={e=>{ e.preventDefault(); setDragOver(t.id); }}
                  onDragEnter={e=>{ e.preventDefault(); setDragOver(t.id); }}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={e=>handleDrop(e,t)}
                  onMouseDown={e=>{
                    if(tool==="select"&&e.target===e.currentTarget){setSelectedIds(new Set());setPrimaryId(null);}
                    if(tool==="text"&&e.target===e.currentTarget){
                      const scrollX=scrollRef.current?.scrollLeft??0;
                      const r=scrollRef.current?.getBoundingClientRect();
                      const startSecs=r?Math.max(0,(e.clientX-r.left+scrollX)/zoom):playhead;
                      setClips(p=>[...p,{id:`c${Date.now()}`,trackId:t.id,name:"Text Overlay",start:Math.round(startSecs*10)/10,duration:5,type:"text",src:"uploaded"}]);
                    }
                  }}
                  style={{
                    height:h, borderBottom:`1px solid ${C.border}`,
                    position:"relative",
                    background: dragOver===t.id ? `${C.gold}0A` : "transparent",
                    outline: dragOver===t.id ? `1px dashed ${C.gold}44` : "none",
                    outlineOffset: -1,
                    transition:"background 0.1s",
                  }}>
                  {/* Beat guide lines in lane */}
                  {beatSync && bpm>0 && Array.from({length:Math.floor(duration/beatSec)+1},(_,i)=>i).map(i=>{
                    const isBar=i%4===0;
                    return (
                      <div key={`blane-${i}`} style={{
                        position:"absolute",left:i*beatSec*zoom,top:0,bottom:0,
                        width:1,
                        background:isBar?`${C.gold}18`:`${C.gold}08`,
                        pointerEvents:"none",
                      }}/>
                    );
                  })}
                  {tc.map(clip=>{
                    const sel=selectedIds.has(clip.id);
                    const isPrimary=clip.id===primaryId;
                    return (
                      <div key={clip.id}
                        onMouseDown={e=>handleClipInteract(e,clip)}
                        onContextMenu={e=>{e.preventDefault();e.stopPropagation();setContextMenu({x:e.clientX,y:e.clientY,clipId:clip.id});setPrimaryId(clip.id);setSelectedIds(new Set([clip.id]));}}
                        onDragOver={e=>{e.preventDefault();e.stopPropagation();}}
                        onDrop={e=>{
                          e.stopPropagation();
                          const trans=e.dataTransfer.getData("application/procut-transition");
                          if(trans){
                            const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
                            const relX=(e.clientX-rect.left)/rect.width;
                            // Prefer explicit pos from panel; fallback: left 40% = in, right 40% = out
                            const pos=e.dataTransfer.getData("application/procut-transition-pos");
                            const isOut = pos==="out" || (pos===""&&relX>0.6);
                            snapshot();
                            if(isOut) onUpdateClip(clip.id,{transitionEnd:trans});
                            else onUpdateClip(clip.id,{transition:trans});
                          }
                        }}
                        style={{
                          position:"absolute",
                          left:clip.start*zoom+1, width:Math.max(4,clip.duration*zoom-3),
                          top:4, bottom:4, borderRadius:5,
                          background:clipBg(clip),
                          border:`1px solid ${isPrimary?C.gold:sel?`${C.gold}66`:C.border+"88"}`,
                          cursor:clipCursor, overflow:"hidden",
                          userSelect:"none",
                          boxShadow:sel?`0 0 0 1px ${C.gold}33`:undefined,
                        }}>
                        {isPrimary && <div style={{
                          position:"absolute", left:0, top:0, bottom:0,
                          width:3, background:C.gold,
                          borderRadius:"5px 0 0 5px",
                        }}/>}
                        {/* Waveform for audio */}
                        {clip.type==="audio" && (
                          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", padding:"0 2px"}}>
                            {Array.from({length:Math.floor(clip.duration*zoom/4)}).map((_,i)=>(
                              <div key={i} style={{
                                width:1.5, marginRight:1, borderRadius:1,
                                height:`${15+Math.abs(Math.sin(i*0.6)*60)}%`,
                                background:C.teal, opacity:0.6,
                              }}/>
                            ))}
                          </div>
                        )}
                        <span style={{
                          position:"absolute", top:3, left:5,
                          fontSize:8, color:C.text, opacity:0.85,
                          whiteSpace:"nowrap", pointerEvents:"none",
                        }}>{clip.name}</span>
                        {/* Applied FX badge */}
                        {(clip.effects?.length||clip.colorGrade)&&(
                          <span style={{
                            position:"absolute", bottom:3, left:5,
                            fontSize:7, color:C.gold, background:"#0A0A0A99",
                            padding:"1px 4px", borderRadius:3, pointerEvents:"none",
                          }}>
                            {[clip.colorGrade?"C":null, clip.effects?.length?`FX${clip.effects.length}`:null].filter(Boolean).join(" ")}
                          </span>
                        )}
                        {/* Muted indicator */}
                        {clip.muted&&(
                          <span style={{
                            position:"absolute", bottom:3, right:8,
                            fontSize:7, color:C.red, background:"#0A0A0A99",
                            padding:"1px 4px", borderRadius:3, pointerEvents:"none",
                          }}>M</span>
                        )}
                        {/* Transition marker at clip in-point (left) */}
                        {clip.transition&&(
                          <div style={{
                            position:"absolute", left:0, top:0, bottom:0, width:8,
                            background:`linear-gradient(to right, ${C.gold}88, transparent)`,
                            pointerEvents:"none",
                          }} title={`In Transition: ${clip.transition} (${(clip.transitionDuration??1).toFixed(1)}s)`}/>
                        )}
                        {/* Transition marker at clip out-point (right) */}
                        {clip.transitionEnd&&(
                          <div style={{
                            position:"absolute", right:0, top:0, bottom:0, width:8,
                            background:`linear-gradient(to left, ${C.gold}88, transparent)`,
                            pointerEvents:"none",
                          }} title={`Out Transition: ${clip.transitionEnd} (${(clip.transitionEndDuration??1).toFixed(1)}s)`}/>
                        )}
                        {/* Trim handles — always interactive; wider + gold in trim mode */}
                        <div
                          onMouseDown={e=>{e.preventDefault();e.stopPropagation();snapshot();setTrimDrag({clipId:clip.id,edge:"left",startX:e.clientX,origStart:clip.start,origDuration:clip.duration,origInPoint:clip.inPoint??0});}}
                          style={{
                            position:"absolute",left:0,top:0,bottom:0,
                            width:tool==="trim"?12:6,
                            cursor:"w-resize",
                            background:tool==="trim"?`${C.gold}55`:"transparent",
                            borderRadius:"4px 0 0 4px",
                            pointerEvents:"auto",
                            zIndex:10,
                          }}/>
                        <div
                          onMouseDown={e=>{e.preventDefault();e.stopPropagation();snapshot();setTrimDrag({clipId:clip.id,edge:"right",startX:e.clientX,origStart:clip.start,origDuration:clip.duration,origInPoint:clip.inPoint??0});}}
                          style={{
                            position:"absolute",right:0,top:0,bottom:0,
                            width:tool==="trim"?12:6,
                            cursor:"e-resize",
                            background:tool==="trim"?`${C.gold}55`:"transparent",
                            borderRadius:"0 4px 4px 0",
                            pointerEvents:"auto",
                            zIndex:10,
                          }}/>
                      </div>
                    );
                  })}
                  {/* Playhead through lane */}
                  <div style={{
                    position:"absolute", left:playhead*zoom, top:0, bottom:0,
                    width:1, background:`${C.gold}55`,
                    transform:"translateX(-50%)", pointerEvents:"none",
                  }}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    {contextMenu && (()=>{
      const ctxClip=clips.find(c=>c.id===contextMenu.clipId);
      if(!ctxClip) return null;
      const menuItem=(label:string,color:string,onClick:()=>void)=>(
        <button onMouseDown={e=>{e.stopPropagation();onClick();}} style={{
          display:"block",width:"100%",padding:"7px 14px",
          background:"transparent",border:"none",textAlign:"left",
          color,cursor:"pointer",fontSize:11,whiteSpace:"nowrap",
        }}
        onMouseEnter={e=>(e.currentTarget.style.background="#2A2A2A")}
        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
        >{label}</button>
      );
      return (
        <div onMouseDown={e=>e.stopPropagation()} style={{
          position:"fixed",left:contextMenu.x,top:contextMenu.y,
          zIndex:9999,background:"#1A1A1A",border:`1px solid ${C.border}`,
          borderRadius:8,overflow:"hidden",boxShadow:"0 8px 24px #00000099",
          minWidth:200,
        }}>
          <div style={{padding:"4px 0"}}>
            <div style={{padding:"5px 14px 4px",fontSize:9,color:C.muted,borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
              {ctxClip.name}
            </div>
            {menuItem(`Move to Playhead  (${fmtTC(playhead)})`,C.gold,()=>{snapshot();onUpdateClip(contextMenu.clipId,{start:Math.round(playhead*10)/10});setContextMenu(null);})}
            {menuItem("Split at Playhead",C.text,()=>{
              if(playhead>ctxClip.start&&playhead<ctxClip.start+ctxClip.duration){
                snapshot();
                const leftDur=Math.round((playhead-ctxClip.start)*10)/10;
                const rightDur=Math.round((ctxClip.duration-leftDur)*10)/10;
                setClips(p=>[...p.map(c=>c.id===ctxClip.id?{...c,duration:leftDur}:c),
                  {...ctxClip,id:`c${Date.now()}`,start:playhead,duration:rightDur,inPoint:(ctxClip.inPoint??0)+leftDur}]);
              }
              setContextMenu(null);
            })}
            <div style={{height:1,background:C.border,margin:"4px 0"}}/>
            {menuItem("Duplicate",C.text,()=>{snapshot();setClips(p=>[...p,{...ctxClip,id:`c${Date.now()}`,start:ctxClip.start+ctxClip.duration+0.5}]);setContextMenu(null);})}
            {menuItem("Delete Clip",C.red,()=>{snapshot();setClips(p=>p.filter(c=>c.id!==contextMenu.clipId));setContextMenu(null);})}
          </div>
        </div>
      );
    })()}
    </>
  );
}

// ── Export Panel ───────────────────────────────────────────────────────────
function ExportPanel({ onClose, duration, clips, tracks, playhead, projectName }: {
  onClose:()=>void; duration:number;
  clips:Clip[]; tracks:Track[]; playhead:number; projectName:string;
}) {
  const [platform,setPlatform]=useState("YouTube");
  const [phase,setPhase]=useState<"form"|"progress"|"done">("form");
  const [progress,setProgress]=useState(0);

  const captureFrame=useCallback(():string|null=>{
    const vid=document.querySelector("video") as HTMLVideoElement|null;
    if(!vid||!vid.videoWidth) return null;
    const canvas=document.createElement("canvas");
    canvas.width=vid.videoWidth; canvas.height=vid.videoHeight;
    canvas.getContext("2d")?.drawImage(vid,0,0);
    return canvas.toDataURL("image/png");
  },[]);

  const handleExportFrame=useCallback(()=>{
    const dataUrl=captureFrame();
    if(!dataUrl){ alert("No video frame at current playhead. Add a video clip and scrub to a frame first."); return; }
    const a=document.createElement("a");
    a.href=dataUrl; a.download=`${projectName}-frame-${Math.round(playhead)}s.png`; a.click();
  },[captureFrame,projectName,playhead]);

  const handleExportThumbnail=useCallback(()=>{
    const dataUrl=captureFrame();
    if(!dataUrl){ alert("No video frame available for thumbnail."); return; }
    const a=document.createElement("a");
    a.href=dataUrl; a.download=`${projectName}-thumbnail.png`; a.click();
  },[captureFrame,projectName]);

  const handleExportStems=useCallback(()=>{
    const audioClips=clips.filter(c=>c.type==="audio"&&c.url);
    if(!audioClips.length){ alert("No audio clips on the timeline to export as stems."); return; }
    audioClips.forEach((clip,i)=>{
      setTimeout(()=>{
        const a=document.createElement("a");
        a.href=clip.url!; a.download=`stem-${i+1}-${clip.name}.m4a`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      },i*400);
    });
  },[clips]);

  const handleExportGif=useCallback(()=>{
    setPhase("progress");
    let p=0;
    const iv=setInterval(()=>{
      p+=Math.random()*14+6;
      if(p>=100){ p=100; clearInterval(iv); setProgress(100); setTimeout(()=>setPhase("done"),600); }
      else setProgress(Math.floor(p));
    },200);
  },[]);

  const [copied,setCopied]=useState(false);
  const [resolution,setResolution]=useState("1080p");
  const [frameRate,setFrameRate]=useState("30");
  const [codec,setCodec]=useState("H.264");
  const [aspectRatio,setAspectRatio]=useState("16:9");

  const handleDownloadAll=useCallback(async()=>{
    const mediaClips=clips.filter(c=>c.url&&(c.type==="video"||c.type==="audio")&&!tracks.find(t=>t.id===c.trackId)?.muted&&!c.muted);
    if(!mediaClips.length){alert("No active media clips on the timeline to export.");return;}
    setPhase("progress"); setProgress(2);

    try{
      // Dynamically import FFmpeg (keeps initial bundle small)
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress",({progress})=>setProgress(Math.max(2,Math.min(95,Math.round(progress*100)))));

      // Load single-threaded core (no COOP/COEP headers required)
      setProgress(5);
      await ffmpeg.load({
        coreURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.js","text/javascript"),
        wasmURL: await toBlobURL("https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.wasm","application/wasm"),
      });
      setProgress(15);

      // Deduplicate URLs so each source file is written once
      const urlToFile = new Map<string,string>();
      let fileIdx=0;
      for(const c of mediaClips){
        if(!urlToFile.has(c.url!)){
          const ext=c.type==="audio"?"m4a":"mp4";
          const fname=`src${fileIdx++}.${ext}`;
          await ffmpeg.writeFile(fname, await fetchFile(c.url!));
          urlToFile.set(c.url!,fname);
        }
      }
      setProgress(40);

      // Separate video and audio clips
      const videoClips=mediaClips.filter(c=>c.type==="video");
      const audioClips=mediaClips.filter(c=>c.type==="audio");

      // Determine output resolution
      const [outW,outH]=resolution==="4K"?[3840,2160]:resolution==="720p"?[1280,720]:[1920,1080];
      const fps=parseInt(frameRate)||30;
      // Use actual content end time, not the full project duration
      const contentEnd=mediaClips.reduce((max,c)=>Math.max(max,c.start+c.duration),0);
      const totalDuration=Math.min(duration, contentEnd||duration);

      const filterParts:string[]=[];
      const inputArgs:string[]=[];

      // Each clip gets its own input index to avoid duplicate stream references
      // when multiple clips share the same source file. File bytes are written
      // once (deduped above) but each clip gets a separate -i entry.
      const clipInputIndex=new Map<string,number>();
      let inputCount=0;
      for(const c of mediaClips){
        const fname=urlToFile.get(c.url!)!;
        clipInputIndex.set(c.id, inputCount++);
        inputArgs.push("-i",fname);
      }

      // Build video filter chain
      let videoChain:string|null=null;
      const speedRate=(c:Clip)=>c.speed?c.speed/100:1;
      const srcDur=(c:Clip)=>c.duration*speedRate(c);

      if(videoClips.length===0){
        // Audio-only project: generate black video
        filterParts.push(`color=c=black:s=${outW}x${outH}:r=${fps}:d=${totalDuration}[vout]`);
        videoChain="[vout]";
      } else {
        // Build per-clip video filters
        filterParts.push(`color=c=black:s=${outW}x${outH}:r=${fps}:d=${totalDuration}[vbase]`);
        let prevLabel="[vbase]";
        videoClips.forEach((c,i)=>{
          const fi=clipInputIndex.get(c.id)!;
          const ip=c.inPoint??0;
          const sd=srcDur(c);
          const sp=speedRate(c);
          const vLabel=`[vtmp${i}]`;
          const delayLabel=`[vdl${i}]`;
          // Trim + speed + scale
          filterParts.push(
            `[${fi}:v]trim=start=${ip.toFixed(4)}:duration=${sd.toFixed(4)},setpts=(PTS-STARTPTS)/${sp.toFixed(4)},scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2${vLabel}`
          );
          // Delay to timeline position
          filterParts.push(
            `${vLabel}setpts=PTS+${c.start.toFixed(4)}/TB${delayLabel}`
          );
          const outLabel=`[vout${i}]`;
          filterParts.push(
            `${prevLabel}${delayLabel}overlay=enable='between(t,${c.start.toFixed(4)},${(c.start+c.duration).toFixed(4)})'${outLabel}`
          );
          prevLabel=outLabel;
        });
        videoChain=prevLabel;
      }

      // Build audio mix — only from explicit audio-type clips.
      // Video clips may not have an audio stream (AI-generated clips never do),
      // so attempting [fi:a] on them causes an FS error. Use "Detach Audio"
      // in the inspector to include a video clip's embedded audio in the mix.
      const audioLabels:string[]=[];
      audioClips.forEach((c,i)=>{
        const fi=clipInputIndex.get(c.id)!;
        const ip=c.inPoint??0;
        const sd=srcDur(c);
        const sp=speedRate(c);
        const vol=((c.volume??100)/100).toFixed(3);
        const delayMs=Math.round(c.start*1000);
        const label=`[amix${i}]`;
        filterParts.push(
          `[${fi}:a]atrim=start=${ip.toFixed(4)}:duration=${sd.toFixed(4)},asetpts=(PTS-STARTPTS)/${sp.toFixed(4)},volume=${vol},adelay=${delayMs}|${delayMs}${label}`
        );
        audioLabels.push(label);
      });

      let audioChain:string;
      if(audioLabels.length===0){
        filterParts.push(`aevalsrc=0:d=${totalDuration}[aout]`);
        audioChain="[aout]";
      } else if(audioLabels.length===1){
        audioChain=audioLabels[0];
      } else {
        filterParts.push(`${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:normalize=0[aout]`);
        audioChain="[aout]";
      }

      setProgress(50);

      const filterComplex=filterParts.join(";");
      const ext=codec.includes("ProRes")?"mov":codec==="AV1"?"webm":"mp4";
      const outFile=`output.${ext}`;
      const videoCodec=codec==="H.265"?"libx265":codec==="AV1"?"libaom-av1":"libx264";

      await ffmpeg.exec([
        ...inputArgs,
        "-filter_complex", filterComplex,
        "-map", videoChain!,
        "-map", audioChain,
        "-c:v", videoCodec,
        ...(videoCodec==="libx264"||videoCodec==="libx265"?["-preset","ultrafast"]:videoCodec==="libaom-av1"?["-cpu-used","8"]:[]),
        "-c:a", "aac",
        "-t", totalDuration.toFixed(3),
        "-y", outFile,
      ]);

      setProgress(95);
      const data=await ffmpeg.readFile(outFile) as Uint8Array;
      const blob=new Blob([data.buffer as ArrayBuffer],{type:`video/${ext}`});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`${projectName}-${resolution}.${ext}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setProgress(100);
      setTimeout(()=>setPhase("done"),600);
    }catch(err){
      console.error("Export failed:",err);
      setPhase("form");
      alert(`Export failed: ${err instanceof Error?err.message:String(err)}\n\nTip: Make sure all clips have media loaded.`);
    }
  },[clips,tracks,projectName,resolution,codec,frameRate,duration]);

  const handleCopyLink=useCallback(async()=>{
    const vidClip=clips.find(c=>c.type==="video"&&c.url);
    const url=vidClip?.url??window.location.href;
    try{
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(()=>setCopied(false),2500);
    }catch{ alert("Clipboard access denied. URL: "+url); }
  },[clips]);

  const startExport=()=>{ handleDownloadAll(); };

  const stages=["Analyzing","Compositing","Color Grading","Audio Mix","Encoding","Finalizing"];
  const stage=stages[Math.min(Math.floor(progress/17),5)];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      background:"rgba(0,0,0,0.85)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        width:540, background:C.panel,
        border:`1px solid ${C.border}`, borderRadius:16,
        overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
        }}>
          <span style={{fontSize:14, fontWeight:700, color:C.text}}>Export Project</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>
            <X size={16}/>
          </button>
        </div>

        <div style={{overflowY:"auto", flex:1, padding:"16px 18px"}}>
          {phase==="form" && <>
            {/* Summary */}
            <div style={{
              background:"#0D0D0D", border:`1px solid ${C.border}`,
              borderRadius:8, padding:"10px 12px", marginBottom:14,
            }}>
              {[
                ["Project", projectName],
                ["Duration", fmtTC(duration)],
                ["Est. File Size","~240 MB"],
              ].map(([l,v])=>(
                <div key={l} style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                  <span style={{fontSize:11, color:C.muted}}>{l}</span>
                  <span style={{fontSize:11, color:C.text}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Platform presets */}
            <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>PLATFORM</p>
            <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:14}}>
              {PLATFORMS.map(p=>(
                <button key={p} onClick={()=>setPlatform(p)} style={{
                  padding:"4px 10px", borderRadius:6, fontSize:10,
                  background: platform===p?`${C.gold}22`:"#0D0D0D",
                  border:`1px solid ${platform===p?C.gold:C.border}`,
                  color: platform===p?C.gold:C.muted, cursor:"pointer",
                }}>{p}</button>
              ))}
            </div>

            {/* Format settings */}
            {([
              {l:"Resolution",  opts:["1080p","4K","720p","480p","Match Source"], val:resolution,  set:setResolution},
              {l:"Frame Rate",  opts:["23.976","24","25","29.97","30","60"],       val:frameRate,   set:setFrameRate},
              {l:"Codec",       opts:["H.264","H.265","ProRes 422","ProRes 4444","AV1"], val:codec, set:setCodec},
              {l:"Aspect Ratio",opts:["16:9","9:16","1:1","4:3","2.39:1"],         val:aspectRatio, set:setAspectRatio},
            ] as {l:string;opts:string[];val:string;set:(v:string)=>void}[]).map(({l,opts,val,set})=>(
              <div key={l} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <span style={{fontSize:11, color:C.muted, width:90, flexShrink:0}}>{l}</span>
                <select value={val} onChange={e=>set(e.target.value)} style={{
                  flex:1, background:"#0D0D0D", border:`1px solid ${C.border}`,
                  borderRadius:6, color:C.text, padding:"4px 8px", fontSize:11,
                }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            {/* Compliance */}
            <button style={{
              width:"100%", padding:"7px", marginBottom:10,
              borderRadius:8, border:`1px solid ${C.border}`,
              background:"transparent", color:C.muted, cursor:"pointer", fontSize:11,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              <Check size={12}/> Check Broadcast Compliance
            </button>

            {/* Actions */}
            <button onClick={startExport} style={{
              width:"100%", padding:"10px",
              borderRadius:8, background:C.gold, color:"#0A0A0A",
              border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <Download size={14}/> Export Video
            </button>
            <div style={{display:"flex", gap:6, marginTop:8}}>
              {([
                ["Export Stems",     handleExportStems],
                ["Export Frame",     handleExportFrame],
                ["Export GIF",       handleExportGif],
                ["Export Thumbnail", handleExportThumbnail],
              ] as [string,(()=>void)][]).map(([label, handler])=>(
                <button key={label} onClick={handler} style={{
                  flex:1, padding:"5px 4px", borderRadius:6, fontSize:9,
                  background:"transparent", border:`1px solid ${C.border}`,
                  color:C.muted, cursor:"pointer",
                }}>{label}</button>
              ))}
            </div>
          </>}

          {phase==="progress" && (
            <div style={{textAlign:"center", padding:"20px 0"}}>
              <p style={{fontSize:13, color:C.text, marginBottom:20}}>Rendering...</p>
              <div style={{height:6, background:C.border, borderRadius:3, marginBottom:12, overflow:"hidden"}}>
                <div style={{
                  height:"100%", background:C.gold, borderRadius:3,
                  width:`${progress}%`, transition:"width 0.3s",
                }}/>
              </div>
              <p style={{fontSize:11, color:C.gold, margin:"0 0 6px 0"}}>{progress}%</p>
              <p style={{fontSize:10, color:C.muted}}>{stage}</p>
            </div>
          )}

          {phase==="done" && (
            <div style={{textAlign:"center", padding:"20px 0"}}>
              <div style={{
                width:48, height:48, borderRadius:"50%",
                background:`${C.gold}22`, border:`1px solid ${C.gold}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 14px",
              }}>
                <Check size={22} color={C.gold}/>
              </div>
              <p style={{fontSize:13, color:C.text, marginBottom:6}}>Export complete</p>
              <p style={{fontSize:10, color:C.muted, marginBottom:20}}>Your file is ready to download.</p>
              <button onClick={handleDownloadAll} style={{
                width:"100%", marginBottom:6, padding:"8px", borderRadius:8,
                background:C.gold, color:"#0A0A0A", border:`1px solid ${C.gold}`,
                cursor:"pointer", fontSize:12, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}><Download size={13}/> Download — {resolution} / {codec}</button>
              <button onClick={handleCopyLink} style={{
                width:"100%", marginBottom:6, padding:"8px", borderRadius:8,
                background:"transparent", color:copied?C.teal:C.muted,
                border:`1px solid ${copied?C.teal:C.border}`,
                cursor:"pointer", fontSize:11, transition:"color 0.2s, border-color 0.2s",
              }}>{copied?"✓ Copied to clipboard!":"Copy Link"}</button>
              <button onClick={()=>window.open("/history","_blank")} style={{
                width:"100%", marginBottom:6, padding:"8px", borderRadius:8,
                background:"transparent", color:C.muted,
                border:`1px solid ${C.border}`, cursor:"pointer", fontSize:11,
              }}>Open in Library</button>
              <button onClick={()=>{setPhase("form");setProgress(0);}} style={{
                background:"none", border:"none", color:C.muted,
                cursor:"pointer", fontSize:11, marginTop:4,
              }}>Export Another Format</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ProCutEditor ──────────────────────────────────────────────────────
export default function ProCutEditor() {
  const { setCollapsed } = useLayout();
  const [tool,setTool]=useState<Tool>("select");
  const [activeTab,setActiveTab]=useState<ITab>("assets");
  const [playhead,setPlayhead]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [zoom,setZoom]=useState(80);
  const [inspectorW,setInspectorW]=useState(320);
  const [timelineH,setTimelineH]=useState(280);
  const [previewMax,setPreviewMax]=useState(false);
  const [beatSync,setBeatSync]=useState(false);
  const [bpm,setBpm]=useState(120);
  const hResizeRef=useRef<{startX:number;startW:number}|null>(null);
  const vResizeRef=useRef<{startY:number;startH:number}|null>(null);

  useEffect(()=>{
    const move=(e:MouseEvent)=>{
      if(hResizeRef.current){
        const delta=hResizeRef.current.startX-e.clientX;
        setInspectorW(Math.max(200,Math.min(600,hResizeRef.current.startW+delta)));
      }
      if(vResizeRef.current){
        const delta=vResizeRef.current.startY-e.clientY;
        setTimelineH(Math.max(160,Math.min(520,vResizeRef.current.startH+delta)));
      }
    };
    const up=()=>{ hResizeRef.current=null; vResizeRef.current=null; };
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{ window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
  },[]);
  const [showExport,setShowExport]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
  const [primaryId,setPrimaryId]=useState<string|null>(null);
  const [clipboard,setClipboard]=useState<Clip[]>([]);
  const [projectName,setProjectName]=useState("Jeff Dixon — Music Video");
  const undoStack=useRef<Clip[][]>([]);
  const redoStack=useRef<Clip[][]>([]);
  const [narrative,setNarrative]=useState(false);
  const [storyText,setStoryText]=useState("");
  const [assets,setAssets]=useState<Asset[]>(()=>{
    if(typeof window==="undefined") return [];
    try{ return JSON.parse(localStorage.getItem("procut-assets")||"[]"); } catch{ return []; }
  });
  const importFileRef=useRef<HTMLInputElement>(null);
  const importProjectRef=useRef<HTMLInputElement>(null);
  const [tracks, setTracks]=useState<Track[]>(INIT_TRACKS);
  const [clips,setClips]=useState<Clip[]>([]);
  const duration=45;

  const saveProject=useCallback(()=>{
    // Strip ephemeral blob:// URLs — mediaKey is used to restore them on import
    const savedClips=clips.map(c=>({...c, url: c.url?.startsWith("blob:") ? undefined : c.url}));
    const data={projectName,tracks,clips:savedClips};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`${projectName.replace(/\s+/g,"-")}.procut.json`; a.click();
    URL.revokeObjectURL(url);
  },[projectName,tracks,clips]);

  const newProject=useCallback(()=>{
    if(!confirm("Start a new project? Unsaved changes will be lost.")) return;
    setClips([]); setTracks(INIT_TRACKS);
    setProjectName("Untitled Project");
    setSelectedIds(new Set()); setPrimaryId(null);
    setPlayhead(0); setPlaying(false);
    undoStack.current=[]; redoStack.current=[];
  },[]);

  const handleImportProject=useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const data=JSON.parse(ev.target?.result as string);
        if(data.tracks)   setTracks(data.tracks);
        if(data.projectName) setProjectName(data.projectName);
        setSelectedIds(new Set()); setPrimaryId(null);
        setPlayhead(0); setPlaying(false);
        undoStack.current=[]; redoStack.current=[];
        // Restore blob URLs from IndexedDB for clips that have a mediaKey
        if(data.clips){
          const restored:Clip[]=await Promise.all((data.clips as Clip[]).map(async(c)=>{
            if(c.mediaKey&&!c.url){
              const url=await restoreUrl(c.mediaKey).catch(()=>null);
              return url?{...c,url}:c;
            }
            return c;
          }));
          setClips(restored);
          // Warn about any clips whose media couldn't be restored
          const missing=restored.filter(c=>c.mediaKey&&!c.url&&(c.type==="video"||c.type==="audio"));
          if(missing.length){
            alert(`${missing.length} clip(s) could not restore their media (opened on a different device or browser). Please re-upload those files and drag them back to the timeline.`);
          }
        }
      }catch{ alert("Invalid project file. Please use a .procut.json file saved from ProCut."); }
    };
    reader.readAsText(file);
    e.target.value="";
  },[]);

  const toggleTrackProp=useCallback((id:string, prop:"muted"|"locked"|"visible")=>{
    setTracks(p=>p.map(t=>t.id===id?{...t,[prop]:!t[prop]}:t));
  },[]);

  const addTrack=useCallback(()=>{
    const vCount=tracks.filter(t=>t.type==="video").length;
    setTracks(p=>[...p,{id:`v${Date.now()}`,type:"video",name:`Video ${vCount+1}`,muted:false,locked:false,visible:true}]);
  },[tracks]);

  // Collapse sidebar when editor opens
  useEffect(()=>{ setCollapsed(true); },[setCollapsed]);

  // Persist non-blob assets to localStorage
  useEffect(()=>{
    const p=assets.filter(a=>!a.url?.startsWith("blob:"));
    localStorage.setItem("procut-assets",JSON.stringify(p));
  },[assets]);

  // Playback tick — rAF loop with 24fps state throttle.
  // RAF fires at 60fps (smooth canvas proxy), but setPlayhead is called at most 24fps
  // to prevent 60 React re-renders/sec on the large ProEditor component tree.
  useEffect(()=>{
    if(!playing) return;
    let rafId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const FRAME = 1 / 24;

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      accumulator += delta;

      if (accumulator >= FRAME) {
        const frames = Math.floor(accumulator / FRAME);
        accumulator -= frames * FRAME;
        const advance = frames * FRAME;

        setPlayhead(p => {
          const next = p + advance;
          if (next >= duration) {
            cancelAnimationFrame(rafId);
            setPlaying(false);
            return 0;
          }
          return next;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  },[playing,duration]);

  const selectedClip=clips.find(c=>c.id===primaryId)||null;

  // Undo / Redo
  const snapshot=useCallback(()=>{
    undoStack.current=[...undoStack.current.slice(-49),clips.map(c=>({...c}))];
    redoStack.current=[];
  },[clips]);

  const undo=useCallback(()=>{
    if(!undoStack.current.length) return;
    redoStack.current=[...redoStack.current,clips.map(c=>({...c}))];
    setClips(undoStack.current[undoStack.current.length-1]);
    undoStack.current=undoStack.current.slice(0,-1);
  },[clips]);

  const redo=useCallback(()=>{
    if(!redoStack.current.length) return;
    undoStack.current=[...undoStack.current,clips.map(c=>({...c}))];
    setClips(redoStack.current[redoStack.current.length-1]);
    redoStack.current=redoStack.current.slice(0,-1);
  },[clips]);

  // Update clip properties
  const updateClip=useCallback((id:string,updates:Partial<Clip>)=>{
    setClips(p=>p.map(c=>c.id===id?{...c,...updates}:c));
  },[]);

  // Add text clip at playhead
  const addTextClip=useCallback((name:string)=>{
    setClips(p=>[...p,{
      id:`c${Date.now()}`,trackId:"v1",name,
      start:playhead,duration:5,
      type:"text",src:"uploaded",
    }]);
  },[playhead]);

  // Detach audio from selected video clip → creates its own dedicated audio track
  const detachAudio=useCallback(()=>{
    if(!primaryId) return;
    const clip=clips.find(c=>c.id===primaryId);
    if(!clip||clip.type!=="video"||!clip.url) return;
    snapshot();
    const newTrackId=`a${Date.now()}`;
    const clipName=clip.name.replace(" (Audio)","");
    // Audio is routed through the Web Audio API (tapped from the video element),
    // so no second media element needs to load the same blob.
    setTracks(p=>[...p,{id:newTrackId,type:"audio",name:`${clipName} Audio`,muted:false,locked:false,visible:true}]);
    setClips(p=>[
      ...p.map(c=>c.id===clip.id?{...c,muted:true}:c),
      {id:`c${Date.now()+1}`,trackId:newTrackId,name:`${clipName} (Audio)`,
        start:clip.start,duration:clip.duration,type:"audio" as const,
        src:clip.src,url:clip.url,mediaKey:clip.mediaKey,volume:100,
        inPoint:clip.inPoint??0,
        speed:clip.speed,
      },
    ]);
  },[primaryId,clips,snapshot]);

  const cutClip=useCallback(()=>{
    if(!selectedIds.size) return;
    const tocut=clips.filter(c=>selectedIds.has(c.id));
    if(!tocut.length) return;
    snapshot();
    setClipboard(tocut);
    setClips(p=>p.filter(c=>!selectedIds.has(c.id)));
    setSelectedIds(new Set()); setPrimaryId(null);
  },[selectedIds,clips,snapshot]);

  const copyClip=useCallback(()=>{
    const tocc=clips.filter(c=>selectedIds.has(c.id));
    if(tocc.length) setClipboard(tocc);
  },[selectedIds,clips]);

  const pasteClip=useCallback(()=>{
    if(!clipboard.length) return;
    snapshot();
    const now=Date.now();
    const minStart=Math.min(...clipboard.map(c=>c.start));
    const newClips=clipboard.map((c,i)=>({...c,id:`c${now+i}`,start:playhead+(c.start-minStart)}));
    setClips(p=>[...p,...newClips]);
    setSelectedIds(new Set(newClips.map(c=>c.id)));
    setPrimaryId(newClips[newClips.length-1].id);
  },[clipboard,playhead,snapshot]);

  const deleteClip=useCallback(()=>{
    if(!selectedIds.size) return;
    snapshot();
    setClips(p=>p.filter(c=>!selectedIds.has(c.id)));
    setSelectedIds(new Set()); setPrimaryId(null);
  },[selectedIds,snapshot]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement) return;
      if(e.code==="Space"){ e.preventDefault(); setPlaying(p=>!p); }
      if(e.code==="KeyV"&&!e.metaKey&&!e.ctrlKey) setTool("select");
      if(e.code==="KeyB") setTool("razor");
      if(e.code==="KeyT") { setTool("text"); setActiveTab("text"); }
      if(e.code==="KeyG") { setTool("color"); setActiveTab("color"); }
      if(e.code==="KeyA") { setTool("audio"); setActiveTab("audio"); }
      if((e.metaKey||e.ctrlKey)&&e.code==="KeyX"){ e.preventDefault(); cutClip(); }
      if((e.metaKey||e.ctrlKey)&&e.code==="KeyC"){ e.preventDefault(); copyClip(); }
      if((e.metaKey||e.ctrlKey)&&e.code==="KeyV"){ e.preventDefault(); pasteClip(); }
      if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.code==="KeyZ"){ e.preventDefault(); undo(); }
      if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.code==="KeyZ"){ e.preventDefault(); redo(); }
      if(e.code==="Delete"||e.code==="Backspace"){ deleteClip(); }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[cutClip,copyClip,pasteClip,deleteClip,undo,redo]);

  const handleImportFiles=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=Array.from(e.target.files||[]);
    const newOnes:Asset[]=files.map(f=>{
      const type=detectFileType(f);
      const mediaKey=`media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return { name:f.name.replace(/\.[^.]+$/,""), dur:"—", type, src:"uploaded", url:URL.createObjectURL(f), mediaKey };
    });
    setAssets(p=>[...p,...newOnes]);
    setActiveTab("assets");
    e.target.value="";
    for(let i=0;i<files.length;i++){
      const key=newOnes[i].mediaKey;
      if(key) storeMedia(key, files[i]).catch(()=>{});
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <input ref={importFileRef} type="file" multiple
        accept="video/*,audio/*,image/*,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.aac,.flac,.m4a"
        style={{display:"none"}} onChange={handleImportFiles}/>
      <input ref={importProjectRef} type="file" accept=".json,.procut.json"
        style={{display:"none"}} onChange={handleImportProject}/>
      <div style={{
        display:"grid",
        gridTemplateColumns:`72px 1fr ${previewMax?0:inspectorW}px`,
        gridTemplateRows:`52px 1fr ${timelineH}px`,
        width:"100%", height:"100vh",
        background:C.bg, overflow:"hidden",
        fontFamily:"'Inter', system-ui, sans-serif",
      }}>
        <TopBar
          name={projectName} setName={setProjectName}
          onExport={()=>setShowExport(true)}
          onSettings={()=>setShowSettings(true)}
          onSave={saveProject} onNew={newProject} onImportProject={()=>importProjectRef.current?.click()}
          onCut={cutClip} onCopy={copyClip} onPaste={pasteClip} onDelete={deleteClip}
          onUndo={undo} onRedo={redo}
          hasSelection={selectedIds.size>0} canPaste={clipboard.length>0}
        />
        <ToolsPanel tool={tool} setTool={setTool} onTab={setActiveTab} onImport={()=>{ setActiveTab("assets"); importFileRef.current?.click(); }}/>
        {/* Preview + horizontal resize handle */}
        <div style={{gridColumn:"2", gridRow:"2", display:"flex", position:"relative", overflow:"hidden"}}>
          <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
            <PreviewWindow
              clips={clips}
              playhead={playhead} setPlayhead={setPlayhead}
              playing={playing} setPlaying={setPlaying}
              narrative={narrative} duration={duration}
              onToggleMax={()=>setPreviewMax(p=>!p)}
              isMaximized={previewMax}
            />
          </div>
          {/* Horizontal resize handle (drag left edge of inspector) */}
          {!previewMax && (
            <div
              onMouseDown={e=>{hResizeRef.current={startX:e.clientX,startW:inspectorW};}}
              style={{
                width:5, flexShrink:0, cursor:"col-resize",
                background:"transparent",
                borderLeft:`1px solid ${C.border}`,
                transition:"border-color 0.15s",
              }}
              onMouseEnter={e=>(e.currentTarget.style.borderLeftColor=C.gold)}
              onMouseLeave={e=>(e.currentTarget.style.borderLeftColor=C.border)}
            />
          )}
        </div>
        <InspectorPanel
          activeTab={activeTab} setActiveTab={setActiveTab}
          selectedClip={selectedClip}
          narrative={narrative} setNarrative={setNarrative}
          storyText={storyText} setStoryText={setStoryText}
          assets={assets} setAssets={setAssets}
          onUpdateClip={updateClip} onAddClip={addTextClip}
          onDetachAudio={detachAudio}
          tracks={tracks} allClips={clips} onToggleTrack={toggleTrackProp}
          playhead={playhead}
          snapshot={snapshot}
        />
        <Timeline
          tracks={tracks} clips={clips} setClips={setClips}
          tool={tool}
          playhead={playhead} setPlayhead={setPlayhead}
          zoom={zoom} setZoom={setZoom}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          primaryId={primaryId} setPrimaryId={setPrimaryId}
          duration={duration}
          snapshot={snapshot}
          onToggleTrack={toggleTrackProp}
          onAddTrack={addTrack}
          onUpdateClip={updateClip}
          onVResizeStart={e=>{vResizeRef.current={startY:e.clientY,startH:timelineH};}}
          beatSync={beatSync} setBeatSync={setBeatSync}
          bpm={bpm} setBpm={setBpm}
        />
      </div>

      {showExport && <ExportPanel onClose={()=>setShowExport(false)} duration={duration} clips={clips} tracks={tracks} playhead={playhead} projectName={projectName}/>}

      {showSettings && (
        <div style={{
          position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.8)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            width:400, background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:14, padding:20,
          }}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:16}}>
              <span style={{fontSize:14, fontWeight:700, color:C.text}}>Editor Settings</span>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>
                <X size={16}/>
              </button>
            </div>
            {[
              {l:"Auto-save interval", opts:["30s","1m","2m","5m","Off"]},
              {l:"Default FPS",        opts:["23.976","24","25","29.97","30"]},
              {l:"Default Resolution", opts:["1080p","4K","720p"]},
              {l:"Timeline height",    opts:["Compact","Normal","Tall"]},
            ].map(({l,opts})=>(
              <div key={l} style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
                <span style={{fontSize:11, color:C.muted, flex:1}}>{l}</span>
                <select style={{
                  background:"#0D0D0D", border:`1px solid ${C.border}`,
                  borderRadius:6, color:C.text, padding:"4px 8px", fontSize:11,
                }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
