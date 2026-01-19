"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrdersWebSocketClient } from "./websocket-client";


interface UsePadConnectionReturn {
  idStore: number | null;
  isLoading: boolean;
  error: string | null;
  reconnect: () => void;
}

// Чтение localStorage
function readNumberLS(key: string): number | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const numbericValue = Number(value);
    return Number.isFinite(numbericValue) ? numbericValue : null;
  } catch {
    return null;
  }
}

export const usePadConnection = (): UsePadConnectionReturn => {
  const [idStore, setIdStore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsClientRef = useRef<OrdersWebSocketClient | null>(null);
  const idStoreRef = useRef<number | null>(null);

  useEffect(() => {
    idStoreRef.current = idStore;
  }, [idStore]);

  const ensureClient = () => {
    if (!wsClientRef.current) wsClientRef.current = new OrdersWebSocketClient();
    return wsClientRef.current;
  };

  const hydrateFromLocalStorage = useCallback(() => {
    if (typeof window === "undefined") return { idStore: null as number | null, code: null as number | null };

    const storedIdStore = readNumberLS("idStore");
    if (storedIdStore !== null) {
      setIdStore(storedIdStore);
      setIsLoading(false);
      return { idStore: storedIdStore, code: null };
    }

    const code = readNumberLS("code");
    return { idStore: null, code };
  }, []);

  const connect = useCallback(async () => {
    const { idStore: storedIdStore, code } = hydrateFromLocalStorage();

    if (storedIdStore !== null || idStoreRef.current !== null) return;

    if (!code) {
      setError("Код подключения не найден");
      setIsLoading(false);
      return;
    }

    const client = ensureClient();

    setIsLoading(true);
    setError(null);

    try {
      client.onStoreAssigned((data: { idStore: number }) => {
        setIdStore(data.idStore);
        try {
          localStorage.setItem("idStore", String(data.idStore));
        } catch {}
        setIsLoading(false);
      });

      await client.connect(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка подключения");
      setIsLoading(false);
    }
  }, [hydrateFromLocalStorage]);

  const reconnect = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (idStoreRef.current !== null) {
      setIsLoading(false);
      return;
    }

    const client = ensureClient();

    client.disconnect();
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "idStore") {
        const value = readNumberLS("idStore");
        if (value !== null) setIdStore(value);
      }
      if (e.key === "code") {
        if (idStoreRef.current === null) reconnect();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      wsClientRef.current?.disconnect();
      wsClientRef.current = null;
    };
  }, [connect, reconnect]);

  return { idStore, isLoading, error, reconnect };
};