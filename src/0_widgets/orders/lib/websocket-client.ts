import { io, Socket } from "socket.io-client";

export class OrdersWebSocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private newOrderAudio: HTMLAudioElement | null = null;

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Derive origin and socket path from serverUrl
      let origin = this.serverUrl;
      let socketPath = "/socket.io";
      try {
        const parsed = new URL(this.serverUrl);
        origin = `${parsed.protocol}//${parsed.host}`;
        const basePath = parsed.pathname.replace(/\/$/, "");
        socketPath = `${basePath || ""}/socket.io` || "/socket.io";
      } catch (e) {
        console.warn(
          "⚠️ Некорректный NEXT_PUBLIC_API_URL, используем как есть:",
          this.serverUrl,
          e
        );
      }

      const namespace = "/orders";
      const namespaceUrl = `${origin}${namespace}`;

      console.log("🔌 Попытка подключения к WebSocket (origin):", origin);
      console.log("🔌 Socket.IO path:", socketPath);
      console.log("🔌 Namespace:", namespace);
      console.log("🔌 Полный URL для namespace:", namespaceUrl);

      this.socket = io(namespaceUrl, {
        transports: ["websocket"],
        path: socketPath,
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Настраиваем звук для новых заказов (в браузере)
      if (typeof window !== "undefined") {
        try {
          const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(
            /\/$/,
            ""
          );
          const audioPath =
            `${base}/sounds/neworder.mp3` || "/sounds/neworder.mp3";
          this.newOrderAudio = new Audio(audioPath);
          this.newOrderAudio.preload = "auto";
          this.newOrderAudio.volume = 1.0;
        } catch (e) {
          console.warn("⚠️ Не удалось инициализировать звук нового заказа:", e);
        }
      }

      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("✅ Подключен к серверу заказов");
        console.log("🔗 Socket ID:", this.socket?.id);
        console.log("🔗 Transport:", this.socket?.io.engine.transport.name);

        // Автоматически запрашиваем список заказов при подключении
        this.socket?.emit("get_orders");
        console.log("📋 Запрашиваем список заказов...");

        resolve();
      });

      // Локальное воспроизведение звука при получении нового заказа
      this.socket.on("new_order", () => {
        if (this.newOrderAudio) {
          try {
            this.newOrderAudio.currentTime = 0;
            void this.newOrderAudio.play();
          } catch (e) {
            console.warn("⚠️ Не удалось проиграть звук нового заказа:", e);
          }
        }
      });

      // Обработчик подтверждения подключения от сервера
      this.socket.on("connection_confirmed", (data) => {
        console.log("🔗 Подтверждение подключения от сервера:", data);
      });

      this.socket.on("connect_error", (error: unknown) => {
        console.error("❌ ===== ОШИБКА ПОДКЛЮЧЕНИЯ =====");
        const err = error as Error;
        console.error("❌ Сообщение:", err?.message || "нет сообщения");
        if (error && typeof error === "object") {
          const maybe: Partial<{
            type: unknown;
            description: unknown;
            context: unknown;
          }> = error as never;
          if ("type" in maybe && maybe.type !== undefined) {
            console.error("❌ Тип ошибки:", String(maybe.type));
          }
          if ("description" in maybe && maybe.description !== undefined) {
            console.error("❌ Описание:", String(maybe.description));
          }
          if ("context" in maybe && maybe.context !== undefined) {
            console.error("❌ Контекст:", String(maybe.context));
          }
        }
        console.error("❌ Полная ошибка:", error);
        console.error("❌ URL (origin):", origin);
        console.error("❌ Socket.IO path:", socketPath);
        console.error("❌ Namespace URL:", namespaceUrl);
        console.error("❌ ===== КОНЕЦ ОШИБКИ =====");
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        this.isConnected = false;
        console.log("❌ ===== ОТКЛЮЧЕНИЕ =====");
        console.log("❌ Причина:", reason);
        console.log("❌ ===== КОНЕЦ ОТКЛЮЧЕНИЯ =====");
      });

      // Обработчик ошибок WebSocket
      this.socket.on("error", (error: unknown) => {
        console.error("❌ ===== ОШИБКА WEBSOCKET =====");
        console.error("❌ Ошибка:", error);
        console.error("❌ Тип:", typeof error);
        console.error("❌ ===== КОНЕЦ ОШИБКИ WEBSOCKET =====");
      });

      // Дополнительные обработчики для диагностики
      this.socket.io.on("error", (error: unknown) => {
        console.error("❌ ===== ОШИБКА IO =====");
        console.error("❌ IO Ошибка:", error);
        console.error("❌ ===== КОНЕЦ ОШИБКИ IO =====");
      });

      this.socket.io.engine.on("error", (error: unknown) => {
        console.error("❌ ===== ОШИБКА ENGINE =====");
        console.error("❌ Engine Ошибка:", error);
        console.error("❌ ===== КОНЕЦ ОШИБКИ ENGINE =====");
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  onNewOrder(callback: (order: unknown) => void): void {
    if (this.socket) {
      this.socket.on("new_order", callback);
    }
  }

  onOrderStatusUpdate(
    callback: (data: {
      orderId: number;
      status: string;
      updatedBy: string;
      timestamp: string;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on("order_status_updated", callback);
    }
  }

  onOrdersList(callback: (orders: unknown[]) => void): void {
    if (this.socket) {
      this.socket.on("orders_list", callback);
    }
  }

  onConnectionConfirmed(
    callback: (data: {
      message: string;
      clientId: string;
      timestamp: string;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on("connection_confirmed", callback);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
