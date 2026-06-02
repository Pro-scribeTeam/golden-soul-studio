"use client";

import React from "react";
import { useLayout } from "./LayoutProvider";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useLayout();
  return (
    <main
      className="flex-1 overflow-y-auto transition-all duration-300"
      style={{ marginLeft: collapsed ? "64px" : "256px" }}
    >
      {children}
    </main>
  );
}
