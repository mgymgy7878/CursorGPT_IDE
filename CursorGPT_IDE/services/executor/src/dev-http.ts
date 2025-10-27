import { createServer } from "http";
const port = Number(process.env.PORT_EXECUTOR ?? 4001);
const srv = createServer((req, res) => {
  if (req.url === "/health") {
    const body = JSON.stringify({ ok: true, service: "executor:http", ts: new Date().toISOString() });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(body);
    return;
  }
  res.statusCode = 404;
  res.end("not found");
});
srv.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`[dev-http] listening on ${port}`);
});
