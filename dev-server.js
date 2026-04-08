// Minimal static dev server that sends Cache-Control and gzips text responses
// on the fly. Exists purely so localhost Lighthouse runs can hit 100/100 —
// production uses Netlify's compression + netlify.toml cache headers.
//
// Usage: node dev-server.js [port]
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(zlib.gzip);
const ROOT = path.resolve(".");
const PORT = Number(process.argv[2]) || 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".woff2":"font/woff2",
  ".webmanifest": "application/manifest+json",
};
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".webmanifest"]);

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname));
    if ((await fs.stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }

    const ext = path.extname(filePath).toLowerCase();
    const body = await fs.readFile(filePath);
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "Vary": "Accept-Encoding",
    };

    const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    if (acceptsGzip && COMPRESSIBLE.has(ext)) {
      const gz = await gzip(body);
      headers["Content-Encoding"] = "gzip";
      headers["Content-Length"] = gz.length;
      res.writeHead(200, headers).end(gz);
    } else {
      headers["Content-Length"] = body.length;
      res.writeHead(200, headers).end(body);
    }
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 500).end();
  }
}).listen(PORT, () => console.log(`dev-server → http://localhost:${PORT}`));
