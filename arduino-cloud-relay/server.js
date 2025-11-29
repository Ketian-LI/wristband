// 组合 HTTP + WebSocket，适合 Render 这类 PaaS
const http = require("http");
const WebSocket = require("ws");

// Render 会注入 PORT 环境变量
const PORT = process.env.PORT || 10000;

// 建一个 HTTP 服务器（给 Render 健康检查 & 浏览器访问）
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WS relay alive\n");
  } else {
    res.writeHead(404);
    res.end();
  }
});

// 在同一个 HTTP server 上挂 WebSocket，路径用 /ws
const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  ws.on("message", (msg) => {
    const text = msg.toString();
    console.log("Received:", text);

    // 临时做回声，先测试连通；之后你可以改成转发给另一端
    ws.send("Echo: " + text);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// 监听 HTTP+WS
server.listen(PORT, () => {
  console.log("HTTP + WebSocket server running on", PORT);
});
