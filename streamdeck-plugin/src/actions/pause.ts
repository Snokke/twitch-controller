import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";
import { getAvatarBase64 } from "../avatar-cache";

@action({ UUID: "com.snake.twitch-controller.pause" })
export class PauseAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("pause");
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

  private async setIcon(action: any, state: TwitchState) {
    if (!state.active) {
      action.setImage("imgs/actions/pause/key");
      action.setTitle("");
      return;
    }

    const paused = state.paused ?? false;
    const avatarData = await getAvatarBase64(state.avatar ?? "");

    if (avatarData) {
      const color = paused ? "#e67e22" : "#2ecc71";
      const symbol = paused ? "\u275A\u275A" : "\u25B6";
      const label = paused ? "PAUSED" : "LIVE";
      const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image href="${avatarData}" x="0" y="0" width="144" height="144"/>
        <rect x="0" y="94" width="144" height="50" fill="rgba(0,0,0,0.7)"/>
        <circle cx="72" cy="48" r="28" fill="${color}" opacity="0.85"/>
        <text x="72" y="58" text-anchor="middle" fill="white" font-size="26" font-family="Arial" font-weight="bold">${symbol}</text>
        <text x="72" y="126" text-anchor="middle" fill="${color}" font-size="20" font-family="Arial" font-weight="bold">${label}</text>
      </svg>`;
      action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    } else {
      action.setImage(paused ? "imgs/actions/pause/key-off" : "imgs/actions/pause/key-on");
    }
    action.setTitle("");
  }
}
