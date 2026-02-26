"use client";

import React, { createContext, useContext } from "react";
import { usePadConnection } from "..";


type PadConnectionCtx = ReturnType<typeof usePadConnection>;

const PadConnectionContext = createContext<PadConnectionCtx | null>(null);

export function PadConnectionProvider({ children }: { children: React.ReactNode }) {
  const value = usePadConnection();
  return (
    <PadConnectionContext.Provider value={value}>
      {children}
    </PadConnectionContext.Provider>
  );
}

export function usePadConnectionCtx() {
  const ctx = useContext(PadConnectionContext);
  if (!ctx) throw new Error("usePadConnectionCtx must be used within PadConnectionProvider");
  return ctx;
}