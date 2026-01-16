/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrdersWebSocketClient } from "./websocket-client";
import {
  OrderEntity,
  ORDERS_STATUS,
} from "../../../2_entities/order/config/types";

// Утилита: проверка, что дата относится к сегодняшнему дню (локальное время)
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// Интерфейс для данных заказа с сервера
interface ServerOrderData {
  orderId?: number;
  id?: number;
  status?: string;
  phoneNumber?: string;
  phone_number?: string;
  idStore?: number;
  id_store?: number;
  created_at?: string;
  completed_at?: string | null;
  handed_over_at?: string | null;
  products?: unknown[];
  message?: string;
}

interface UseOrdersReturn {
  newOrders: OrderEntity[];
  completedOrders: OrderEntity[];
  isLoading: boolean;
  error: string | null;
  reconnect: () => void;
}

export const useOrders = (): UseOrdersReturn => {
  const [newOrders, setNewOrders] = useState<OrderEntity[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsClientRef = useRef<OrdersWebSocketClient | null>(null);
  const createdAtRef = useRef<Map<number, Date>>(new Map());

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const client = new OrdersWebSocketClient();
      await client.connect();

      wsClientRef.current = client;

      // Обработчик подтверждения подключения
      client.onConnectionConfirmed((data) => {
        console.log("🔗 Подтверждение подключения:", data);
      });

      // Обработчик получения списка заказов
      client.onOrdersList((ordersData: unknown[]) => {
        console.log("📋 Получен список заказов (сырые данные):", ordersData);
        console.log("📋 Количество заказов:", ordersData.length);

        // Преобразуем данные сервера в формат OrderEntity
        const orders: OrderEntity[] = ordersData.map((orderData: unknown) => {
          const data = orderData as ServerOrderData;
          return {
            id: data.orderId || data.id || 0,
            orderId: data.orderId || data.id || 0,
            status: (data.status as ORDERS_STATUS) || ORDERS_STATUS.NEW,
            phone_number: data.phoneNumber || data.phone_number || "",
            id_store: data.idStore || data.id_store || 0,
            created_at: data.created_at
              ? new Date(data.created_at)
              : new Date(),
            completed_at: data.completed_at
              ? new Date(data.completed_at)
              : null,
            handed_over_at: data.handed_over_at
              ? new Date(data.handed_over_at)
              : null,
          };
        });

        console.log("📋 Преобразованные заказы:", orders);

        // Запомним created_at для всех известных заказов
        for (const o of orders) {
          createdAtRef.current.set(Number(o.id), o.created_at);
        }

        // Оставляем только заказы за сегодня
        const todayOrders = orders.filter((o) => isToday(o.created_at));

        const newOrdersList = todayOrders
          .filter((order) => order.status === ORDERS_STATUS.NEW)
          .sort((a, b) => a.id - b.id); // Сортируем по возрастанию ID (меньшие числа вверху)
        const completedOrdersList = todayOrders
          .filter((order) => order.status === ORDERS_STATUS.COMPLETED)
          .sort((a, b) => a.id - b.id); // Сортируем по возрастанию ID (меньшие числа вверху)

        console.log("📋 Новые заказы:", newOrdersList);
        console.log("📋 Готовые заказы:", completedOrdersList);

        setNewOrders(newOrdersList);
        setCompletedOrders(completedOrdersList);

        console.log(
          "🔄 Обновлены заказы - новые:",
          newOrdersList.length,
          "готовые:",
          completedOrdersList.length
        );
      });

      // Обработчик нового заказа
      client.onNewOrder((orderData: unknown) => {
        const data = orderData as ServerOrderData;
        console.log("🆕 Новый заказ получен (сырые данные):", data);

        // Преобразуем данные сервера в формат OrderEntity
        const createdAt = data.created_at
          ? new Date(data.created_at)
          : new Date();
        const order: OrderEntity = {
          id: data.orderId || data.id || 0,
          orderId: data.orderId || data.id || 0,
          status: (data.status as ORDERS_STATUS) || ORDERS_STATUS.NEW,
          phone_number: data.phoneNumber || data.phone_number || "",
          id_store: data.idStore || data.id_store || 0,
          created_at: createdAt,
          completed_at: null,
          handed_over_at: null,
        };

        // Игнорируем заказы не за сегодняшний день
        if (!isToday(order.created_at)) {
          console.log("⏭️ Новый заказ не за сегодня, пропускаем:", order.id);
          return;
        }

        // Сохраним created_at
        createdAtRef.current.set(Number(order.id), order.created_at);

        console.log("🆕 Преобразованный заказ:", order);
        console.log("🆕 Статус заказа:", order.status);
        console.log("🆕 ID заказа:", order.id);

        // Добавляем новый заказ в список новых заказов
        setNewOrders((prev) => {
          // Проверяем, нет ли уже такого заказа в списке
          const existingOrder = prev.find(
            (existingOrder) => Number(existingOrder.id) === Number(order.id)
          );
          if (!existingOrder) {
            console.log("✅ Добавляем новый заказ в список:", order.id);
            const updatedOrders = [...prev, order];
            // Сортируем по возрастанию ID (меньшие числа вверху)
            return updatedOrders.sort((a, b) => a.id - b.id);
          }
          console.log("⚠️ Заказ уже существует в списке:", order.id);
          return prev;
        });
      });

      // Обработчик обновления статуса заказа
      client.onOrderStatusUpdate((data) => {
        console.log("🔄 ===== ОБНОВЛЕНИЕ СТАТУСА ЗАКАЗА =====");
        console.log("📋 Данные обновления:", data);
        console.log("🎯 Заказ ID:", data.orderId);
        console.log("📊 Новый статус:", data.status);

        const knownCreatedAt = createdAtRef.current.get(Number(data.orderId));
        const isOrderToday = knownCreatedAt ? isToday(knownCreatedAt) : false;

        // Простой подход - обновляем каждый список независимо
        if (data.status === ORDERS_STATUS.COMPLETED) {
          console.log("🔄 Обрабатываем статус COMPLETED");

          // Удаляем из новых заказов
          setNewOrders((prevNewOrders) => {
            console.log(
              "🔍 Проверяем новые заказы:",
              prevNewOrders.map((o) => o.id)
            );
            const foundInNew = prevNewOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (foundInNew) {
              console.log("✅ НАЙДЕН заказ в новых, УДАЛЯЕМ:", data.orderId);
              const newList = prevNewOrders.filter(
                (order) => Number(order.id) !== Number(data.orderId)
              );
              console.log(
                "📋 Новый список новых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ НЕ НАЙДЕН в новых заказах");
            }
            return prevNewOrders;
          });

          // Добавляем в готовые заказы
          setCompletedOrders((prevCompletedOrders) => {
            // Добавляем только если заказ относится к сегодняшнему дню
            if (!isOrderToday) {
              console.log(
                "⏭️ Заказ не за сегодня, в готовые не добавляем:",
                data.orderId
              );
              return prevCompletedOrders;
            }
            console.log(
              "🔍 Проверяем готовые заказы:",
              prevCompletedOrders.map((o) => o.id)
            );
            const foundInCompleted = prevCompletedOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (!foundInCompleted) {
              console.log(
                "✅ Заказ НЕ НАЙДЕН в готовых, ДОБАВЛЯЕМ:",
                data.orderId
              );
              const tempOrder: OrderEntity = {
                id: data.orderId,
                orderId: data.orderId,
                status: ORDERS_STATUS.COMPLETED,
                phone_number: "",
                id_store: 0,
                created_at: knownCreatedAt || new Date(),
                completed_at: new Date(),
                handed_over_at: null,
              };
              const newList = [...prevCompletedOrders, tempOrder].sort(
                (a, b) => a.id - b.id
              );
              console.log(
                "📋 Новый список готовых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ УЖЕ ЕСТЬ в готовых заказах");
            }
            return prevCompletedOrders;
          });
        } else if (data.status === ORDERS_STATUS.NEW) {
          console.log("🔄 Обрабатываем статус NEW");

          // Удаляем из готовых заказов
          setCompletedOrders((prevCompletedOrders) => {
            console.log(
              "🔍 Проверяем готовые заказы:",
              prevCompletedOrders.map((o) => o.id)
            );
            const foundInCompleted = prevCompletedOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (foundInCompleted) {
              console.log("✅ НАЙДЕН заказ в готовых, УДАЛЯЕМ:", data.orderId);
              const newList = prevCompletedOrders.filter(
                (order) => Number(order.id) !== Number(data.orderId)
              );
              console.log(
                "📋 Новый список готовых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ НЕ НАЙДЕН в готовых заказах");
            }
            return prevCompletedOrders;
          });

          // Добавляем в новые заказы
          setNewOrders((prevNewOrders) => {
            // Добавляем только если заказ относится к сегодняшнему дню
            if (!isOrderToday) {
              console.log(
                "⏭️ Заказ не за сегодня, в новые не добавляем:",
                data.orderId
              );
              return prevNewOrders;
            }
            console.log(
              "🔍 Проверяем новые заказы:",
              prevNewOrders.map((o) => o.id)
            );
            const foundInNew = prevNewOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (!foundInNew) {
              console.log(
                "✅ Заказ НЕ НАЙДЕН в новых, ДОБАВЛЯЕМ:",
                data.orderId
              );
              const tempOrder: OrderEntity = {
                id: data.orderId,
                orderId: data.orderId,
                status: ORDERS_STATUS.NEW,
                phone_number: "",
                id_store: 0,
                created_at: knownCreatedAt || new Date(),
                completed_at: null,
                handed_over_at: null,
              };
              const newList = [...prevNewOrders, tempOrder].sort(
                (a, b) => a.id - b.id
              );
              console.log(
                "📋 Новый список новых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ УЖЕ ЕСТЬ в новых заказах");
            }
            return prevNewOrders;
          });
        } else if (
          data.status === ORDERS_STATUS.CANCELLED ||
          data.status === ORDERS_STATUS.DELIVERED
        ) {
          const statusText =
            data.status === ORDERS_STATUS.CANCELLED ? "отменен" : "доставлен";
          console.log(
            `🔄 Обрабатываем статус ${data.status.toUpperCase()} - удаляем из всех списков (${statusText})`
          );

          // Удаляем из новых заказов
          setNewOrders((prevNewOrders) => {
            console.log(
              "🔍 Проверяем новые заказы:",
              prevNewOrders.map((o) => o.id)
            );
            const foundInNew = prevNewOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (foundInNew) {
              console.log(
                `✅ НАЙДЕН заказ в новых, УДАЛЯЕМ (${statusText}):`,
                data.orderId
              );
              const newList = prevNewOrders.filter(
                (order) => Number(order.id) !== Number(data.orderId)
              );
              console.log(
                "📋 Новый список новых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ НЕ НАЙДЕН в новых заказах");
            }
            return prevNewOrders;
          });

          // Удаляем из готовых заказов
          setCompletedOrders((prevCompletedOrders) => {
            console.log(
              "🔍 Проверяем готовые заказы:",
              prevCompletedOrders.map((o) => o.id)
            );
            const foundInCompleted = prevCompletedOrders.find(
              (order) => Number(order.id) === Number(data.orderId)
            );
            if (foundInCompleted) {
              console.log(
                `✅ НАЙДЕН заказ в готовых, УДАЛЯЕМ (${statusText}):`,
                data.orderId
              );
              const newList = prevCompletedOrders.filter(
                (order) => Number(order.id) !== Number(data.orderId)
              );
              console.log(
                "📋 Новый список готовых заказов:",
                newList.map((o) => o.id)
              );
              return newList;
            } else {
              console.log("❌ Заказ НЕ НАЙДЕН в готовых заказах");
            }
            return prevCompletedOrders;
          });
        }

        console.log("🔄 ===== КОНЕЦ ОБНОВЛЕНИЯ СТАТУСА =====");
      });

      setIsLoading(false);
    } catch (err) {
      console.error("❌ Ошибка:", err);

      if (err instanceof Error) {
        console.error("❌ Название ошибки:", err.name);
        console.error("❌ Сообщение:", err.message);
      }

      // Проверяем, является ли это ошибкой Socket.IO
      if (err && typeof err === "object" && "type" in err) {
        console.error("❌ Socket.IO тип ошибки:", (err as any).type);
        console.error("❌ Socket.IO описание:", (err as any).description);
      }

      setError(
        err instanceof Error ? err.message : "Ошибка подключения к серверу"
      );
      setIsLoading(false);

      // Очищаем состояние при ошибке
      setNewOrders([]);
      setCompletedOrders([]);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, [connect]);

  return {
    newOrders,
    completedOrders,
    isLoading,
    error,
    reconnect,
  };
};
