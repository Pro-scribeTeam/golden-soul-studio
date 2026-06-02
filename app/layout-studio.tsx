"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-[#0A0A0F]">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: "256px" }}
      >
        {children}
      </main>
    </div>
  );
}
