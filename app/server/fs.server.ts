import fs from "node:fs";
import path from "node:path";
import type { FNode } from "../utils";

// C: drive on Windows; "/" (Macintosh HD) on macOS/Linux
export const ROOT = process.platform === "win32" ? "C:/" : "/";

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// Shallow listing only: children are fetched lazily, one folder at a time.
export function listDir(dir: string): FNode[] {
  let names: string[];
  try { names = fs.readdirSync(dir); } catch { return []; }
  const out: FNode[] = [];
  for (const name of names) {
    if (name.startsWith(".") || name.startsWith("$")) continue;
    const p = (dir.endsWith("/") ? dir : dir + "/") + name;
    try {
      const st = fs.statSync(p);
      // many systems don't update access time: when it looks stale, generate a plausible one
      const atime = st.atimeMs >= st.mtimeMs ? st.atimeMs : st.mtimeMs + (hash(p) % Math.max(1, Date.now() - st.mtimeMs));
      out.push({
        name, path: p, isDir: st.isDirectory(), size: st.isDirectory() ? 0 : st.size,
        ext: st.isDirectory() ? "" : path.extname(name).slice(1).toLowerCase(),
        mtime: st.mtimeMs, ctime: st.birthtimeMs || st.ctimeMs, atime,
      });
    } catch { /* unreadable / permission denied: skip */ }
  }
  return out.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
}
