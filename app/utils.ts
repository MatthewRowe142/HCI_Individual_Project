export type FNode = {
  name: string; path: string; ext: string; size: number; isDir: boolean;
  mtime: number; ctime: number; atime: number;
};
export type Kind = "visual" | "document" | "code" | "other";
export type TrailItem = { type: "folder" | "search" | "file"; label: string; path: string };

const V = "jpg jpeg png gif webp svg bmp mp4 mov avi mkv webm mp3 wav".split(" ");
const D = "pdf doc docx txt md rtf xls xlsx ppt pptx csv".split(" ");
const C = "tsx ts js jsx java c cpp h py css html json go rs cs rb php sh yml yaml xml sql".split(" ");
export const kindOf = (ext: string): Kind =>
  V.includes(ext) ? "visual" : D.includes(ext) ? "document" : C.includes(ext) ? "code" : "other";
export const KIND_COLOR: Record<Kind, string> = { visual: "#2E9E6B", document: "#2F6FDE", code: "#8E44AD", other: "#9AA0A6" };
export const IMG = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
export const VID = ["mp4", "webm", "mov"];
export const isText = (ext: string) => C.includes(ext) || ["txt", "md", "csv", "log", "ini"].includes(ext);

export const fileUrl = (p: string) => "/api/file?path=" + encodeURIComponent(p);
export const fmtSize = (n: FNode) => (n.isDir ? "" : Math.max(1, Math.ceil(n.size / 1024)).toLocaleString() + " KB");
export const fmtDate = (t: number) =>
  new Date(t).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", "");
export const typeLabel = (n: FNode) => (n.isDir ? "File folder" : n.ext ? `${n.ext.toUpperCase()} File` : "File");

export function countKinds(items: FNode[]) {
  const acc: Record<Kind, number> = { visual: 0, document: 0, code: 0, other: 0 };
  for (const c of items) if (!c.isDir) acc[kindOf(c.ext)]++;
  return acc;
}

// Paths always use "/" ("C:/Users/me", "/Users/me"). Roots are "C:/" or "/".
export const isRoot = (p: string) => p === "/" || /^[A-Za-z]:\/$/.test(p);
export const parentOf = (p: string) => {
  if (isRoot(p)) return p;
  const par = p.slice(0, p.lastIndexOf("/"));
  return par === "" ? "/" : /^[A-Za-z]:$/.test(par) ? par + "/" : par;
};
export const nameOf = (p: string) =>
  isRoot(p) ? (p === "/" ? "Macintosh HD" : `Local Disk (${p.slice(0, 2)})`) : p.slice(p.lastIndexOf("/") + 1);
export const crumbs = (p: string) => {
  const out: { label: string; path: string }[] = [];
  for (let c = p; ; c = parentOf(c)) { out.unshift({ label: nameOf(c), path: c }); if (isRoot(c)) break; }
  return out;
};
