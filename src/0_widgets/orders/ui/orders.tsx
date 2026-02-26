"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { orderVariants } from "../config";
import { useOrders } from "../lib/use-orders";
import { OrderEntity } from "../../../2_entities/order/config/types";
import clsx from "clsx";

const ORDERS_PER_PAGE = 12;
const PAGE_INTERVAL_MS = 7000;

export const Orders = () => {
  const { newOrders, completedOrders, isLoading, error, reconnect } =
    useOrders();
  const [currentPage, setCurrentPage] = useState(0);

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

  const formatOrderId = (id: string | number | null | undefined) => {
    if (id === null || id === undefined) return "";
    const lastThree = id.toString().slice(-3);
    const trimmed = lastThree.replace(/^0+/, "");
    return trimmed || "0";
  };

  // Разбивка на страницы: по 12 заказов, переключение каждые 5 сек
  const newOrderPages = Math.max(1, Math.ceil(newOrders.length / ORDERS_PER_PAGE));
  const completedOrderPages = Math.max(1, Math.ceil(completedOrders.length / ORDERS_PER_PAGE));
  const newPageIndex = currentPage % newOrderPages;
  const completedPageIndex = currentPage % completedOrderPages;
  const newOrdersOnPage = newOrders.slice(
    newPageIndex * ORDERS_PER_PAGE,
    (newPageIndex + 1) * ORDERS_PER_PAGE
  );
  const completedOrdersOnPage = completedOrders.slice(
    completedPageIndex * ORDERS_PER_PAGE,
    (completedPageIndex + 1) * ORDERS_PER_PAGE
  );

  useEffect(() => {
    const totalPages = Math.max(newOrderPages, completedOrderPages);
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((p) => p + 1);
    }, PAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [newOrderPages, completedOrderPages]);

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
    <div className="col-span-2 grid grid-rows-2 gap-4 p-4 4k:gap-8 4k:p-8">
      <div className="flex flex-col gap-4 4k:gap-8">
        <div className="flex items-center gap-2 px-4 4k:gap-4 4k:px-8">
          <h1 className="text-4xl font-bold tracking-wide text-accent uppercase 4k:text-8xl">
            В работе
          </h1>
          <div className="gap-2 flex items-center 4k:gap-4">
          {newOrderPages > 1 && Array.from({ length: newOrderPages }).map((_, index) => (
            <div key={index} className={clsx("w-16 rounded-full h-0.5 4k:h-1 4k:w-32", index === newPageIndex ? "bg-muted-foreground h-1 4k:h-2" : "bg-muted-foreground/20")}></div>
          ))}
        </div>
          <div className="h-0.5 flex-1 bg-accent/40 4k:h-1 rounded-full"></div>
        </div>
        <div className="grid grid-cols-4 gap-6 px-4 4k:gap-12 4k:px-8">
          <AnimatePresence mode="popLayout">
            {newOrdersOnPage.map((order: OrderEntity) => (
              <motion.div
                key={order.id}
                variants={orderVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="flex items-center justify-center"
              >
                <span className="flex-1 text-4xl text-center font-semibold text-muted-foreground bg-muted border border-border rounded-3xl p-4 4k:text-8xl 4k:p-8 4k:rounded-6xl">
                  {formatOrderId(order.daily_id)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex flex-col gap-4 4k:gap-8">
        <div className="flex items-center gap-2 px-4 py-2 4k:py-4 4k:gap-4 4k:px-8">
          <h1 className="text-4xl font-bold tracking-wide text-primary uppercase 4k:text-8xl">
            Готовы
          </h1>
          <div className="gap-2 flex items-center 4k:gap-4">
          {completedOrderPages > 1 && Array.from({ length: completedOrderPages }).map((_, index) => (
            <div key={index} className={clsx("w-16 rounded-full h-0.5 4k:h-1 4k:w-32", index === completedPageIndex ? "bg-primary h-1 4k:h-2" : "bg-primary/20")}></div>
          ))}
          </div>
          <div className="h-0.5 flex-1 bg-primary/40 4k:h-1 rounded-full"></div>
        </div>
        <div className="grid grid-cols-4 gap-6 px-4 4k:gap-12 4k:px-8">
          <AnimatePresence mode="popLayout">
            {completedOrdersOnPage.map((order: OrderEntity) => (
              <motion.div
                key={order.id}
                variants={orderVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className="flex items-center justify-center"
              >
                <span className="flex-1 text-4xl text-center font-semibold text-background bg-primary rounded-3xl p-4 4k:text-8xl 4k:p-8 4k:rounded-6xl">
                  {formatOrderId(order.daily_id)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
