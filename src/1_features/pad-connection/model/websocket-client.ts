import { io, Socket } from "socket.io-client";

export class OrdersWebSocketClient {
  private socket: Socket | null = null;
  private code: number | null = null;
  private storedCallback: ((data: { idStore: number }) => void) | null = null;

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
  ) {}

  connect(code: number): Promise<void> {
    this.code = code;

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

      // Восстанавливаем подписку для UI на новом сокете, если она была
      if (this.storedCallback) {
        this.socket.on("store_assigned", this.storedCallback);
      }

      this.socket.on("connect", () => {
        console.log("✅ Подключен. Отправляем code:", code);
        this.socket?.emit("join_pairing_room", code);
        resolve();
      });

      // Внутренняя логика отключения при успехе
      this.socket.on("store_assigned", (data) => {
        console.log("🎯 Получен idStore:", data);
        if (this.storedCallback) this.storedCallback(data);
        if (data) this.disconnect();
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

  // Метод для ручного переподключения
  async reconnect(): Promise<void> {
    console.log("🔄 Выполняется ручное переподключение...");
    this.disconnect(); // Сначала отключаемся

    if (this.code) {
      // Если код есть, подключаемся заново
      return this.connect(this.code);
    } else {
      console.warn("⚠️ Нет сохраненного кода для переподключения");
      return Promise.resolve();
    }
  }

  // Метод для подписки UI на получение данных магазина
  onStoreAssigned(callback: (data: { idStore: number }) => void): void {
    this.storedCallback = callback; // Сохраняем колбэк
    if (this.socket) {
      this.socket.on("store_assigned", callback);
    }
  }
}
