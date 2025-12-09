// server.js
// HTTP + WebSocket 服务器：
// - GET /        -> 返回漂亮的实时仪表盘网页
// - WS  /ws      -> 接收来自 Python / 其他端的数据，并广播给所有连接的客户端（包括网页）

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

// 预先读取 index.html
const indexPath = path.join(__dirname, "index.html");
let indexHtml = "index.html not found";

try {
  indexHtml = fs.readFileSync(indexPath, "utf8");
  console.log("Loaded index.html");
} catch (e) {
  console.error("❌ Failed to load index.html:", e.message);
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } else if (req.url.startsWith("/favicon")) {
    // 简单处理 favicon
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

// 在同一个 HTTP server 上挂 WebSocket，路径 /ws
const wss = new WebSocket.Server({ server, path: "/ws" });

// 保存所有连接中的客户端（包括 Python、网页等）
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  clients.add(ws);

  ws.on("message", (msg) => {
    const text = msg.toString();
    console.log("📨 Incoming:", text);

    // 把收到的消息广播给所有其他客户端（包括网页）
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
