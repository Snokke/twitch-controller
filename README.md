# Twitch Controller

Chrome extension + local server for controlling Twitch tabs from any application (e.g. Steam Deck buttons, AutoHotkey, etc.)

## Features

- Toggle mute on the current Twitch tab
- Toggle pause/resume on the current Twitch tab
- Cycle through multiple Twitch tabs
- Works globally — Chrome doesn't need to be in focus

## Structure

```
twitch-mute/
  extension/        # Chrome extension
  server/           # Local Node.js server
  start-server.bat  # Start server (with console, for debugging)
  start-server.vbs  # Start server silently (for everyday use)
  stop-server.bat   # Stop server
  mute.vbs          # Send mute command
  pause.vbs         # Send pause command
  next.vbs          # Switch to next Twitch tab
```

## Requirements

- [Node.js](https://nodejs.org/) v18+
- Google Chrome

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

### 3. Configure keyboard shortcuts (optional)

Go to `chrome://extensions/shortcuts` and assign shortcuts for:
- **Toggle mute**
- **Toggle pause/resume**
- **Switch to next Twitch tab**

## Running

**Start the server** (do this once, e.g. on system startup):

- `start-server-hidden.vbs` — runs silently in the background
- `start-server.bat` — runs with a console window (useful for debugging)

**Stop the server:**

- `stop-server.bat`

**Auto-start on Windows login:**

1. Press `Win+R`, type `shell:startup`, press Enter
2. Put a shortcut to `start-server-hidden.vbs` in that folder

## Usage

Run `.vbs` files directly or bind them to buttons (e.g. Steam Deck):

| File | Action |
|------|--------|
| `mute.vbs` | Mute / unmute current Twitch tab |
| `pause.vbs` | Pause / resume current Twitch tab |
| `next.vbs` | Switch to next Twitch tab (wraps around) |

The commands can also be triggered via HTTP directly:

```
http://127.0.0.1:9999/mute
http://127.0.0.1:9999/pause
http://127.0.0.1:9999/next
```

## How it works

```
vbs file → curl → HTTP server (port 9999)
                       ↓
              WebSocket (port 9998)
                       ↓
           Chrome extension → Twitch tab
```

The extension maintains a persistent WebSocket connection to the local server and reconnects automatically if the server restarts.
