"use client";

import React, { createContext, useContext, useState } from "react";

interface LayoutCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutCtx>({
  collapsed: false,
  setCollapsed: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
