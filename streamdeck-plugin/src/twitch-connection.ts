import streamDeck from "@elgato/streamdeck";
import WebSocket from "ws";

export type TwitchState = {
  type: "state";
  active: boolean;
  muted?: boolean;
  paused?: boolean;
  channel?: string;
  chat?: boolean;
  theater?: boolean;
  volume?: number;
  avatar?: string;
};

type StateListener = (state: TwitchState) => void;

export class TwitchConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: ReturnType<typeof setInterval> | undefined;
  private listeners: Set<StateListener> = new Set();
  private _lastState: TwitchState | null = null;

  get lastState(): TwitchState | null {
    return this._lastState;
  }

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.on("open", () => {
        streamDeck.logger.info("Connected to Twitch controller server");
        this.ws!.send(JSON.stringify({ type: "register", role: "streamdeck" }));
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }
      });

      this.ws.on("message", (data) => {
        try {
          const msg = JSON.parse(String(data));
          if (msg.type === "state") {
            this._lastState = msg as TwitchState;
            for (const listener of this.listeners) {
              listener(this._lastState);
            }
          }
        } catch {
          streamDeck.logger.warn(`Unparseable message: ${data}`);
        }
      });

      this.ws.on("close", () => {
        streamDeck.logger.warn("Disconnected from server, reconnecting...");
        this.ws = null;
        this.scheduleReconnect();
      });

      this.ws.on("error", () => {
        this.ws?.close();
      });
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setInterval(() => this.connect(), 3000);
    }
  }

  reconnect() {
    this.ws?.close();
    this.ws = null;
    this.connect();
  }

  send(command: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "command", command }));
    }
  }

  onState(listener: StateListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
