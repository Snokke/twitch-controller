# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension + local Node.js server + Stream Deck plugin that enables controlling Twitch tabs globally without Chrome needing to be in focus.

## Commands

### Server
```bash
cd server && npm install   # Install dependencies
cd server && npm start     # Start server (node server.js)
```

### Stream Deck Plugin
```bash
cd streamdeck-plugin && npm install   # Install dependencies
cd streamdeck-plugin && npm run build  # Build plugin (rollup + TypeScript)
cd streamdeck-plugin && npm run deploy # Build + copy to Stream Deck plugins folder
```

### Windows Scripts
- `start-server-hidden.vbs` — Start server silently in background
- `start-server.bat` — Start server with visible console (for debugging)
- `stop-server.bat` — Kill server process

There is no test suite or linter.

## Architecture

**Communication flow:**
```
Stream Deck Plugin ─┐
                    ├─ WebSocket (port 9998) ─→ Chrome Extension ─→ Twitch tab
HTTP / curl ────────┘        ↑
                     Node.js Server
                    HTTP (port 9999)
```

**Four layers:**

1. **Node.js server** (`server/server.js`) — Runs two servers:
   - HTTP on port 9999: accepts `GET /mute`, `/pause`, `/next`, `/chat`, `/theater`, `/volumeup`, `/volumedown`, `/close`, `/closeall`
   - WebSocket on port 9998: routes commands to extensions, forwards state to Stream Deck plugins
   - Distinguishes clients by role (`extension` / `streamdeck`) via registration message

2. **Chrome extension** (`extension/background.js`) — Manifest V3 service worker that:
   - Maintains a WebSocket connection to the server (auto-reconnects every 3s)
   - Registers as `extension` on connect
   - Handles commands by clicking native Twitch UI buttons via `chrome.scripting.executeScript`
   - Reports state back to server (muted, paused, volume, channel, avatar, chat, theater)
   - State sent after every command + periodically every 5 seconds

3. **Stream Deck plugin** (`streamdeck-plugin/`) — TypeScript, `@elgato/streamdeck` SDK v2:
   - 9 actions: mute, pause, next, chat, theater, volume up/down, close, close all
   - WebSocket client to server (port 9998), registers as `streamdeck`
   - Dynamic SVG icons reflecting current state
   - Mute and Pause buttons show channel avatar as background
   - Built with Rollup, output in `com.snake.twitch-controller.sdPlugin/`
   - Deployed via `npm run deploy` (copies files to `%APPDATA%\Elgato\StreamDeck\Plugins\`)

4. **HTTP API** — All commands available as `GET /command` on port 9999 for external tools (AutoHotkey, curl, etc.)

## WebSocket Protocol

- Registration: `{ "type": "register", "role": "extension" | "streamdeck" }`
- Command: `{ "type": "command", "command": "mute" }`
- State: `{ "type": "state", "active": true, "muted": false, "paused": false, "channel": "...", "chat": true, "theater": false, "volume": 80, "avatar": "https://..." }`

## Key Details

- Both servers bind to `127.0.0.1` only (localhost-only, no external exposure)
- Extension sorts Twitch tabs by windowId then index for consistent cycling
- Mute/pause use native Twitch player buttons (`data-a-target`), not `chrome.tabs.update`
- Theater mode uses `aria-label*="Theatre"` selector (not `data-a-target`, which is broken)
- Fullscreen was removed — Chrome blocks programmatic fullscreen without a real user gesture
- `sharp` in the root `package.json` is only used for icon image processing (not runtime)
- Extension host permissions are scoped to `*://*.twitch.tv/*`
- Loading the extension: Chrome → `chrome://extensions/` → Developer Mode → Load unpacked → select `extension/` folder
- Keyboard shortcuts configurable at `chrome://extensions/shortcuts`
