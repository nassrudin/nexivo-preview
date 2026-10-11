import { resolve } from "node:path";
import express from "express";
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
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const server = app.listen(port, host, () =>
  console.log(`NEXIVO ready at ${appUrl}`),
);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
function close() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
