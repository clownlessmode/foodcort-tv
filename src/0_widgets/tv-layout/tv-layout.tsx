"use client";

import { ConnectionWrapper, PadConnection, PadConnectionProvider } from "@features/pad-connection";
import React from "react";

export function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <PadConnectionProvider>
      <ConnectionWrapper fallback={<PadConnection />}>
        {children}
      </ConnectionWrapper>
    </PadConnectionProvider>
  );
}