import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";

@action({ UUID: "com.snake.twitch-controller.next" })
export class NextAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("next");
  }

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    const state = this.conn.lastState;
    if (state) this.setIcon(ev.action, state);
  }

  private updateAll(state: TwitchState) {
    for (const a of this.actions) {
      this.setIcon(a, state);
    }
  }

  private setIcon(action: any, state: TwitchState) {
    const channel = state.active ? (state.channel ?? "") : "";

    if (!channel) {
      action.setImage("imgs/actions/next/key");
      action.setTitle("");
      return;
    }

    // Dynamic SVG only to show channel name
    const displayName = channel.length > 8 ? channel.slice(0, 7) + "\u2026" : channel;
    const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
      <rect width="144" height="144" rx="20" fill="#1a1a2e"/>
      <circle cx="72" cy="64" r="35" fill="#9b59b6" opacity="0.9"/>
      <text x="72" y="74" text-anchor="middle" fill="white" font-size="36" font-family="Arial" font-weight="bold">\u23ED</text>
      <text x="72" y="128" text-anchor="middle" fill="#bb86fc" font-size="16" font-family="Arial">${displayName}</text>
    </svg>`;
    action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    action.setTitle("");
  }
}
