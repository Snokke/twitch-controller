const http = require("http");
const { WebSocketServer } = require("ws");

const HTTP_PORT = 9999;
const WS_PORT = 9998;

const VALID_COMMANDS = ["mute", "pause", "next", "chat", "theater", "volumeup", "volumedown", "close", "closeall"];

// Clients grouped by role
const extensions = new Set();
const streamdecks = new Set();

// Last known state from the extension
let lastState = null;

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection, waiting for registration...");

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      // Legacy plain-text command (from old extension versions)
      return;
    }

    // Registration message
    if (msg.type === "register") {
      if (msg.role === "extension") {
        extensions.add(ws);
        console.log(`Extension registered (total: ${extensions.size})`);
        // Send last state request so extension reports current state
        ws.send(JSON.stringify({ type: "command", command: "getState" }));
      } else if (msg.role === "streamdeck") {
        streamdecks.add(ws);
        console.log(`Stream Deck registered (total: ${streamdecks.size})`);
        // Send last known state to the newly connected plugin
        if (lastState) {
          ws.send(JSON.stringify(lastState));
        }
      }
      return;
    }

    // Command from Stream Deck plugin → forward to extensions
    if (msg.type === "command" && VALID_COMMANDS.includes(msg.command)) {
      console.log(`Command from Stream Deck: ${msg.command} (to ${extensions.size} extension(s))`);
      for (const ext of extensions) {
        ext.send(JSON.stringify({ type: "command", command: msg.command }));
      }
      return;
    }

    // State update from extension → store and forward to Stream Deck plugins
    if (msg.type === "state") {
      lastState = msg;
      for (const sd of streamdecks) {
        sd.send(JSON.stringify(msg));
      }
      return;
    }
  });

  ws.on("close", () => {
    if (extensions.delete(ws)) {
      console.log(`Extension disconnected (total: ${extensions.size})`);
    }
    if (streamdecks.delete(ws)) {
      console.log(`Stream Deck disconnected (total: ${streamdecks.size})`);
    }
  });
});

// Broadcast command to all extensions (used by HTTP endpoints)
function broadcastCommand(cmd) {
  const msg = JSON.stringify({ type: "command", command: cmd });
  for (const ext of extensions) {
    ext.send(msg);
  }
}

// HTTP server — bat/vbs scripts and direct calls
http
  .createServer((req, res) => {
    const cmd = req.url.slice(1); // /mute → "mute"

    if (VALID_COMMANDS.includes(cmd)) {
      broadcastCommand(cmd);
      res.writeHead(200);
      res.end("ok");
      console.log(`HTTP command: ${cmd} (to ${extensions.size} extension(s))`);
    } else {
      res.writeHead(404);
      res.end(`Unknown command. Use: /${VALID_COMMANDS.join(", /")}`);
    }
  })
  .listen(HTTP_PORT, "127.0.0.1");

console.log(`HTTP  listening on http://127.0.0.1:${HTTP_PORT}`);
console.log(`WS    listening on ws://127.0.0.1:${WS_PORT}`);
