import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";

@action({ UUID: "com.snake.twitch-controller.chat" })
export class ChatAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("chat");
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
      action.setImage("imgs/actions/chat/key");
      action.setTitle("");
      return;
    }
    const chatOpen = state.chat ?? true;
    action.setImage(chatOpen ? "imgs/actions/chat/key-on" : "imgs/actions/chat/key-off");
    action.setTitle("");
  }
}
