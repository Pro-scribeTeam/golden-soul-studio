"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "./LayoutProvider";
import {
  Video,
  Image,
  PersonStanding,
  Mic2,
  Palette,
  Smartphone,
  PenTool,
  Bot,
  Eye,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/video", icon: Video, label: "Video Generation" },
  { href: "/image", icon: Image, label: "Image Generation" },
  { href: "/motion", icon: PersonStanding, label: "Motion Transfer" },
  { href: "/lipsync", icon: Mic2, label: "Lip Sync" },
  { href: "/color", icon: Palette, label: "Color Grading" },
  { href: "/ugc", icon: Smartphone, label: "UGC Templates" },
  { href: "/design", icon: PenTool, label: "Design Assets" },
  { href: "/agent", icon: Bot, label: "Agent Studio" },
  { href: "/brand", icon: Eye, label: "Brand Preview" },
  { href: "/history", icon: FolderOpen, label: "Output History" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useLayout();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        background: "linear-gradient(180deg, #0D0D15 0%, #0A0A0F 100%)",
        borderRight: "1px solid #C9A84C22",
      }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-[#C9A84C22] ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-[#C9A84C] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_#C9A84C44]">
          <Sparkles size={18} className="text-[#0A0A0F]" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-heading text-base font-bold text-[#C9A84C] leading-tight">
              Golden Soul
            </p>
            <p className="font-heading text-[11px] text-[#F5F0E866] leading-tight">
              Studio
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-[#C9A84C1A] text-[#C9A84C] border border-[#C9A84C33]"
                  : "text-[#F5F0E877] hover:text-[#F5F0E8] hover:bg-[#C9A84C0D] border border-transparent"
              }`}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${
                  active ? "text-[#C9A84C]" : "group-hover:text-[#C9A84C88]"
                }`}
              />
              {!collapsed && (
                <span className="text-sm font-body font-medium truncate">
                  {label}
                </span>
              )}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[#C9A84C22]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F0E855] hover:text-[#C9A84C] hover:bg-[#C9A84C0D] transition-all ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs font-body">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
