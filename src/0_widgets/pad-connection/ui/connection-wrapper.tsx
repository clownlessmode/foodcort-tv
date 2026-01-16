"use client";

import { useEffect, useState } from "react";
import { clearLocalStorage } from "@shared/lib/storage-utils";

interface ConnectionWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ConnectionWrapper = ({
  children,
  fallback,
}: ConnectionWrapperProps) => {
  const [idStore, setIdStore] = useState<number | null>(null);

  const checkConnection = async (): Promise<number | null> => {
    try {
      const idStoreStr = localStorage.getItem("idStore");
      if (!idStoreStr) return null;
      const idStore = Number(idStoreStr);
      return isNaN(idStore) ? null : idStore;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    clearLocalStorage();
    checkConnection().then((idStore) => {
      setIdStore(idStore);
    });
  }, []);

  // Если нет idStore, показываем fallback
  if (!idStore) {
    return <>{fallback}</>;
  }

  // Если есть idStore, показываем основной контент
  return <>{children}</>;
};
