"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "./LayoutProvider";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";

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
          borderRight: collapsed ? "none" : "1px solid #C9A84C22",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#C9A84C22]">
          <div className="w-9 h-9 rounded-xl bg-[#C9A84C] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_#C9A84C44]">
            <Sparkles size={18} className="text-[#0A0A0F]" />
          </div>
          <div>
            <p className="font-heading text-base font-bold text-[#C9A84C] leading-tight whitespace-nowrap">Golden Soul</p>
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
                    ? "bg-[#C9A84C1A] text-[#C9A84C] border border-[#C9A84C33]"
                    : "text-[#F5F0E877] hover:text-[#F5F0E8] hover:bg-[#C9A84C0D] border border-transparent"
                }`}
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[8px] font-body uppercase tracking-widest text-[#C9A84C55] leading-none mb-0.5 whitespace-nowrap">
                    Step {step}
                  </span>
                  <Icon size={15} className={`${active ? "text-[#C9A84C]" : "text-[#F5F0E855] group-hover:text-[#C9A84C88]"}`} />
                </div>
                <span className="text-[13px] font-body font-medium truncate flex-1 whitespace-nowrap">{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-[#C9A84C22]">
          <button
            onClick={() => setCollapsed(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F0E855] hover:text-[#C9A84C] hover:bg-[#C9A84C0D] transition-all"
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
            border: "1px solid #C9A84C33",
            borderLeft: "none",
            borderRadius: "0 8px 8px 0",
            color: "#C9A84C",
            boxShadow: "2px 0 12px rgba(201,168,76,0.08)",
          }}
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </>
  );
}
