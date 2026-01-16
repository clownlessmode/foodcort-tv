"use client";

import { motion, AnimatePresence } from "motion/react";
import { orderVariants } from "../config";
import { useOrders } from "../lib/use-orders";
import { OrderEntity } from "../../../2_entities/order/config/types";

export const Orders = () => {
  const { newOrders, completedOrders, isLoading, error, reconnect } =
    useOrders();

  // Логирование для отладки
  console.log("🎯 ===== ORDERS КОМПОНЕНТ ПЕРЕРИСОВКА =====");
  console.log("📊 Новые заказы (количество):", newOrders.length);
  console.log("📊 Готовые заказы (количество):", completedOrders.length);
  console.log(
    "📋 ID новых заказов:",
    newOrders.map((o) => o.id)
  );
  console.log(
    "📋 ID готовых заказов:",
    completedOrders.map((o) => o.id)
  );
  console.log("🎯 ===== КОНЕЦ ПЕРЕРИСОВКИ =====");

  // Определяем количество колонок для сетки на основе максимального количества заказов
  const maxOrders = Math.max(newOrders.length, completedOrders.length);
  const getGridCols = () => {
    if (maxOrders > 20) return "grid-cols-3";
    if (maxOrders > 10) return "grid-cols-2";
    return "grid-cols-1";
  };

  const formatOrderId = (id: string | number | null | undefined) => {
    if (id === null || id === undefined) return "";
    const lastThree = id.toString().slice(-3);
    const trimmed = lastThree.replace(/^0+/, "");
    return trimmed || "0";
  };

  if (isLoading) {
    return (
      <div className="col-span-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#553826] mb-2">
            Подключение к серверу...
          </div>
          <div className="w-8 h-8 border-4 border-[#553826] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">
            Ошибка подключения
          </div>
          <div className="text-lg text-gray-600 mb-4">{error}</div>
          <button
            onClick={reconnect}
            className="px-6 py-2 bg-[#553826] text-white rounded-lg hover:bg-[#6b4a32] transition-colors"
          >
            Переподключиться
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 grid grid-cols-2">
      <div className="flex flex-col gap-5">
        <div className="bg-[#553826] py-8 text-center">
          <h1 className="text-5xl font-bold tracking-wide text-white">
            В работе
          </h1>
        </div>
        <div className={`grid ${getGridCols()} gap-5`}>
          <AnimatePresence mode="popLayout">
            {newOrders.map((order: OrderEntity) => (
              <motion.div
                key={order.id}
                variants={orderVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="flex items-center justify-center"
              >
                <span className="text-5xl font-bold text-[#553826]">
                  {formatOrderId(order.id)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="bg-[#E51C4C] py-8 text-center">
          <h1 className="text-5xl font-bold tracking-wide text-white">
            Готовы
          </h1>
        </div>
        <div className={`grid ${getGridCols()} gap-5`}>
          <AnimatePresence mode="popLayout">
            {completedOrders.map((order: OrderEntity) => (
              <motion.div
                key={order.id}
                variants={orderVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="flex items-center justify-center"
              >
                <span className="text-5xl font-bold text-[#E51C4C]">
                  {formatOrderId(order.id)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
