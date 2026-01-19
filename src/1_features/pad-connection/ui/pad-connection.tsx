/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { usePadConnectionCtx } from "..";


export const PadConnection = () => {
  const [code, setCode] = useState<number | null>(null);
  const { reconnect } = usePadConnectionCtx();

  const generateCode = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/api/foodcord/device-communication/tv-generate-code`
    );
    const data = await response.json();

    localStorage.setItem("code", String(data.code));
    reconnect();

    return data.code as number;
  };

  useEffect(() => {
    const codeStr = localStorage.getItem("code");
    if (codeStr && !isNaN(Number(codeStr))) {
      setCode(Number(codeStr));
      return;
    }

    const idStoreStr = localStorage.getItem("idStore");
    if (idStoreStr && !isNaN(Number(idStoreStr))) {
      return;
    }

    generateCode().then((c) => setCode(c)).catch(console.error);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex bg-white bg-opacity-50 items-center justify-center flex-col gap-2 z-9999">
      <span className="text-gray-600 text-5xl">Код для подключения:</span>
      <span className="text-red-600 text-9xl">{code}</span>
    </div>
  );
};