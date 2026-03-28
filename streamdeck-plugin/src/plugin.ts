import streamDeck from "@elgato/streamdeck";
import { TwitchConnection } from "./twitch-connection";
import { MuteAction } from "./actions/mute";
import { PauseAction } from "./actions/pause";
import { NextAction } from "./actions/next";
import { ChatAction } from "./actions/chat";
import { TheaterAction } from "./actions/theater";
import { VolumeUpAction } from "./actions/volume-up";
import { VolumeDownAction } from "./actions/volume-down";
import { CloseAction } from "./actions/close";
import { CloseAllAction } from "./actions/close-all";

streamDeck.logger.setLevel("debug");

const conn = new TwitchConnection("ws://127.0.0.1:9998");

streamDeck.actions.registerAction(new MuteAction(conn));
streamDeck.actions.registerAction(new PauseAction(conn));
streamDeck.actions.registerAction(new NextAction(conn));
streamDeck.actions.registerAction(new ChatAction(conn));
streamDeck.actions.registerAction(new TheaterAction(conn));
streamDeck.actions.registerAction(new VolumeUpAction(conn));
streamDeck.actions.registerAction(new VolumeDownAction(conn));
streamDeck.actions.registerAction(new CloseAction(conn));
streamDeck.actions.registerAction(new CloseAllAction(conn));

// Reconnect when system wakes from sleep
streamDeck.system.onSystemDidWakeUp(() => {
  conn.reconnect();
});

streamDeck.connect();
