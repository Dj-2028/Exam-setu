/**
 * SSE (Server-Sent Events) client with auto-reconnect.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SSEEventHandler = (event: string, data: unknown) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private handlers: Map<string, SSEEventHandler[]> = new Map();
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect(): void {
    if (this.eventSource) return;

    // SSE doesn't support custom headers, so we pass the token as a query param
    const url = `${API_BASE}/api/v1/events/stream?token=${encodeURIComponent(this.token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000; // Reset on successful connect
    };

    this.eventSource.onerror = () => {
      this.disconnect();
      this.scheduleReconnect();
    };

    // Listen for named events
    this.handlers.forEach((_, eventType) => {
      this.eventSource?.addEventListener(eventType, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.get(eventType)?.forEach((handler) => handler(eventType, data));
        } catch {
          // Invalid JSON — ignore
        }
      });
    });
  }

  on(eventType: string, handler: SSEEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // If already connected, add the listener
    if (this.eventSource) {
      this.eventSource.addEventListener(eventType, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handler(eventType, data);
        } catch {
          // Ignore
        }
      });
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }
}
