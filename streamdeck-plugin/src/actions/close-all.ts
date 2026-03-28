import { action, SingletonAction } from "@elgato/streamdeck";
import { TwitchConnection } from "../twitch-connection";

@action({ UUID: "com.snake.twitch-controller.closeall" })
export class CloseAllAction extends SingletonAction {
  private conn: TwitchConnection;

  constructor(conn: TwitchConnection) {
    super();
    this.conn = conn;
  }

  override async onKeyDown(): Promise<void> {
    this.conn.send("closeall");
  }
}
