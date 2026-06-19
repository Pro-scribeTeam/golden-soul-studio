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
  return (
    <div style={{position:"relative"}}>
      <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
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
          position:"absolute", left:"calc(100% + 10px)", top:"50%",
          transform:"translateY(-50%)", zIndex:200,
          background:"#1A1A1A", border:`1px solid ${C.border}`,
          borderRadius:6, padding:"4px 8px", whiteSpace:"nowrap",
          fontSize:11, color:C.text,
          display:"flex", gap:6, alignItems:"center",
          pointerEvents:"none",
        }}>
          {label}
          {kbd && <span style={{color:C.muted, fontSize:10}}>{kbd}</span>}
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
function TopBar({ name, setName, onExport, onSettings }: {
  name:string; setName:(v:string)=>void;
  onExport:()=>void; onSettings:()=>void;
}) {
  const [editing,setEditing]=useState(false);
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
        {[{i:Undo2,l:"Undo"},{i:Redo2,l:"Redo"}].map(({i:I,l})=>(
          <button key={l} title={l} style={{
            display:"flex", alignItems:"center", padding:"4px 6px",
            borderRadius:5, background:"transparent",
            border:`1px solid transparent`, color:C.muted, cursor:"pointer",
          }}><I size={13}/></button>
        ))}
        <div style={{width:1,height:16,background:C.border,margin:"0 2px"}}/>
        {["Cut","Copy","Paste","Delete"].map(a=>(
          <button key={a} style={{
            padding:"3px 8px", borderRadius:5, background:"transparent",
            border:`1px solid transparent`, color:C.muted,
            cursor:"pointer", fontSize:11,
          }}>{a}</button>
        ))}
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

// ── ZONE 2: Tools Panel ────────────────────────────────────────────────────
function ToolsPanel({ tool, setTool, onTab }: {
  tool:Tool; setTool:(t:Tool)=>void; onTab:(t:ITab)=>void;
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
      {id:"transitions", icon:Shuffle,       label:"Transitions",  kbd:"⌘T"},
      {id:"motion",      icon:Move,          label:"Motion/Keys",  kbd:"K"},
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
              onClick={()=>{ setTool(t.id); if(t.tab) onTab(t.tab); }}
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
function PreviewWindow({ playhead, setPlayhead, playing, setPlaying, narrative, duration }: {
  playhead:number; setPlayhead:(t:number)=>void;
  playing:boolean; setPlaying:(v:boolean)=>void;
  narrative:boolean; duration:number;
}) {
  const wRef = useRef<HTMLDivElement>(null);
  const handleWave=(e:React.MouseEvent)=>{
    if(!wRef.current) return;
    const r=wRef.current.getBoundingClientRect();
    setPlayhead(Math.max(0,Math.min(duration, ((e.clientX-r.left)/r.width)*duration)));
  };
  return (
    <div style={{gridColumn:"2", gridRow:"2", background:"#000", display:"flex", flexDirection:"column"}}>
      {/* Canvas */}
      <div style={{flex:1, background:"#050505", position:"relative"}}>
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
            <Film size={36} color={C.border}/>
            <span style={{fontSize:11, color:C.muted}}>Preview Canvas</span>
            <span style={{fontSize:10, color:`${C.muted}66`}}>Import clips to begin</span>
          </div>
        </div>
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
function InspectorPanel({ activeTab, setActiveTab, selectedClip, narrative, setNarrative, storyText, setStoryText, assets, setAssets }: {
  activeTab:ITab; setActiveTab:(t:ITab)=>void;
  selectedClip:Clip|null; narrative:boolean; setNarrative:(v:boolean)=>void;
  storyText:string; setStoryText:(v:string)=>void;
  assets:Asset[]; setAssets:React.Dispatch<React.SetStateAction<Asset[]>>;
}) {
  const TABS: Array<{id:ITab; label:string}> = [
    {id:"assets",    label:"Assets"},
    {id:"inspector", label:"Inspector"},
    {id:"effects",   label:"Effects"},
    {id:"color",     label:"Color"},
    {id:"audio",     label:"Audio"},
    {id:"text",      label:"Text"},
    {id:"story",     label:"Story"},
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
        {activeTab==="inspector" && <InspectorTab clip={selectedClip}/>}
        {activeTab==="effects"   && <EffectsTab/>}
        {activeTab==="color"     && <ColorTab/>}
        {activeTab==="audio"     && <AudioTab/>}
        {activeTab==="text"      && <TextTab/>}
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

  const handleFiles=(e:React.ChangeEvent<HTMLInputElement>)=>{
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
    setAssets(p=>[...p,...newOnes]);
    e.target.value="";
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
function InspectorTab({ clip }: { clip:Clip|null }) {
  if (!clip) return (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
      <p style={{fontSize:11, color:C.muted, textAlign:"center"}}>
        Select a clip on the timeline to inspect its properties.
      </p>
    </div>
  );
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
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>SPEED</p>
        <input type="number" defaultValue={100}
          style={{width:"100%", background:"#0D0D0D", border:`1px solid ${C.border}`,
            borderRadius:6, color:C.text, padding:"4px 8px", fontSize:11}}/>
      </div>
      <div style={{marginTop:10}}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>OPACITY</p>
        <input type="range" min={0} max={100} defaultValue={100}
          style={{width:"100%", accentColor:C.gold}}/>
      </div>
      {["Stabilize","Upscale","Denoise","Interpolate"].map(a=>(
        <button key={a} style={{
          width:"100%", marginTop:6, padding:"6px",
          borderRadius:6, border:`1px solid ${C.border}`,
          background:"transparent", color:C.muted,
          cursor:"pointer", fontSize:11,
        }}>{a}</button>
      ))}
    </div>
  );
}

// ── Tab: Effects ───────────────────────────────────────────────────────────
function EffectsTab() {
  const [q,setQ]=useState(""), [cat,setCat]=useState("All");
  const cats=["All","Motion","Blur","Grain","Lens","Overlays","Particles","Glitch","Stylize","Distortion"];
  const filtered=EFFECTS.filter(e=>(cat==="All"||e.cat===cat)&&e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>
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
        {filtered.map(e=>(
          <div key={e.name} style={{
            display:"flex", alignItems:"center",
            padding:"7px 8px", borderRadius:7, marginBottom:3,
            border:`1px solid ${C.border}`, background:"#0D0D0D",
          }}>
            <div style={{flex:1}}>
              <p style={{fontSize:11, color:C.text, margin:0}}>{e.name}</p>
              <p style={{fontSize:9, color:C.muted, margin:0}}>{e.cat}</p>
            </div>
            <button style={{
              padding:"3px 8px", borderRadius:5, fontSize:10,
              background:`${C.gold}22`, border:`1px solid ${C.gold}44`,
              color:C.gold, cursor:"pointer",
            }}>Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Color ─────────────────────────────────────────────────────────────
function ColorTab() {
  const [preset,setPreset]=useState("Golden Soul");
  const [section,setSection]=useState<string|null>("EXPOSURE");
  const sliders: Record<string, string[]> = {
    "EXPOSURE":["Brightness","Contrast","Highlights","Shadows","Whites","Blacks"],
    "COLOR":["Temperature","Tint","Saturation","Vibrance","Hue Shift"],
    "VIGNETTE":["Intensity","Feather"],
    "GRAIN":["Amount","Size"],
  };
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      {/* Presets */}
      <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>PRESETS</p>
      <div style={{display:"flex", gap:4, overflowX:"auto", marginBottom:12, paddingBottom:4}}>
        {COLOR_PRESETS.map(p=>(
          <button key={p} onClick={()=>setPreset(p)} style={{
            flexShrink:0, padding:"4px 10px", borderRadius:6, fontSize:10,
            background: preset===p?`${C.gold}22`:"#0D0D0D",
            border:`1px solid ${preset===p?C.gold:C.border}`,
            color: preset===p?C.gold:C.muted, cursor:"pointer", whiteSpace:"nowrap",
          }}>{p}</button>
        ))}
      </div>
      {/* Manual sections */}
      {Object.entries(sliders).map(([sec,controls])=>(
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
              {controls.map(ctrl=>(
                <div key={ctrl} style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                  <span style={{fontSize:10, color:C.muted, width:80, flexShrink:0}}>{ctrl}</span>
                  <input type="range" min={-100} max={100} defaultValue={0}
                    style={{flex:1, accentColor:C.gold}}/>
                  <span style={{fontSize:10, color:C.text, width:24, textAlign:"right"}}>0</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button style={{
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
  const tracks=[
    {name:"Music",        vol:85, muted:false},
    {name:"SFX",          vol:60, muted:false},
    {name:"Ambience",     vol:30, muted:true},
  ];
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0"}}>MASTER MIXER</p>
      {tracks.map(t=>(
        <div key={t.name} style={{
          background:"#0D0D0D", border:`1px solid ${C.border}`,
          borderRadius:8, padding:"8px 10px", marginBottom:8,
        }}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
            <span style={{fontSize:11, color:C.text, flex:1}}>{t.name}</span>
            <button style={{
              width:20, height:20, borderRadius:4, fontSize:9, fontWeight:700,
              background: t.muted?C.red+"33":"transparent",
              border:`1px solid ${t.muted?C.red:C.border}`,
              color: t.muted?C.red:C.muted, cursor:"pointer",
            }}>M</button>
            <button style={{
              width:20, height:20, borderRadius:4, fontSize:9, fontWeight:700,
              background:"transparent", border:`1px solid ${C.border}`,
              color:C.muted, cursor:"pointer",
            }}>S</button>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <span style={{fontSize:9, color:C.muted, width:20}}>Vol</span>
            <input type="range" min={0} max={200} defaultValue={t.vol}
              style={{flex:1, accentColor:C.gold}}/>
            <span style={{fontSize:9, color:C.text, width:28}}>{t.vol}%</span>
          </div>
          <div style={{display:"flex", gap:4, marginTop:8, flexWrap:"wrap"}}>
            {["EQ","Comp","Reverb","Noise"].map(a=>(
              <button key={a} style={{
                padding:"2px 7px", borderRadius:5, fontSize:9,
                background:"transparent", border:`1px solid ${C.border}`,
                color:C.muted, cursor:"pointer",
              }}>{a}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{
        background:"#0D0D0D", border:`1px solid ${C.border}`,
        borderRadius:8, padding:"8px 10px", marginTop:4,
      }}>
        <p style={{fontSize:10, color:C.muted, margin:"0 0 6px 0"}}>BEAT SYNC</p>
        <button style={{
          width:"100%", padding:"6px", borderRadius:6,
          background:`${C.gold}11`, border:`1px solid ${C.gold}44`,
          color:C.gold, cursor:"pointer", fontSize:11,
        }}>Analyze & Sync Cuts to Beat</button>
      </div>
    </div>
  );
}

// ── Tab: Text ──────────────────────────────────────────────────────────────
function TextTab() {
  const items=[
    {label:"+ Text Overlay",    desc:"Full typographic control + animation"},
    {label:"+ Lower Third",     desc:"Broadcast-style name/title bars"},
    {label:"+ Title Card",      desc:"Full-frame cinematic title screens"},
    {label:"+ Lyric Captions",  desc:"Word-by-word karaoke sync"},
    {label:"+ Credits",         desc:"Scrolling or static end credits"},
    {label:"+ Watermark",       desc:"Logo with position & opacity control"},
    {label:"+ Countdown",       desc:"Animated countdown overlay"},
  ];
  return (
    <div style={{flex:1, overflowY:"auto", padding:"10px"}}>
      <p style={{fontSize:10, color:C.muted, margin:"0 0 8px 0"}}>ADD TEXT LAYER</p>
      {items.map(item=>(
        <button key={item.label} style={{
          width:"100%", marginBottom:6, padding:"8px 10px",
          background:"#0D0D0D", border:`1px solid ${C.border}`,
          borderRadius:8, cursor:"pointer", textAlign:"left",
          transition:"all 0.12s",
        }}>
          <p style={{fontSize:11, color:C.gold, margin:0, fontWeight:600}}>{item.label}</p>
          <p style={{fontSize:9, color:C.muted, margin:0}}>{item.desc}</p>
        </button>
      ))}
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

function Timeline({ tracks, clips, setClips, tool, playhead, setPlayhead, zoom, setZoom, selectedId, setSelectedId, duration }: {
  tracks:Track[]; clips:Clip[]; setClips:React.Dispatch<React.SetStateAction<Clip[]>>;
  tool:Tool;
  playhead:number; setPlayhead:(t:number)=>void;
  zoom:number; setZoom:(z:number)=>void;
  selectedId:string|null; setSelectedId:(id:string|null)=>void;
  duration:number;
}) {
  const rulerRef=useRef<HTMLDivElement>(null);
  const scrollRef=useRef<HTMLDivElement>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [moveDrag,setMoveDrag]=useState<{clipId:string;startX:number;origStart:number}|null>(null);
  const [panDrag,setPanDrag]=useState<{startX:number;scrollX:number}|null>(null);
  const totalPx=Math.max(duration*zoom+200, 600);

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
    setClips(p=>[...p,{
      id:`c${Date.now()}`,trackId:track.id,name:asset.name,
      start:secs,duration:asset.type==="audio"?30:10,
      type:clipType,src:asset.src as Clip["src"],
    }]);
  };

  // Clip interaction based on active tool
  const handleClipInteract=(e:React.MouseEvent,clip:Clip)=>{
    if(tool==="select"){
      e.preventDefault();e.stopPropagation();
      setSelectedId(clip.id);
      setMoveDrag({clipId:clip.id,startX:e.clientX,origStart:clip.start});
    } else if(tool==="razor"){
      e.preventDefault();e.stopPropagation();
      const rect=(e.currentTarget as HTMLElement).getBoundingClientRect();
      const relSecs=(e.clientX-rect.left)/zoom;
      const durA=relSecs;
      const durB=clip.duration-durA;
      if(durA>0.1&&durB>0.1){
        const splitAt=clip.start+relSecs;
        setClips(p=>[
          ...p.filter(c=>c.id!==clip.id),
          {...clip,id:`${clip.id}_a`,duration:durA},
          {...clip,id:`${clip.id}_b`,start:splitAt,duration:durB},
        ]);
        setSelectedId(null);
      }
    } else if(tool==="slip"){
      // Slip: shift in-point without moving clip on timeline — requires source duration
      // Visual only for now; selects the clip
      e.stopPropagation();
      setSelectedId(clip.id);
    } else if(tool==="slide"){
      // Slide: move clip and ripple neighbors
      e.preventDefault();e.stopPropagation();
      setSelectedId(clip.id);
      setMoveDrag({clipId:clip.id,startX:e.clientX,origStart:clip.start});
    } else {
      setSelectedId(clip.id===selectedId?null:clip.id);
    }
  };

  // Lane background click for zoom/hand
  const handleLaneMouseDown=(e:React.MouseEvent)=>{
    if(tool==="hand"&&scrollRef.current){
      e.preventDefault();
      setPanDrag({startX:e.clientX,scrollX:scrollRef.current.scrollLeft});
    } else if(tool==="zoom"){
      const newZ=e.shiftKey?Math.max(20,Math.floor(zoom*0.75)):Math.min(250,Math.floor(zoom*1.4));
      setZoom(newZ);
    }
  };

  const clickRuler=(e:React.MouseEvent)=>{
    if(!rulerRef.current) return;
    const r=rulerRef.current.getBoundingClientRect();
    setPlayhead(Math.max(0,Math.min(duration,(e.clientX-r.left)/zoom)));
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
        <button style={sBtnSty()}><Plus size={11}/> Track</button>
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
                <button onClick={()=>{}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:1}}>
                  {t.visible?<Eye size={10}/>:<EyeOff size={10}/>}
                </button>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:1}}>
                  {t.locked?<Lock size={10}/>:<Unlock size={10}/>}
                </button>
                {t.type==="audio" && (
                  <button style={{
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
                        {/* Trim handles */}
                        <div style={{position:"absolute",left:0,top:0,bottom:0,width:5,cursor:"w-resize"}}/>
                        <div style={{position:"absolute",right:0,top:0,bottom:0,width:5,cursor:"e-resize"}}/>
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
  const [projectName,setProjectName]=useState("Jeff Dixon — Music Video");
  const [narrative,setNarrative]=useState(false);
  const [storyText,setStoryText]=useState("");
  const [assets,setAssets]=useState<Asset[]>(()=>{
    if(typeof window==="undefined") return [];
    try{ return JSON.parse(localStorage.getItem("procut-assets")||"[]"); } catch{ return []; }
  });
  const [tracks]=useState<Track[]>(INIT_TRACKS);
  const [clips,setClips]=useState<Clip[]>([]);
  const duration=45;

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

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement) return;
      if(e.code==="Space"){ e.preventDefault(); setPlaying(p=>!p); }
      if(e.code==="KeyV") setTool("select");
      if(e.code==="KeyB") setTool("razor");
      if(e.code==="KeyT") { setTool("text"); setActiveTab("text"); }
      if(e.code==="KeyG") { setTool("color"); setActiveTab("color"); }
      if(e.code==="KeyA") { setTool("audio"); setActiveTab("audio"); }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  const selectedClip=clips.find(c=>c.id===selectedId)||null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        />
        <ToolsPanel tool={tool} setTool={setTool} onTab={setActiveTab}/>
        <PreviewWindow
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
        />
        <Timeline
          tracks={tracks} clips={clips} setClips={setClips}
          tool={tool}
          playhead={playhead} setPlayhead={setPlayhead}
          zoom={zoom} setZoom={setZoom}
          selectedId={selectedId} setSelectedId={setSelectedId}
          duration={duration}
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
