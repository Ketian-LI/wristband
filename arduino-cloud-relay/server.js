// server.js
// HTTP + WebSocket server
// - GET /        -> serve index.html (dashboard)
// - WS  /ws      -> relay messages between all connected clients

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

// Preload index.html
const indexPath = path.join(__dirname, "index.html");
let indexHtml = "index.html not found";

try {
  indexHtml = fs.readFileSync(indexPath, "utf8");
  console.log("✅ Loaded index.html");
} catch (e) {
  console.error("❌ Failed to load index.html:", e.message);
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } else if (req.url.startsWith("/favicon")) {
    // simple favicon handling
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

// WebSocket server on the same HTTP server, path /ws
const wss = new WebSocket.Server({ server, path: "/ws" });

// Track all clients (Python, web pages, etc.)
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  clients.add(ws);

  ws.on("message", (msg) => {
    const text = msg.toString();
    console.log("📨 Incoming:", text);

    // Broadcast to all other clients (including web dashboard)
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log("🌐 HTTP + WS server running on port", PORT);
});
