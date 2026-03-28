import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";

@action({ UUID: "com.snake.twitch-controller.volumedown" })
export class VolumeDownAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("volumedown");
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
    if (!state.active) {
      action.setImage("imgs/actions/volume-down/key");
      action.setTitle("");
      return;
    }
    // Dynamic SVG to show current volume %
    const volume = state.volume ?? 100;
    const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
      <rect width="144" height="144" rx="20" fill="#1a1a2e"/>
      <circle cx="72" cy="64" r="35" fill="#e74c3c" opacity="0.9"/>
      <text x="72" y="76" text-anchor="middle" fill="white" font-size="44" font-family="Arial" font-weight="bold">-</text>
      <text x="72" y="128" text-anchor="middle" fill="#e74c3c" font-size="18" font-family="Arial">${volume}%</text>
    </svg>`;
    action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    action.setTitle("");
  }
}
