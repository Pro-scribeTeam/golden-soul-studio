import {
  Video, Image, PersonStanding, Mic2, Palette,
  Smartphone, PenTool, Bot, Eye, FolderOpen, Clapperboard, BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  step: number;
  href: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
}

export const NAV_ITEMS: NavItem[] = [
  { step: 1,  href: "/image",   icon: Image,          label: "Image Generation", shortLabel: "Image"  },
  { step: 2,  href: "/video",   icon: Video,          label: "Video Generation", shortLabel: "Video"  },
  { step: 3,  href: "/motion",  icon: PersonStanding, label: "Motion Transfer",  shortLabel: "Motion" },
  { step: 4,  href: "/lipsync", icon: Mic2,           label: "Lip Sync",         shortLabel: "Sync"   },
  { step: 5,  href: "/color",   icon: Palette,        label: "Color Grading",    shortLabel: "Color"  },
  { step: 6,  href: "/ugc",     icon: Smartphone,     label: "UGC Templates",    shortLabel: "UGC"    },
  { step: 7,  href: "/design",  icon: PenTool,        label: "Design Assets",    shortLabel: "Design" },
  { step: 8,  href: "/agent",   icon: Bot,            label: "Agent Studio",     shortLabel: "Agent"  },
  { step: 9,  href: "/brand",   icon: Eye,            label: "Brand Preview",    shortLabel: "Brand"  },
  { step: 10, href: "/history", icon: FolderOpen,      label: "Output History",   shortLabel: "History" },
  { step: 11, href: "/editor", icon: Clapperboard,    label: "ProCut Editor",    shortLabel: "ProCut"  },
  { step: 12, href: "/story",  icon: BookOpen,         label: "Story Box",         shortLabel: "Story"   },
];
