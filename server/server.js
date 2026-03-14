const http = require("http");
const { WebSocketServer } = require("ws");

const HTTP_PORT = 9999;
const WS_PORT = 9998;

const clients = new Set();

// WebSocket server — extension connects here
const wss = new WebSocketServer({ port: WS_PORT });
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`Extension connected (total: ${clients.size})`);
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`Extension disconnected (total: ${clients.size})`);
  });
});

function broadcast(cmd) {
  for (const client of clients) {
    client.send(cmd);
  }
}

// HTTP server — bat files hit this
http
  .createServer((req, res) => {
    const cmd = req.url.slice(1); // /mute → "mute", /pause → "pause"

    if (cmd === "mute" || cmd === "pause" || cmd === "next") {
      broadcast(cmd);
      res.writeHead(200);
      res.end("ok");
      console.log(`Command sent: ${cmd} (to ${clients.size} client(s))`);
    } else {
      res.writeHead(404);
      res.end("Unknown command. Use /mute, /pause or /next");
    }
  })
  .listen(HTTP_PORT, "127.0.0.1");

console.log(`HTTP  listening on http://127.0.0.1:${HTTP_PORT}`);
console.log(`WS    listening on ws://127.0.0.1:${WS_PORT}`);
