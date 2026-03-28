import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { TwitchConnection, TwitchState } from "../twitch-connection";

@action({ UUID: "com.snake.twitch-controller.theater" })
export class TheaterAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
    this.conn.onState((state) => this.updateAll(state));
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("theater");
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
      action.setImage("imgs/actions/theater/key");
      action.setTitle("");
      return;
    }
    const theaterOn = state.theater ?? false;
    action.setImage(theaterOn ? "imgs/actions/theater/key-on" : "imgs/actions/theater/key-off");
    action.setTitle("");
  }
}
