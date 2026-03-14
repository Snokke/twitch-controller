# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension + local Node.js server that enables controlling Twitch tabs globally from any application (Steam Deck buttons, AutoHotkey, etc.) without Chrome needing to be in focus.

## Commands

### Server
```bash
cd server && npm install   # Install dependencies
cd server && npm start     # Start server (node server.js)
```

### Windows Scripts
- `start-server-hidden.vbs` — Start server silently in background
- `start-server.bat` — Start server with visible console (for debugging)
- `stop-server.bat` — Kill server process

There is no build step, test suite, or linter.

## Architecture

**Communication flow:**
```
VBS/BAT scripts → curl → HTTP Server (port 9999) → WebSocket (port 9998) → Chrome Extension → Chrome Tabs API → Twitch tab
```

**Three layers:**

1. **Control scripts** (`mute.vbs`, `pause.vbs`, `next.vbs`) — Windows scripts that silently fire `curl` requests to the HTTP server. Batch variants (`.bat`) also exist.

2. **Node.js server** (`server/server.js`) — Runs two servers:
   - HTTP on port 9999: accepts `GET /mute`, `/pause`, `/next`
   - WebSocket on port 9998: broadcasts commands to all connected extension instances

3. **Chrome extension** (`extension/background.js`) — Manifest V3 service worker that:
   - Maintains a WebSocket connection to the server (auto-reconnects every 3s on disconnect)
   - Responds to WebSocket messages OR Chrome keyboard shortcuts
   - Uses `chrome.tabs` API to find/cycle Twitch tabs and `chrome.scripting.executeScript` for video control

## Key Details

- Both servers bind to `127.0.0.1` only (localhost-only, no external exposure)
- Extension sorts Twitch tabs by windowId then index for consistent cycling
- `sharp` in the root `package.json` is only used for icon image processing (not runtime)
- Extension host permissions are scoped to `*://*.twitch.tv/*`
- Loading the extension: Chrome → `chrome://extensions/` → Developer Mode → Load unpacked → select `extension/` folder
- Keyboard shortcuts configurable at `chrome://extensions/shortcuts`
