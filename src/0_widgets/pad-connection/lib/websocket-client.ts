import { io, Socket } from "socket.io-client";

export class OrdersWebSocketClient {
  private socket: Socket | null = null;

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
  ) {}

  connect(code: number): Promise<void> {
    return new Promise((resolve) => {
      let origin = this.serverUrl;
      let socketPath = "/socket.io";
      try {
        const parsed = new URL(this.serverUrl);
        origin = `${parsed.protocol}//${parsed.host}`;
        const basePath = parsed.pathname.replace(/\/$/, "");
        socketPath = `${basePath || ""}/socket.io`;
      } catch {
        console.warn("⚠️ Некорректный URL API:", this.serverUrl);
      }

      const namespaceUrl = `${origin}/device-communication`;

      this.socket = io(namespaceUrl, {
        transports: ["websocket"],
        path: socketPath,
        reconnection: true,
        reconnectionAttempts: 10,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Подключен. Отправляем code:", code);
        this.socket?.emit("join_pairing_room", code);
        resolve();
      });

      this.socket.on("store_assigned", (data) => {
        console.log("🎯 Получен idStore:", data);
        if (data) {
          this.disconnect();
        }
      });

      this.socket.on("connect_error", (err) => {
        console.error("❌ Ошибка подключения:", err.message);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🛑 Соединение закрыто");
    }
  }

  // Метод для подписки UI на получение данных магазина
  onStoreAssigned(callback: (data: { idStore: number }) => void): void {
    if (this.socket) {
      this.socket.on("store_assigned", callback);
    }
  }
}
