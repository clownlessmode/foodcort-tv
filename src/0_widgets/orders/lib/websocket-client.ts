import { io, Socket } from "socket.io-client";

export class OrdersWebSocketClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private newOrderAudio: HTMLAudioElement | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1 секунда
  private idStore: number | null = null;
  private storageWatcherInitialized = false;

  // Порядок предпочтения аудио форматов (от лучшего к худшему)
  private readonly audioFormats = ["mp3", "wav", "aac", "aiff", "wma"];

  constructor(
    private serverUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
  ) {
    if (typeof window !== "undefined") {
      this.setupLocalStorageWatcher();
    }
  }

  // Настройка отслеживания изменений localStorage
  private setupLocalStorageWatcher(): void {
    if (this.storageWatcherInitialized) return;
    this.storageWatcherInitialized = true;

    const checkAndReconnect = () => {
      const newIdStore = this.getIdStore();

      // Если idStore появился и его не было раньше
      if (newIdStore && !this.idStore) {
        console.log("🔄 Обнаружен idStore в localStorage, подключаемся...");

        // Подключаемся
        this.connect().catch((error) => {
          console.error("❌ Ошибка при автоматическом подключении:", error);
        });
      }
      // Если idStore изменился и мы уже подключены
      else if (newIdStore && this.idStore && newIdStore !== this.idStore) {
        console.log("🔄 idStore изменился, переподключаемся...");

        // Отключаемся и подключаемся заново
        this.disconnect();
        this.connect().catch((error) => {
          console.error("❌ Ошибка при автоматическом переподключении:", error);
        });
      }
      // Если idStore появился, но мы не подключены
      else if (newIdStore && !this.isConnected) {
        console.log("🔄 idStore найден, но нет подключения, подключаемся...");

        this.connect().catch((error) => {
          console.error("❌ Ошибка при автоматическом подключении:", error);
        });
      }
    };

    // Слушаем изменения из других вкладок/окон
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "idStore" || e.key === null) {
        checkAndReconnect();
      }
    };

    // Слушаем изменения в текущей вкладке
    const handleCustomChange = () => {
      checkAndReconnect();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageChange", handleCustomChange);
  }

  private getIdStore(): number | null {
    if (typeof window === "undefined") return null;

    try {
      const idStoreStr = localStorage.getItem("idStore");
      if (idStoreStr) {
        const idStore = Number(idStoreStr);
        return isNaN(idStore) ? null : idStore;
      }
    } catch (e) {
      console.warn("Ошибка при получении idStore:", e);
    }
    return null;
  }

  connect(): Promise<void> {
    this.idStore = this.getIdStore();

    if (!this.idStore) {
      return Promise.reject(new Error("Нет idStore в localStorage"));
    }
    
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
        reconnectionAttempts: Infinity, // Бесконечные попытки переподключения
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000, // Максимальная задержка 10 секунд
      });

      // Настраиваем звук для новых заказов (в браузере)
      if (typeof window !== "undefined") {
        this.initializeAudio();
      }

      this.socket.on("connect", () => {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Сбрасываем счетчик попыток при успешном подключении
        console.log("✅ Подключен к серверу заказов");
        console.log("🔗 Socket ID:", this.socket?.id);
        console.log("🔗 Transport:", this.socket?.io.engine.transport.name);

        // Запускаем heartbeat для поддержания соединения
        this.startHeartbeat();

        this.idStore = this.getIdStore();
        if (this.idStore) {
          // Автоматически запрашиваем список заказов при подключении
          this.socket?.emit("get_orders", this.idStore);
        } else {
          console.error("❌ Не удалось получить получить данные о заказах");
        }
        console.log("📋 Запрашиваем список заказов...");

        resolve();
      });

      if (this.idStore) {
        // Локальное воспроизведение звука при получении нового заказа
        this.socket.on(`new_order_${this.idStore}`, () => {
          this.playNewOrderSound();
        });
      }

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
        this.stopHeartbeat();
        console.log("❌ ===== ОТКЛЮЧЕНИЕ =====");
        console.log("❌ Причина:", reason);
        console.log("❌ ===== КОНЕЦ ОТКЛЮЧЕНИЯ =====");

        // Если это не ручное отключение, пытаемся переподключиться
        if (reason !== "io client disconnect") {
          this.scheduleReconnect();
        }
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
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Останавливаем предыдущий heartbeat если есть
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        console.log("💓 Отправляем heartbeat...");
        this.socket.emit("ping");
      }
    }, 30000); // Каждые 30 секунд
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(
        "❌ Достигнуто максимальное количество попыток переподключения"
      );
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Экспоненциальная задержка с джиттером
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts) +
        Math.random() * 1000,
      30000 // Максимум 30 секунд
    );

    this.reconnectAttempts++;
    console.log(
      `🔄 Попытка переподключения ${this.reconnectAttempts}/${
        this.maxReconnectAttempts
      } через ${Math.round(delay)}мс`
    );

    this.reconnectTimeout = setTimeout(() => {
      console.log("🔄 Выполняем переподключение...");
      this.connect().catch((error) => {
        console.error("❌ Ошибка при переподключении:", error);
        this.scheduleReconnect(); // Планируем следующую попытку
      });
    }, delay);
  }

  private async initializeAudio(): Promise<void> {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

    for (const format of this.audioFormats) {
      try {
        const audioPath = `${base}/sounds/neworder.${format}`;
        console.log(`🔊 Пробуем загрузить аудио: ${audioPath}`);

        const audio = new Audio(audioPath);
        audio.preload = "auto";
        audio.volume = 1.0;

        // Проверяем, может ли браузер воспроизвести этот формат
        const canPlay = await this.canPlayAudio(audio);

        if (canPlay) {
          this.newOrderAudio = audio;
          console.log(`✅ Успешно инициализирован аудио формат: ${format}`);
          return;
        } else {
          console.log(`❌ Браузер не поддерживает формат: ${format}`);
        }
      } catch (e) {
        console.warn(`⚠️ Ошибка при загрузке аудио формата ${format}:`, e);
      }
    }

    console.warn("⚠️ Не удалось инициализировать ни один аудио формат");
  }

  private canPlayAudio(audio: HTMLAudioElement): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 2000); // 2 секунды на проверку

      const handleCanPlay = () => {
        clearTimeout(timeout);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        resolve(true);
      };

      const handleError = () => {
        clearTimeout(timeout);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        resolve(false);
      };

      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      // Принудительно запускаем проверку
      audio.load();
    });
  }

  private playNewOrderSound(): void {
    if (this.newOrderAudio) {
      try {
        this.newOrderAudio.currentTime = 0;
        void this.newOrderAudio.play();
      } catch (e) {
        console.warn("⚠️ Не удалось проиграть звук нового заказа:", e);
        // Если текущий формат не работает, пробуем переинициализировать аудио
        this.initializeAudio().catch((error) => {
          console.warn("⚠️ Не удалось переинициализировать аудио:", error);
        });
      }
    } else {
      console.warn("⚠️ Аудио не инициализировано, пробуем инициализировать...");
      this.initializeAudio().catch((error) => {
        console.warn("⚠️ Не удалось инициализировать аудио:", error);
      });
    }
  }

  onNewOrder(callback: (order: unknown) => void): void {
    if (this.socket) {
      this.idStore = this.getIdStore();

      if (this.idStore) {
        this.socket.on(`new_order_${this.idStore}`, callback);
      } else {
        console.error("❌ Не удалось получить получить данные о заказах");
      }
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
      this.socket.on(`orders_list_${this.idStore}`, callback);
    }
  }

  onJoinPairingRoom(callback: (idStore: number) => void): void {
    if (this.socket) {
      this.socket.on("store_assigned", callback);
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

  // Метод для принудительного переподключения
  forceReconnect(): void {
    console.log("🔄 Принудительное переподключение...");
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect().catch((error) => {
      console.error("❌ Ошибка при принудительном переподключении:", error);
      this.scheduleReconnect();
    });
  }
}
