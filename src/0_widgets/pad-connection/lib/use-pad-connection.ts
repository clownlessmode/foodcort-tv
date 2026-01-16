"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrdersWebSocketClient } from "./websocket-client";

interface UsePadConnectionReturn {
  idStore: number | null;
  isLoading: boolean;
  error: string | null;
}

export const usePadConnection = (): UsePadConnectionReturn => {
  const [idStore, setIdStore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Храним экземпляр класса в ref, чтобы он не пересоздавался при ререндерах
  const wsClientRef = useRef<OrdersWebSocketClient | null>(null);

  // Получение кода из localStorage
  const getCode = useCallback((): number | null => {
    if (typeof window === "undefined") return null;
    try {
      const codeStr = localStorage.getItem("code");
      // Также проверяем, может мы уже сохранили idStore ранее
      const storedIdStore = localStorage.getItem("idStore");
      
      // Если idStore уже есть, можно сразу вернуть его в state (опционально)
      if (storedIdStore) {
        setIdStore(Number(storedIdStore));
        setIsLoading(false);
        return null; // Прерываем процесс подключения, так как id уже есть
      }

      if (codeStr) {
        const code = Number(codeStr);
        return isNaN(code) ? null : code;
      }
    } catch (e) {
      console.warn("Ошибка при чтении localStorage:", e);
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    const code = getCode();
    
    // Если idStore уже был найден в getCode, выходим
    if (idStore) return;

    if (!code) {
      // Если нет кода и нет idStore - это ошибка или состояние ожидания ввода кода
      setError("Код подключения не найден");
      setIsLoading(false);
      return;
    }

    // Инициализируем клиент, если его нет
    if (!wsClientRef.current) {
      wsClientRef.current = new OrdersWebSocketClient();
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Сначала подключаемся (внутри отправляется join_pairing_room)
      await wsClientRef.current.connect(code);

      // 2. Подписываемся на успешный ответ
      // Важно: в классе уже есть слушатель, который сделает disconnect,
      // а этот слушатель обновит UI.
      wsClientRef.current.onStoreAssigned((data: { idStore: number }) => {
        // Сохраняем в state
        setIdStore(data.idStore);
        
        // Сохраняем в localStorage для будущих сессий
        if (typeof window !== "undefined") {
          localStorage.setItem("idStore", String(data.idStore));
        }
        
        setIsLoading(false);
      });

    } catch (err) {
      console.error("❌ Ошибка в usePadConnection:", err);
      setError(err instanceof Error ? err.message : "Ошибка подключения");
      setIsLoading(false);
    }
  }, [getCode, idStore]);

  useEffect(() => {
    connect();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [connect]);

  return {
    idStore,
    isLoading,
    error,
  };
};