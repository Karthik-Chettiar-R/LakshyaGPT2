const http = require("node:http");
const next = require("next");
const { createWebSocketServer } = require("./server/websocket");
const { dev, hostname, port } = require("./server/config");

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((request, response) => handle(request, response));
  createWebSocketServer({
    server,
    nextUpgradeHandler: app.getUpgradeHandler(),
    hostname,
    port,
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
