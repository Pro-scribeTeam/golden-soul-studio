"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";
import { Sparkles } from "lucide-react";

const BOTTOM_FIVE = NAV_ITEMS.slice(0, 5);

export function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: "linear-gradient(180deg, #0D0D15 0%, #0A0A0F 100%)",
          borderTop: "1px solid #C9A84C22",
        }}
      >
        {BOTTOM_FIVE.map(({ href, icon: Icon, shortLabel, step }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? "text-[#C9A84C]" : "text-[#F5F0E855]"
              }`}
            >
              <span className="text-[7px] font-body uppercase tracking-widest text-[#C9A84C44]">Step {step}</span>
              <Icon size={18} />
              <span className="text-[9px] font-body">{shortLabel}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[#F5F0E855]"
        >
          <span className="text-[7px] font-body uppercase tracking-widest text-[#C9A84C44]">Steps</span>
          <Menu size={18} />
          <span className="text-[9px] font-body">More</span>
        </button>
      </nav>

      {/* Full-screen drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative mt-auto rounded-t-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #0D0D15 0%, #0A0A0F 100%)",
              border: "1px solid #C9A84C22",
              maxHeight: "80vh",
            }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A84C22]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#C9A84C] flex items-center justify-center">
                  <Sparkles size={13} className="text-[#0A0A0F]" />
                </div>
                <p className="font-heading text-sm font-bold text-[#C9A84C]">Golden Soul Studio</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-[#F5F0E855] hover:text-[#F5F0E8]">
                <X size={18} />
              </button>
            </div>

            {/* All nav items */}
            <div className="overflow-y-auto p-3 space-y-1 pb-8">
              {NAV_ITEMS.map(({ step, href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all border ${
                      active
                        ? "bg-[#C9A84C1A] border-[#C9A84C33] text-[#C9A84C]"
                        : "border-transparent text-[#F5F0E877] hover:bg-[#C9A84C0D] hover:text-[#F5F0E8]"
                    }`}
                  >
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="text-[8px] font-body uppercase tracking-widest text-[#C9A84C55]">Step {step}</span>
                      <Icon size={16} className={active ? "text-[#C9A84C]" : ""} />
                    </div>
                    <span className="text-sm font-body font-medium">{label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
