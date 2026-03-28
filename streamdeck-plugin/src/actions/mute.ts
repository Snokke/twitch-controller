import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";
import { getAvatarBase64 } from "../avatar-cache";

@action({ UUID: "com.snake.twitch-controller.mute" })
export class MuteAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("mute");
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
      action.setImage("imgs/actions/mute/key");
      action.setTitle("");
      return;
    }

    const muted = state.muted ?? false;
    const avatarData = await getAvatarBase64(state.avatar ?? "");

    if (avatarData) {
      const color = muted ? "#e74c3c" : "#2ecc71";
      const label = muted ? "MUTED" : "ON";
      const symbol = muted ? "M" : "\u266A";
      const svg = `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image href="${avatarData}" x="0" y="0" width="144" height="144"/>
        <rect x="0" y="94" width="144" height="50" fill="rgba(0,0,0,0.7)"/>
        <circle cx="72" cy="48" r="28" fill="${color}" opacity="0.85"/>
        <text x="72" y="56" text-anchor="middle" fill="white" font-size="24" font-family="Arial" font-weight="bold">${symbol}</text>
        <text x="72" y="126" text-anchor="middle" fill="${color}" font-size="20" font-family="Arial" font-weight="bold">${label}</text>
      </svg>`;
      action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    } else {
      action.setImage(muted ? "imgs/actions/mute/key-off" : "imgs/actions/mute/key-on");
    }
    action.setTitle("");
  }
}
