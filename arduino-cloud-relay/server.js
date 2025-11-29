const WebSocket = require("ws");

const PORT = process.env.PORT || 10000; // Render 会注入 PORT

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log("WebSocket server started on port", PORT);
});

// 保存 A / B 端的连接
let clientA = null;
let clientB = null;

wss.on("connection", (ws) => {
  console.log("New client connected");

  // 先要求客户端发一条 JSON 表示自己身份
  // 例如： {"role": "A"} 或 {"role": "B"}
  ws.once("message", (msg) => {
    let info;
    try {
      info = JSON.parse(msg.toString());
    } catch (e) {
      console.log("First message is not valid JSON, closing");
      ws.close();
      return;
    }

    const role = info.role;
    if (role === "A") {
      clientA = ws;
      console.log("Client registered as A");
    } else if (role === "B") {
      clientB = ws;
      console.log("Client registered as B");
    } else {
      console.log("Unknown role:", role);
      ws.close();
      return;
    }

    // 之后的所有消息当成“数据”，转发给对方
    ws.on("message", (data) => {
      const text = data.toString().trim();
      console.log(`From ${role}:`, text);

      if (role === "A" && clientB && clientB.readyState === WebSocket.OPEN) {
        clientB.send(text);
        console.log(" → forwarded to B");
      } else if (role === "B" && clientA && clientA.readyState === WebSocket.OPEN) {
        clientA.send(text);
        console.log(" → forwarded to A");
      } else {
        console.log("No peer available to forward");
      }
    });

    ws.on("close", () => {
      console.log(`Client ${role} disconnected`);
      if (role === "A" && clientA === ws) clientA = null;
      if (role === "B" && clientB === ws) clientB = null;
    });
  });
});
