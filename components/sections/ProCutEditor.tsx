"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLayout } from "@/components/layout/LayoutProvider";
import {
  ChevronLeft, Undo2, Redo2, Settings, Share2, Download,
  Scissors, MousePointer2, MoveHorizontal, ArrowLeftRight,
  Plus, Music, Type, Palette, Sparkles, Shuffle, Move,
  ZoomIn, Hand, HelpCircle, Maximize2, Play, Pause,
  SkipBack, SkipForward, Square, Volume2, Eye, EyeOff,
  Lock, Unlock, X, Search, ChevronDown, ChevronRight,
  AlertTriangle, Check, Loader2, Film, Music2, Layers,
  Upload, Wand2, BarChart2, Mic, BookOpen, Star, Clock,
} from "lucide-react";

// ── Colors (spec 2.1) ──────────────────────────────────────────────────────
const C = {
  bg:      "#0A0A0A",
  panel:   "#111111",
  border:  "#2A2A2A",
  gold:    "#C9A84C",
  text:    "#F5F5F5",
  muted:   "#888888",
  red:     "#E05555",
  teal:    "#4CAF9A",
  dTeal:   "#112420",
  dBlue:   "#101830",
  dPurp:   "#1A1028",
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
type Tool = "select"|"razor"|"slip"|"slide"|"import"|"audio"|"text"
          |"color"|"effects"|"transitions"|"motion"|"zoom"|"hand";
type ITab = "assets"|"inspector"|"effects"|"color"|"audio"|"text"|"story";

interface Clip {
  id: string; trackId: string; name: string;
  start: number; duration: number;
  type: "video"|"audio"|"text";
  src: "generated"|"uploaded"|"drive";
  url?: string;
  inPoint?: number;  // source in-point seconds (for razor splits)
  speed?: number;    // percentage, 100 = normal
  opacity?: number;  // 0–100
  effects?: string[];
  colorGrade?: string;
  volume?: number;   // 0–200
  muted?: boolean;
  transition?: string; // transition at start of clip: crossfade|dip|flash|wipe|zoom
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
const COLOR_PRESETS = ["Golden Soul","Midnight Fedora","Ivory Gospel","Golden Hour","Teal + Orange","Film Noir","Cinematic Blue","Warm Vintage","VHS Retro","Music Video"];
const COLOR_GRADE_FILTERS: Record<string,string> = {
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
};

const TRANSITIONS = [
  {name:"Cut",       desc:"Instant hard cut (default)"},
  {name:"Crossfade", desc:"Smooth dissolve between clips"},
  {name:"Dip Black", desc:"Fade to/from black"},
  {name:"Flash",     desc:"White flash cut"},
  {name:"Wipe",      desc:"Horizontal wipe left to right"},
  {name:"Zoom In",   desc:"Punch-in zoom cut"},
];

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

// ── ZONE 1: Top Bar ────────────────────────────────────────────────────────
function TopBar({ name, setName, onExport, onSettings, onCut, onCopy, onPaste, onDelete, onUndo, onRedo, hasSelection, canPaste }: {
  name:string; setName:(v:string)=>void;
  onExport:()=>void; onSettings:()=>void;
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
  slip:        "SLIP — click + drag a clip to shift its source in-point",
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
      {id:"slip",        icon:MoveHorizontal,label:"Slip",         kbd:"Y"},
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
function PreviewWindow({ clips, playhead, setPlayhead, playing, setPlaying, narrative, duration }: {
  clips:Clip[];
  playhead:number; setPlayhead:(t:number)=>void;
  playing:boolean; setPlaying:(v:boolean)=>void;
  narrative:boolean; duration:number;
}) {
  const wRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedVideoUrl = useRef<string>("");
  const loadedAudioUrl = useRef<string>("");

  // Active clips at current playhead position
  const activeVideoClip = clips
    .filter(c => c.type==="video" && !!c.url && c.start<=playhead && c.start+c.duration>playhead)
    .at(-1) ?? null;
  const activeAudioClip = clips
    .filter(c => c.type==="audio" && !!c.url && c.start<=playhead && c.start+c.duration>playhead)
    .at(-1) ?? null;

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
      vid.pause();
      if(url) {
        vid.src = url;
        vid.addEventListener("loadedmetadata", ()=>{
          vid.currentTime = target;
          if(playing) vid.play().catch(()=>{});
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
      if(vid.paused){ vid.currentTime = target; vid.play().catch(()=>{}); }
      // else: video is already playing naturally — don't interfere
    } else {
      if(!vid.paused) vid.pause();
      vid.currentTime = target; // scrubbing while paused
    }
  },[playing, playhead, activeVideoClip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync audio-only clips
  useEffect(()=>{
    const aud = audioRef.current;
    if(!aud) return;
    const url = activeAudioClip?.url ?? "";
    const clipStart = activeAudioClip?.start ?? 0;
    const inPoint = activeAudioClip?.inPoint ?? 0;
    const target = Math.max(0, inPoint + (playhead - clipStart));

    if(loadedAudioUrl.current !== url) {
      loadedAudioUrl.current = url;
      aud.pause();
      if(url) {
        aud.src = url;
        aud.addEventListener("loadedmetadata", ()=>{
          aud.currentTime = target;
          if(playing) aud.play().catch(()=>{});
        }, {once:true});
        aud.load();
      } else {
        aud.removeAttribute("src");
        aud.load();
      }
      return;
    }
    if(!url) return;

    if(playing) {
      if(aud.paused){ aud.currentTime = target; aud.play().catch(()=>{}); }
    } else {
      if(!aud.paused) aud.pause();
      aud.currentTime = target;
    }
  },[playing, playhead, activeAudioClip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply clip speed to video playback rate
  useEffect(()=>{
    const vid=videoRef.current;
    if(!vid) return;
    vid.playbackRate = activeVideoClip?.speed ? activeVideoClip.speed/100 : 1;
  },[activeVideoClip?.speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply clip volume/mute to video element
  useEffect(()=>{
    const vid=videoRef.current;
    if(!vid) return;
    vid.volume = Math.min(1, (activeVideoClip?.volume ?? 100) / 100);
    vid.muted = activeVideoClip?.muted ?? false;
  },[activeVideoClip?.volume, activeVideoClip?.muted]); // eslint-disable-line react-hooks/exhaustive-deps

  const videoFilter = activeVideoClip?.colorGrade ? (COLOR_GRADE_FILTERS[activeVideoClip.colorGrade] ?? "") : "";
  const videoOpacity = (activeVideoClip?.opacity ?? 100) / 100;

  const handleWave=(e:React.MouseEvent)=>{
    if(!wRef.current) return;
    const r=wRef.current.getBoundingClientRect();
    setPlayhead(Math.max(0,Math.min(duration, ((e.clientX-r.left)/r.width)*duration)));
  };

  const hasVideo = !!activeVideoClip?.url;

  return (
    <div style={{gridColumn:"2", gridRow:"2", background:"#000", display:"flex", flexDirection:"column"}}>
      {/* Canvas */}
      <div style={{flex:1, background:"#050505", position:"relative", overflow:"hidden"}}>
        {/* Audio element for audio-only clips */}
        <audio ref={audioRef} preload="auto" style={{display:"none"}}/>
        {/* Video element — always mounted, shown when active video clip exists */}
        <video ref={videoRef} preload="auto" playsInline
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"contain", background:"#000",
            display: hasVideo ? "block" : "none",
            filter: videoFilter || undefined,
            opacity: videoOpacity,
            transition:"filter 0.3s, opacity 0.3s",
          }}
        />
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
              {activeAudioClip ? (
                <>
                  <Music2 size={36} color={C.gold}/>
                  <span style={{fontSize:11, color:C.muted}}>Audio: {activeAudioClip.name}</span>
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
        {/* Timecode */}
        <div style={{position:"absolute", top:10, right:10, fontSize:10, color:`${C.muted}77`, fontFamily:"monospace"}}>
          {fmtTC(playhead)}
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
          <TBtn icon={SkipBack}    onClick={()=>setPlayhead(0)} title="Go to Start"/>
          <TBtn icon={SkipBack}    onClick={()=>setPlayhead(Math.max(0,playhead-10))} title="Rewind 10s"/>
          <TBtn icon={ChevronLeft} onClick={()=>setPlayhead(Math.max(0,playhead-1/24))} title="Step Back"/>
          <TBtn icon={Square}      onClick={()=>{setPlaying(false);setPlayhead(0);}} title="Stop"/>
          <button onClick={()=>setPlaying(!playing)} style={{
            width:34, height:34, borderRadius:8, background:C.gold,
            border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          }}>
            {playing ? <Pause size={15} color="#0A0A0A"/> : <Play size={15} color="#0A0A0A"/>}
          </button>
          <TBtn icon={ChevronRight} onClick={()=>setPlayhead(Math.min(duration,playhead+1/24))} title="Step Forward"/>
          <TBtn icon={SkipForward}  onClick={()=>setPlayhead(Math.min(duration,playhead+10))} title="Fast Forward 10s"/>
          <TBtn icon={SkipForward}  onClick={()=>setPlayhead(duration)} title="Go to End"/>
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
function InspectorPanel({ activeTab, setActiveTab, selectedClip, narrative, setNarrative, storyText, setStoryText, assets, setAssets, onUpdateClip, onAddClip, onDetachAudio }: {
  activeTab:ITab; setActiveTab:(t:ITab)=>void;
  selectedClip:Clip|null; narrative:boolean; setNarrative:(v:boolean)=>void;
  storyText:string; setStoryText:(v:string)=>void;
  assets:Asset[]; setAssets:React.Dispatch<React.SetStateAction<Asset[]>>;
  onUpdateClip:(id:string, updates:Partial<Clip>)=>void;
  onAddClip:(name:string)=>void;
  onDetachAudio:()=>void;
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
        {activeTab==="inspector" && <InspectorTab clip={selectedClip} onUpdateClip={onUpdateClip} onDetachAudio={onDetachAudio}/>}
        {activeTab==="effects"   && <EffectsTab clip={selectedClip} onUpdateClip={onUpdateClip}/>}
        {activeTab==="color"     && <ColorTab clip={selectedClip} onUpdateClip={onUpdateClip}/>}
        {activeTab==="audio"     && <AudioTab/>}
        {activeTab==="text"      && <TextTab onAddClip={onAddClip}/>}
        {activeTab==="story"     && <StoryTab narrative={narrative} setNarrative={setNarrative} storyText={storyText} setStoryText={setStoryText}/>}
      </div>
    </div>
  );
}

// ── Tab: Assets ────────────────────────────────────────────────────────────
interface Asset { name:string; dur:string; type:"video"|"audio"|"image"; src:"uploaded"|"generated"|"drive"; url?:string; thumb?:string; }
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
      return {
        name: f.name.replace(/\.[^.]+$/,""),
        dur: type==="image"?`${(f.size/1024).toFixed(0)}KB`:"—",
        type, src:"uploaded",
        url: URL.createObjectURL(f),
      };
    });
    // Optimistically add assets first so UI responds immediately
    setAssets(p=>[...p,...newOnes]);
    e.target.value="";
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
                      e.dataTransfer.setData("application/procut-asset", JSON.stringify({name:a.name,type:a.type,src:a.src,url:a.url}));
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
function InspectorTab({ clip, onUpdateClip, onDetachAudio }: {
  clip:Clip|null;
  onUpdateClip:(id:string,updates:Partial<Clip>)=>void;
  onDetachAudio?:()=>void;
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
  const [q,setQ]=useState(""), [cat,setCat]=useState("All");
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
          {TRANSITIONS.map(t=>{
            const active=clip?.transition===t.name;
            return (
              <div key={t.name} style={{
                display:"flex", alignItems:"center",
                padding:"7px 8px", borderRadius:7, marginBottom:3,
                border:`1px solid ${active?C.gold+"44":C.border}`,
                background: active?"#1A1400":"#0D0D0D",
              }}>
                <div style={{flex:1}}>
                  <p style={{fontSize:11, color:active?C.gold:C.text, margin:0}}>{t.name}</p>
                  <p style={{fontSize:9, color:C.muted, margin:0}}>{t.desc}</p>
                </div>
                <button
                  disabled={!clip}
                  onClick={()=>{ if(!clip) return; onUpdateClip(clip.id,{transition:active?undefined:t.name}); }}
                  style={{
                    padding:"3px 8px", borderRadius:5, fontSize:10, cursor:clip?"pointer":"default",
                    background: active?`${C.red}22`:`${C.gold}22`,
                    border:`1px solid ${active?C.red+"44":C.gold+"44"}`,
                    color: active?C.red:C.gold,
                  }}>{active?"Remove":"Set"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Color ─────────────────────────────────────────────────────────────
function ColorTab({ clip, onUpdateClip }: { clip:Clip|null; onUpdateClip:(id:string,updates:Partial<Clip>)=>void }) {
  const preset = clip?.colorGrade ?? "Golden Soul";
  const [section,setSection]=useState<string|null>("EXPOSURE");
  const SLIDER_DEFS: Record<string, string[]> = {
    "EXPOSURE":["Brightness","Contrast","Highlights","Shadows","Whites","Blacks"],
    "COLOR":["Temperature","Tint","Saturation","Vibrance","Hue Shift"],
    "VIGNETTE":["Intensity","Feather"],
    "GRAIN":["Amount","Size"],
  };
  const [sliderVals,setSliderVals]=useState<Record<string,number>>({});
  const setVal=(key:string,v:number)=>setSliderVals(p=>({...p,[key]:v}));
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      {!clip && (
        <div style={{padding:"6px 8px", background:`${C.gold}0A`, borderRadius:6, marginBottom:10}}>
          <p style={{fontSize:10, color:C.muted, margin:0}}>Select a clip to apply color grading</p>
        </div>
      )}
      {/* Presets */}
      <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>PRESETS</p>
      <div style={{display:"flex", gap:4, overflowX:"auto", marginBottom:12, paddingBottom:4}}>
        {COLOR_PRESETS.map(p=>(
          <button key={p}
            disabled={!clip}
            onClick={()=>{ if(clip) onUpdateClip(clip.id,{colorGrade:p}); }}
            style={{
              flexShrink:0, padding:"4px 10px", borderRadius:6, fontSize:10,
              background: preset===p?`${C.gold}22`:"#0D0D0D",
              border:`1px solid ${preset===p?C.gold:C.border}`,
              color: preset===p?C.gold:C.muted,
              cursor:clip?"pointer":"default", whiteSpace:"nowrap",
            }}>{p}</button>
        ))}
      </div>
      {clip?.colorGrade && (
        <div style={{marginBottom:10, padding:"5px 8px", background:"#1A1400", borderRadius:6, border:`1px solid ${C.gold}33`}}>
          <p style={{fontSize:9, color:C.gold, margin:0}}>Applied: {clip.colorGrade}</p>
        </div>
      )}
      {/* Manual adjustments */}
      {Object.entries(SLIDER_DEFS).map(([sec,controls])=>(
        <div key={sec} style={{marginBottom:8}}>
          <button onClick={()=>setSection(section===sec?null:sec)} style={{
            width:"100%", display:"flex", justifyContent:"space-between",
            alignItems:"center", background:"transparent", border:"none",
            color:C.muted, fontSize:10, cursor:"pointer", padding:"4px 0",
          }}>
            <span>{sec}</span>
            {section===sec ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
          </button>
          {section===sec && (
            <div style={{paddingLeft:4}}>
              {controls.map(ctrl=>{
                const val=sliderVals[ctrl]??0;
                return (
                  <div key={ctrl} style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                    <span style={{fontSize:10, color:C.muted, width:80, flexShrink:0}}>{ctrl}</span>
                    <input type="range" min={-100} max={100} value={val}
                      onChange={e=>setVal(ctrl,Number(e.target.value))}
                      style={{flex:1, accentColor:C.gold}}/>
                    <span style={{fontSize:10, color:val!==0?C.gold:C.text, width:28, textAlign:"right"}}>{val}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <button onClick={()=>{}} style={{
        width:"100%", padding:"7px", marginTop:8,
        borderRadius:8, border:`1px solid ${C.gold}44`,
        background:`${C.gold}11`, color:C.gold, cursor:"pointer", fontSize:11,
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        <Film size={12}/> Suggest Color Arc
      </button>
    </div>
  );
}

// ── Tab: Audio ─────────────────────────────────────────────────────────────
function AudioTab() {
  const [mixer,setMixer]=useState([
    {name:"Music",    vol:85, muted:false, soloed:false},
    {name:"SFX",      vol:60, muted:false, soloed:false},
    {name:"Ambience", vol:30, muted:true,  soloed:false},
  ]);
  const [activePlugins,setActivePlugins]=useState<Record<string,string[]>>({});

  const toggleMute=(i:number)=>setMixer(p=>p.map((t,j)=>j===i?{...t,muted:!t.muted}:t));
  const toggleSolo=(i:number)=>setMixer(p=>p.map((t,j)=>j===i?{...t,soloed:!t.soloed}:t));
  const setVol=(i:number,v:number)=>setMixer(p=>p.map((t,j)=>j===i?{...t,vol:v}:t));
  const togglePlugin=(trackName:string,plugin:string)=>setActivePlugins(p=>{
    const cur=p[trackName]??[];
    return {...p,[trackName]:cur.includes(plugin)?cur.filter(x=>x!==plugin):[...cur,plugin]};
  });

  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0"}}>MASTER MIXER</p>
      {mixer.map((t,i)=>(
        <div key={t.name} style={{
          background:"#0D0D0D", border:`1px solid ${t.muted?C.red+"33":C.border}`,
          borderRadius:8, padding:"8px 10px", marginBottom:8,
          opacity: t.muted ? 0.6 : 1,
        }}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
            <span style={{fontSize:11, color:t.muted?C.muted:C.text, flex:1}}>{t.name}</span>
            <button onClick={()=>toggleMute(i)} style={{
              width:20, height:20, borderRadius:4, fontSize:9, fontWeight:700,
              background: t.muted?C.red+"44":"transparent",
              border:`1px solid ${t.muted?C.red:C.border}`,
              color: t.muted?C.red:C.muted, cursor:"pointer",
            }}>M</button>
            <button onClick={()=>toggleSolo(i)} style={{
              width:20, height:20, borderRadius:4, fontSize:9, fontWeight:700,
              background: t.soloed?`${C.gold}44`:"transparent",
              border:`1px solid ${t.soloed?C.gold:C.border}`,
              color: t.soloed?C.gold:C.muted, cursor:"pointer",
            }}>S</button>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <span style={{fontSize:9, color:C.muted, width:20}}>Vol</span>
            <input type="range" min={0} max={200} value={t.vol}
              onChange={e=>setVol(i,Number(e.target.value))}
              style={{flex:1, accentColor:C.gold}}/>
            <span style={{fontSize:9, color:t.vol!==100?C.gold:C.text, width:32}}>{t.vol}%</span>
          </div>
          <div style={{display:"flex", gap:4, marginTop:8, flexWrap:"wrap"}}>
            {["EQ","Comp","Reverb","Noise"].map(a=>{
              const on=(activePlugins[t.name]??[]).includes(a);
              return (
                <button key={a} onClick={()=>togglePlugin(t.name,a)} style={{
                  padding:"2px 7px", borderRadius:5, fontSize:9,
                  background: on?`${C.gold}22`:"transparent",
                  border:`1px solid ${on?C.gold+"55":C.border}`,
                  color: on?C.gold:C.muted, cursor:"pointer",
                }}>{a}</button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{
        background:"#0D0D0D", border:`1px solid ${C.border}`,
        borderRadius:8, padding:"8px 10px", marginTop:4,
      }}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>BEAT SYNC</p>
        <button onClick={()=>{}} style={{
          width:"100%", padding:"6px", borderRadius:6,
          background:`${C.gold}11`, border:`1px solid ${C.gold}44`,
          color:C.gold, cursor:"pointer", fontSize:11,
        }}>Analyze & Sync Cuts to Beat</button>
      </div>
    </div>
  );
}

// ── Tab: Text ──────────────────────────────────────────────────────────────
function TextTab({ onAddClip }: { onAddClip:(name:string)=>void }) {
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
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0"}}>ADD TEXT LAYER</p>
      <p style={{fontSize:9, color:C.muted, margin:"0 0 10px 0", opacity:0.7}}>Clips are placed at the current playhead position</p>
      {items.map(item=>(
        <button key={item.label} onClick={()=>addItem(item.label)} style={{
          width:"100%", marginBottom:6, padding:"8px 10px",
          background:"#0D0D0D", border:`1px solid ${C.border}`,
          borderRadius:8, cursor:"pointer", textAlign:"left",
          transition:"border-color 0.15s",
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
          <p style={{fontSize:9, color:C.teal, margin:0}}>{added.length} text layer{added.length!==1?"s":""} added to timeline</p>
        </div>
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

function Timeline({ tracks, clips, setClips, tool, playhead, setPlayhead, zoom, setZoom, selectedId, setSelectedId, duration, snapshot, onToggleTrack, onAddTrack }: {
  tracks:Track[]; clips:Clip[]; setClips:React.Dispatch<React.SetStateAction<Clip[]>>;
  tool:Tool;
  playhead:number; setPlayhead:(t:number)=>void;
  zoom:number; setZoom:(z:number)=>void;
  selectedId:string|null; setSelectedId:(id:string|null)=>void;
  duration:number;
  snapshot:()=>void;
  onToggleTrack:(id:string, prop:"muted"|"locked"|"visible")=>void;
  onAddTrack:()=>void;
}) {
  const rulerRef=useRef<HTMLDivElement>(null);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [moveDrag,setMoveDrag]=useState<{clipId:string;startX:number;origStart:number}|null>(null);
  const [slipDrag,setSlipDrag]=useState<{clipId:string;startX:number;origInPoint:number}|null>(null);
  const [panDrag,setPanDrag]=useState<{startX:number;scrollX:number}|null>(null);
  const [trimDrag,setTrimDrag]=useState<{clipId:string;edge:"left"|"right";startX:number;origStart:number;origDuration:number}|null>(null);
  const totalPx=Math.max(duration*zoom+200, 600);

  // Slip tool — drag shifts inPoint
  useEffect(()=>{
    if(!slipDrag) return;
    const move=(e:MouseEvent)=>{
      const delta=(e.clientX-slipDrag.startX)/zoom;
      setClips(p=>p.map(c=>c.id===slipDrag.clipId
        ?{...c,inPoint:Math.max(0,Math.round((slipDrag.origInPoint-delta)*10)/10)}:c));
    };
    const up=()=>setSlipDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[slipDrag,zoom,setClips]);

  // Select tool — move clip
  useEffect(()=>{
    if(!moveDrag) return;
    const move=(e:MouseEvent)=>{
      const delta=(e.clientX-moveDrag.startX)/zoom;
      setClips(p=>p.map(c=>c.id===moveDrag.clipId
        ?{...c,start:Math.max(0,Math.round((moveDrag.origStart+delta)*10)/10)}:c));
    };
    const up=()=>setMoveDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[moveDrag,zoom,setClips]);

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

  // Trim handles — resize clip from left or right edge
  useEffect(()=>{
    if(!trimDrag) return;
    const move=(e:MouseEvent)=>{
      const delta=(e.clientX-trimDrag.startX)/zoom;
      setClips(p=>p.map(c=>{
        if(c.id!==trimDrag.clipId) return c;
        if(trimDrag.edge==="left"){
          const newStart=Math.max(0, Math.round((trimDrag.origStart+delta)*10)/10);
          const newDur=Math.max(0.2, Math.round((trimDrag.origDuration-delta)*10)/10);
          return {...c, start:newStart, duration:newDur};
        } else {
          const newDur=Math.max(0.2, Math.round((trimDrag.origDuration+delta)*10)/10);
          return {...c, duration:newDur};
        }
      }));
    };
    const up=()=>setTrimDrag(null);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[trimDrag,zoom,setClips]);

  // Drop from assets panel
  const handleDrop=(e:React.DragEvent<HTMLDivElement>, track:Track)=>{
    e.preventDefault();
    setDragOver(null);
    const raw=e.dataTransfer.getData("application/procut-asset");
    if(!raw) return;
    let asset:{name:string;type:string;src:string;url?:string};
    try{asset=JSON.parse(raw);}catch{return;}
    const rect=e.currentTarget.getBoundingClientRect();
    const secs=Math.max(0,Math.round(((e.clientX-rect.left)/zoom)*10)/10);
    const clipType:Clip["type"]=asset.type==="audio"?"audio":"video";
    const clipId=`c${Date.now()}`;
    snapshot();
    setClips(p=>[...p,{
      id:clipId,trackId:track.id,name:asset.name,
      start:secs,duration:asset.type==="audio"?30:10,
      type:clipType,src:asset.src as Clip["src"],url:asset.url,
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
      setSelectedId(clip.id);
      snapshot();
      setMoveDrag({clipId:clip.id,startX:e.clientX,origStart:clip.start});
    } else if(tool==="razor"){
      e.preventDefault();e.stopPropagation();
      const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
      const relSecs=(e.clientX-rect.left)/zoom;
      const durA=relSecs;
      const durB=clip.duration-durA;
      if(durA>0.1&&durB>0.1){
        const splitAt=clip.start+relSecs;
        snapshot();
        setClips(p=>[
          ...p.filter(c=>c.id!==clip.id),
          {...clip,id:`${clip.id}_a`,duration:durA},
          {...clip,id:`${clip.id}_b`,start:splitAt,duration:durB,inPoint:(clip.inPoint??0)+durA},
        ]);
        setSelectedId(null);
      }
    } else if(tool==="slip"){
      // Slip: drag left/right to shift source in-point without moving the clip
      e.preventDefault(); e.stopPropagation();
      setSelectedId(clip.id);
      snapshot();
      setSlipDrag({clipId:clip.id,startX:e.clientX,origInPoint:clip.inPoint??0});
    } else if(tool==="slide"){
      // Slide: move clip and ripple neighbors
      e.preventDefault();e.stopPropagation();
      setSelectedId(clip.id);
      snapshot();
      setMoveDrag({clipId:clip.id,startX:e.clientX,origStart:clip.start});
    } else if(tool==="hand"||tool==="zoom") {
      // let event bubble to handleLaneMouseDown for pan / zoom
    } else {
      e.stopPropagation();
      setSelectedId(clip.id===selectedId?null:clip.id);
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
    tool==="slip"?"ew-resize":
    "pointer";

  const ticks=Array.from({length:Math.ceil(duration)+1},(_,i)=>i);

  return (
    <div style={{
      gridColumn:"1/-1", gridRow:"3",
      background:C.bg, borderTop:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
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
        <button style={sBtnSty()}><Music2 size={11}/> Beat Snap</button>
        <button style={sBtnSty()}>Snap</button>
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
            <div ref={rulerRef} onClick={clickRuler} style={{
              height:26, background:"#0C0C0C",
              borderBottom:`1px solid ${C.border}`,
              position:"sticky", top:0, zIndex:10,
              cursor:"crosshair",
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
                    if(tool==="select"&&e.target===e.currentTarget) setSelectedId(null);
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
                  {tc.map(clip=>{
                    const sel=clip.id===selectedId;
                    return (
                      <div key={clip.id} onMouseDown={e=>handleClipInteract(e,clip)}
                        style={{
                          position:"absolute",
                          left:clip.start*zoom+1, width:Math.max(4,clip.duration*zoom-3),
                          top:4, bottom:4, borderRadius:5,
                          background:clipBg(clip),
                          border:`1px solid ${sel?C.gold:C.border+"88"}`,
                          cursor:clipCursor, overflow:"hidden",
                          userSelect:"none",
                        }}>
                        {sel && <div style={{
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
                        {/* Transition marker at clip start */}
                        {clip.transition&&(
                          <div style={{
                            position:"absolute", left:0, top:0, bottom:0, width:6,
                            background:`linear-gradient(to right, ${C.gold}88, transparent)`,
                            pointerEvents:"none",
                          }} title={`Transition: ${clip.transition}`}/>
                        )}
                        {/* Trim handles */}
                        <div
                          onMouseDown={e=>{e.stopPropagation();snapshot();setTrimDrag({clipId:clip.id,edge:"left",startX:e.clientX,origStart:clip.start,origDuration:clip.duration});}}
                          style={{position:"absolute",left:0,top:0,bottom:0,width:5,cursor:"w-resize"}}/>
                        <div
                          onMouseDown={e=>{e.stopPropagation();snapshot();setTrimDrag({clipId:clip.id,edge:"right",startX:e.clientX,origStart:clip.start,origDuration:clip.duration});}}
                          style={{position:"absolute",right:0,top:0,bottom:0,width:5,cursor:"e-resize"}}/>
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
  );
}

// ── Export Panel ───────────────────────────────────────────────────────────
function ExportPanel({ onClose, duration }: { onClose:()=>void; duration:number }) {
  const [platform,setPlatform]=useState("YouTube");
  const [phase,setPhase]=useState<"form"|"progress"|"done">("form");
  const [progress,setProgress]=useState(0);

  const startExport=()=>{
    setPhase("progress");
    let p=0;
    const iv=setInterval(()=>{
      p+=Math.random()*8+3;
      if(p>=100){ p=100; clearInterval(iv); setProgress(100); setTimeout(()=>setPhase("done"),600); }
      else setProgress(Math.floor(p));
    },300);
  };

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
                ["Project","Untitled Project"],
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
            {[
              {l:"Resolution",  opts:["1080p","4K","720p","480p","Match Source"]},
              {l:"Frame Rate",  opts:["23.976","24","25","29.97","30","60"]},
              {l:"Codec",       opts:["H.264","H.265","ProRes 422","ProRes 4444","AV1"]},
              {l:"Aspect Ratio",opts:["16:9","9:16","1:1","4:3","2.39:1"]},
            ].map(({l,opts})=>(
              <div key={l} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <span style={{fontSize:11, color:C.muted, width:90, flexShrink:0}}>{l}</span>
                <select style={{
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
              {["Export Stems","Export Frame","Export GIF","Export Thumbnail"].map(a=>(
                <button key={a} style={{
                  flex:1, padding:"5px 4px", borderRadius:6, fontSize:9,
                  background:"transparent", border:`1px solid ${C.border}`,
                  color:C.muted, cursor:"pointer",
                }}>{a}</button>
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
              {["Download","Copy Link","Open in Library"].map(a=>(
                <button key={a} style={{
                  width:"100%", marginBottom:6, padding:"8px",
                  borderRadius:8,
                  background: a==="Download"?C.gold:"transparent",
                  color: a==="Download"?"#0A0A0A":C.muted,
                  border:`1px solid ${a==="Download"?C.gold:C.border}`,
                  cursor:"pointer", fontSize:11, fontWeight: a==="Download"?700:400,
                }}>{a}</button>
              ))}
              <button onClick={()=>setPhase("form")} style={{
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
  const [showExport,setShowExport]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [clipboard,setClipboard]=useState<Clip|null>(null);
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
  const [tracks, setTracks]=useState<Track[]>(INIT_TRACKS);
  const [clips,setClips]=useState<Clip[]>([]);
  const duration=45;

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

  // Playback tick
  useEffect(()=>{
    if(!playing) return;
    const iv=setInterval(()=>{
      setPlayhead(p=>{ if(p>=duration){ clearInterval(iv); setPlaying(false); return 0; } return p+1/24; });
    },1000/24);
    return ()=>clearInterval(iv);
  },[playing,duration]);

  const selectedClip=clips.find(c=>c.id===selectedId)||null;

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

  // Detach audio from selected video clip → creates audio clip on music track
  const detachAudio=useCallback(()=>{
    if(!selectedId) return;
    const clip=clips.find(c=>c.id===selectedId);
    if(!clip||clip.type!=="video"||!clip.url) return;
    snapshot();
    const audioTrack=tracks.find(t=>t.type==="audio")||tracks[0];
    setClips(p=>[
      ...p.map(c=>c.id===clip.id?{...c,muted:true}:c),
      {
        id:`c${Date.now()}`,
        trackId:audioTrack.id,
        name:`${clip.name} (Audio)`,
        start:clip.start,
        duration:clip.duration,
        type:"audio" as const,
        src:clip.src,
        url:clip.url,
        volume:100,
      },
    ]);
  },[selectedId,clips,snapshot,tracks]);

  const cutClip=useCallback(()=>{
    if(!selectedId) return;
    const clip=clips.find(c=>c.id===selectedId);
    if(!clip) return;
    snapshot();
    setClipboard(clip);
    setClips(p=>p.filter(c=>c.id!==selectedId));
    setSelectedId(null);
  },[selectedId,clips,snapshot]);

  const copyClip=useCallback(()=>{
    const clip=clips.find(c=>c.id===selectedId);
    if(clip) setClipboard(clip);
  },[selectedId,clips]);

  const pasteClip=useCallback(()=>{
    if(!clipboard) return;
    snapshot();
    setClips(p=>[...p,{...clipboard,id:`c${Date.now()}`,start:playhead}]);
  },[clipboard,playhead,snapshot]);

  const deleteClip=useCallback(()=>{
    if(!selectedId) return;
    snapshot();
    setClips(p=>p.filter(c=>c.id!==selectedId));
    setSelectedId(null);
  },[selectedId,snapshot]);

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
      return { name:f.name.replace(/\.[^.]+$/,""), dur:"—", type, src:"uploaded", url:URL.createObjectURL(f) };
    });
    setAssets(p=>[...p,...newOnes]);
    setActiveTab("assets");
    e.target.value="";
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <input ref={importFileRef} type="file" multiple
        accept="video/*,audio/*,image/*,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.aac,.flac,.m4a"
        style={{display:"none"}} onChange={handleImportFiles}/>
      <div style={{
        display:"grid",
        gridTemplateColumns:"72px 1fr 320px",
        gridTemplateRows:"52px 1fr 280px",
        width:"100%", height:"100vh",
        background:C.bg, overflow:"hidden",
        fontFamily:"'Inter', system-ui, sans-serif",
      }}>
        <TopBar
          name={projectName} setName={setProjectName}
          onExport={()=>setShowExport(true)}
          onSettings={()=>setShowSettings(true)}
          onCut={cutClip} onCopy={copyClip} onPaste={pasteClip} onDelete={deleteClip}
          onUndo={undo} onRedo={redo}
          hasSelection={!!selectedId} canPaste={!!clipboard}
        />
        <ToolsPanel tool={tool} setTool={setTool} onTab={setActiveTab} onImport={()=>{ setActiveTab("assets"); importFileRef.current?.click(); }}/>
        <PreviewWindow
          clips={clips}
          playhead={playhead} setPlayhead={setPlayhead}
          playing={playing} setPlaying={setPlaying}
          narrative={narrative} duration={duration}
        />
        <InspectorPanel
          activeTab={activeTab} setActiveTab={setActiveTab}
          selectedClip={selectedClip}
          narrative={narrative} setNarrative={setNarrative}
          storyText={storyText} setStoryText={setStoryText}
          assets={assets} setAssets={setAssets}
          onUpdateClip={updateClip} onAddClip={addTextClip}
          onDetachAudio={detachAudio}
        />
        <Timeline
          tracks={tracks} clips={clips} setClips={setClips}
          tool={tool}
          playhead={playhead} setPlayhead={setPlayhead}
          zoom={zoom} setZoom={setZoom}
          selectedId={selectedId} setSelectedId={setSelectedId}
          duration={duration}
          snapshot={snapshot}
          onToggleTrack={toggleTrackProp}
          onAddTrack={addTrack}
        />
      </div>

      {showExport && <ExportPanel onClose={()=>setShowExport(false)} duration={duration}/>}

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
