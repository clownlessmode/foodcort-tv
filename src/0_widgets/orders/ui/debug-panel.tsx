"use client";

import React, { useState, useEffect } from "react";
import { OrdersWebSocketClient } from "../lib/websocket-client";

export const DebugPanel = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [client] = useState(() => new OrdersWebSocketClient());

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    // Подключаемся к WebSocket
    client
      .connect()
      .then(() => {
        addLog("✅ Подключен к WebSocket");

        // Подписываемся на события
        client.onNewOrder((order: unknown) => {
          addLog(`📢 Новый заказ: ${JSON.stringify(order)}`);
        });

        client.onOrderStatusUpdate((data) => {
          addLog(`🔄 Статус обновлен: ${JSON.stringify(data)}`);
        });

        client.onOrdersList((orders: unknown[]) => {
          addLog(
            `📋 Список заказов (${orders.length}): ${JSON.stringify(orders)}`
          );
        });
      })
      .catch((error) => {
        addLog(`❌ Ошибка подключения: ${error}`);
      });

    return () => {
      client.disconnect();
    };
  }, [client]);

  return (
    <div className="fixed top-4 right-4 w-96 h-96 bg-black bg-opacity-90 text-white p-4 rounded-lg overflow-y-auto text-xs font-mono">
      <h3 className="text-sm font-bold mb-2">WebSocket Debug</h3>
      <div className="space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="text-xs">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
