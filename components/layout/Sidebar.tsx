"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "./LayoutProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";

// Tiny gold-dust sparkle that floats upward
function GoldDust({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        fontSize: 6,
        color: "#F0D060",
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    >
      ✦
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useLayout();

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-50 transition-all duration-300 overflow-hidden ${
          collapsed ? "w-0" : "w-64"
        }`}
        style={{
          background: "linear-gradient(180deg, #0D0D15 0%, #0A0A0F 100%)",
          borderRight: collapsed ? "none" : "1px solid #D4A82022",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#D4A82022]" style={{ position: "relative", overflow: "visible" }}>
          {/* Gold dust sparkles around logo */}
          <GoldDust style={{ top: 6, left: 34, animation: "gold-dust-1 2.6s ease-out infinite" }} />
          <GoldDust style={{ top: 14, left: 10, animation: "gold-dust-2 3.2s ease-out infinite 1s" }} />
          <GoldDust style={{ bottom: 4, left: 48, animation: "gold-dust-3 2.8s ease-out infinite 0.5s" }} />

          {/* Logo image */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{
              width: 40, height: 40,
              boxShadow: "0 0 18px #D4A82066, 0 0 4px #F0D06044",
            }}
          >
            <Image src="/logo.jpg" alt="Golden Soul Studio" width={40} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </div>

          <div>
            <p className="font-heading text-base font-bold leading-tight whitespace-nowrap gold-shimmer">Golden Soul</p>
            <p className="font-heading text-[11px] text-[#F5F0E866] leading-tight whitespace-nowrap">Studio</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map(({ step, href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 group ${
                  active
                    ? "bg-[#D4A8201A] text-[#D4A820] border border-[#D4A82033]"
                    : "text-[#F5F0E877] hover:text-[#F5F0E8] hover:bg-[#D4A8200D] border border-transparent"
                }`}
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[8px] font-body uppercase tracking-widest text-[#D4A82055] leading-none mb-0.5 whitespace-nowrap">
                    Step {step}
                  </span>
                  <Icon size={15} className={`${active ? "text-[#D4A820]" : "text-[#F5F0E855] group-hover:text-[#D4A82088]"}`} />
                </div>
                <span className="text-[13px] font-body font-medium truncate flex-1 whitespace-nowrap">{label}</span>
                {active && (
                  <div style={{ position: "relative" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4A820] flex-shrink-0" />
                    <GoldDust style={{ top: -8, right: -4, animation: "gold-dust-1 2s ease-out infinite", fontSize: 5 }} />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-[#D4A82022]">
          <button
            onClick={() => setCollapsed(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F0E855] hover:text-[#D4A820] hover:bg-[#D4A8200D] transition-all"
          >
            <ChevronLeft size={16} />
            <span className="text-xs font-body whitespace-nowrap">Collapse</span>
          </button>
        </div>
      </aside>

      {/* Floating expand tab — visible only when sidebar is collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 flex-col items-center justify-center"
          style={{
            width: "20px",
            height: "64px",
            background: "#0D0D15",
            border: "1px solid #D4A82033",
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            color: "#D4A820",
            boxShadow: "2px 0 12px rgba(212,168,32,0.12)",
          }}
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </>
  );
}
