"use client";

import { useEffect, useState } from "react";
import { usePadConnection } from "../lib/use-pad-connection";

export const PadConnection = () => {
  const [code, setCode] = useState<number | null>(null);
  const { idStore, isLoading, error, } = usePadConnection();

  const isConnected = async (): Promise<boolean> => {
    try {
      const idStoreStr = localStorage.getItem("idStore");
      if (!idStoreStr) return false;
      const idStore = Number(idStoreStr);
      return isNaN(idStore) ? false : true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const generateCode = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(
          /\/$/,
          ""
        )}/api/foodcord/device-communication/tv-generate-code`
      );
      const data = await response.json();
      localStorage.setItem("code", data.code);
      return data.code;
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const codeStr = localStorage.getItem("code");
    if (codeStr) {
      setCode(Number(codeStr));
      return;
    }
    isConnected().then((connected) => {
      if (!connected) {
        generateCode().then((code) => {
          setCode(Number(code));
        });
      }
    });
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex bg-white bg-opacity-50 items-center justify-center flex-col gap-2 z-9999">
      <span className="text-gray-600 text-5xl">Код для подключения:</span>
      <span className="text-red-600 text-9xl">{code}</span>
    </div>
  );
};
