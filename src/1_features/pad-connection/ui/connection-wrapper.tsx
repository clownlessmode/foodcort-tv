"use client";

import React from "react";
import { usePadConnectionCtx } from "..";

interface ConnectionWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ConnectionWrapper = ({ children, fallback }: ConnectionWrapperProps) => {
  const { idStore } = usePadConnectionCtx();
  return <>{idStore !== null ? children : fallback}</>;
};