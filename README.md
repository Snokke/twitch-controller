# Twitch Controller

Chrome extension + local server + Stream Deck plugin for controlling Twitch tabs globally from any application.

## Features

- Mute / unmute (player-level, not tab-level)
- Play / pause stream
- Cycle through Twitch tabs
- Toggle chat panel
- Toggle theater mode
- Volume up / down (10% steps)
- Close current / all Twitch tabs
- Dynamic Stream Deck icons with channel avatar and state
- Works globally — Chrome doesn't need to be in focus

## Structure

```
twitch-controller/
  extension/              # Chrome extension (Manifest V3)
  server/                 # Local Node.js server
  streamdeck-plugin/      # Stream Deck plugin (TypeScript)
    src/                  # Plugin source code
    com.snake.twitch-controller.sdPlugin/  # Built plugin
  docs/                   # Documentation and plans
  start-server.bat        # Start server (with console, for debugging)
  start-server-hidden.vbs # Start server silently (for everyday use)
  stop-server.bat         # Stop server
```

## Requirements

- [Node.js](https://nodejs.org/) v20+
- Google Chrome
- Elgato Stream Deck + Stream Deck software 6.5+

## Setup

### 1. Install server dependencies

```bash
cd server
npm install
```

### 2. Install Chrome extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

### 3. Install Stream Deck plugin

The plugin is already linked via junction. If you need to re-link:

```powershell
# Run in PowerShell
New-Item -ItemType Junction -Path "$env:APPDATA\Elgato\StreamDeck\Plugins\com.snake.twitch-controller.sdPlugin" -Target "<full path to>\streamdeck-plugin\com.snake.twitch-controller.sdPlugin"
```

Then restart Stream Deck.

### 4. Configure keyboard shortcuts (optional)

Go to `chrome://extensions/shortcuts` and assign shortcuts for mute, pause, and next tab.

## Running

**Start the server** (do this once, e.g. on system startup):

- `start-server-hidden.vbs` — runs silently in the background
- `start-server.bat` — runs with a console window (useful for debugging)

**Stop the server:**

- `stop-server.bat`

**Auto-start on Windows login:**

1. Press `Win+R`, type `shell:startup`, press Enter
2. Put a shortcut to `start-server-hidden.vbs` in that folder

## Stream Deck Actions

| Action       | Command      | Description                     |
|-------------|-------------|----------------------------------|
| Mute        | `mute`       | Toggle mute in Twitch player     |
| Play/Pause  | `pause`      | Toggle play/pause                |
| Next        | `next`       | Switch to next Twitch tab        |
| Chat        | `chat`       | Show/hide chat panel             |
| Theater     | `theater`    | Toggle theater mode              |
| Volume Up   | `volumeup`   | Increase volume by 10%           |
| Volume Down | `volumedown` | Decrease volume by 10%           |
| Close Tab   | `close`      | Close current Twitch tab         |
| Close All   | `closeall`   | Close all Twitch tabs            |

## HTTP API

Commands can also be triggered via HTTP:

```
http://127.0.0.1:9999/mute
http://127.0.0.1:9999/pause
http://127.0.0.1:9999/next
http://127.0.0.1:9999/chat
http://127.0.0.1:9999/theater
http://127.0.0.1:9999/volumeup
http://127.0.0.1:9999/volumedown
http://127.0.0.1:9999/close
http://127.0.0.1:9999/closeall
```

## How it works

```
Stream Deck Plugin ─┐
                    ├─ WebSocket (port 9998) ─→ Chrome Extension ─→ Twitch tab
HTTP / curl ────────┘        ↑
                             │
                     Node.js Server
                    HTTP (port 9999)
```

The server routes commands to the Chrome extension and forwards state updates (muted, paused, volume, channel, avatar) back to the Stream Deck plugin for dynamic icon updates.

## Building the plugin

```bash
cd streamdeck-plugin
npm install
npm run build
```
