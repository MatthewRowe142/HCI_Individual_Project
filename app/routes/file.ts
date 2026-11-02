import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  pdf: "application/pdf", txt: "text/plain; charset=utf-8",
};
// Streams a file; supports Range so video can seek and text previews can fetch only the first bytes.
export async function loader({ request }: { request: Request }) {
  const p = new URL(request.url).searchParams.get("path") ?? "";
  let st: fs.Stats;
  try { st = fs.statSync(p); } catch { throw new Response("Not found", { status: 404 }); }
  if (st.isDirectory()) throw new Response("Not found", { status: 404 });
  const type = MIME[path.extname(p).slice(1).toLowerCase()] ?? "application/octet-stream";
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get("range") ?? "");
  if (m) {
    const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    return new Response(Readable.toWeb(fs.createReadStream(p, { start, end })) as any, {
      status: 206,
      headers: { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(p)) as any, {
    headers: { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": String(st.size) },
  });
}
