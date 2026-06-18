"use client";

import React, { useEffect, useState } from "react";
import { useLayout } from "./LayoutProvider";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useLayout();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <main
      className="flex-1 overflow-y-auto transition-all duration-300 pb-20 md:pb-0"
      style={{ marginLeft: isMobile ? 0 : collapsed ? "0px" : "256px" }}
    >
      {children}
    </main>
  );
}
