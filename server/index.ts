import { resolve } from "node:path";
import { createServer as createHttpServer } from "node:http";
import express from "express";
import type { ViteDevServer } from "vite";
import { createApplication } from "./app";

const production =
  process.argv.includes("--production") ||
  process.env.NODE_ENV === "production";
const preview = process.argv.includes("--preview");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const appUrl = process.env.APP_URL || `http://${host}:${port}`;
if (production && !appUrl.startsWith("https://"))
  throw new Error("Production requires an HTTPS APP_URL.");
const { app, db } = createApplication({
  databasePath: process.env.DATABASE_PATH || "./data/nexivo.sqlite",
  appUrl,
  production,
});
const server = createHttpServer(app);
let vite: ViteDevServer | undefined;
if (production || preview) {
  app.use(
    express.static(resolve("dist"), {
      index: false,
      dotfiles: "deny",
      maxAge: "1h",
    }),
  );
  app.get("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(resolve("dist/index.html"));
  });
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
server.requestTimeout = 15000;
server.headersTimeout = 10000;
let closing = false;
async function close(exitCode = 0) {
  if (closing) return;
  closing = true;
  await vite?.close();
  server.close(() => {
    db.close();
    process.exit(exitCode);
  });
}
server.once("error", (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} sudah dipakai. Jika NEXIVO sudah berjalan, buka ${appUrl}. Untuk menjalankan ulang, hentikan server sebelumnya dengan Ctrl+C.`
      : `NEXIVO tidak dapat dijalankan (${error.code || "server error"}).`,
  );
  void close(1);
});
server.listen(port, host, () => console.log(`NEXIVO ready at ${appUrl}`));
process.on("SIGTERM", () => void close());
process.on("SIGINT", () => void close());
