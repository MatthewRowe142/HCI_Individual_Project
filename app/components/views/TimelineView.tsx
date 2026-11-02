import { useEffect, useMemo, useState } from "react";
import { Box, Chip, TextField } from "@mui/material";
import {
  type FNode,
  type TrailItem,
  KIND_COLOR,
  crumbs,
  fmtDate,
  fmtSize,
  kindOf,
} from "../../utils";
import { useDirs } from "./dirs";

type P = {
  root: string;
  cwd: string;
  trail: TrailItem[];
  query: string;
  selected: string | null;
  onNav: (p: string) => void;
  onSearch: (q: string) => void;
  onOpen: (n: FNode) => void;
  onSelect: (p: string) => void;
};
type Row =
  | { n: FNode; depth: number }
  | { more: number; path: string; depth: number };
const ROW = 26,
  L = 330,
  W = 1150,
  CAP = 100,
  MUTED = "#b5b5b5",
  FOLDER = "#D79B00";

// Rows are a collapsible outline (lazy-loaded). Each row plots created ○ → modified ● with a ▾ at last accessed.
// Folders you've already looked through (visited / expanded) fade out, so bright rows = still unexplored.
export default function TimelineView({
  root,
  cwd,
  trail,
  query,
  selected,
  onNav,
  onSearch,
  onOpen,
  onSelect,
}: P) {
  const { cache, ensure } = useDirs();
  const [q, setQ] = useState(query);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root]));
  const [showAll, setShowAll] = useState<Set<string>>(new Set());

  useEffect(
    () =>
      setExpanded((s) => {
        const n = new Set(s);
        crumbs(cwd).forEach((c) => n.add(c.path));
        return n;
      }),
    [cwd],
  );
  useEffect(() => {
    expanded.forEach(ensure);
  }, [expanded, ensure]);
  const toggle = (p: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });

  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (path: string, depth: number) => {
      const items = cache[path];
      if (!items) return;
      const lim = showAll.has(path) ? items.length : CAP;
      for (const n of items.slice(0, lim)) {
        out.push({ n, depth });
        if (n.isDir && expanded.has(n.path)) walk(n.path, depth + 1);
      }
      if (items.length > lim)
        out.push({ more: items.length - lim, path, depth });
    };
    walk(root, 0);
    return out;
  }, [cache, expanded, showAll, root]);

  let min = Infinity,
    max = -Infinity;
  for (const r of rows)
    if ("n" in r)
      for (const t of [r.n.ctime, r.n.mtime, r.n.atime]) {
        if (t < min) min = t;
        if (t > max) max = t;
      }
  if (!isFinite(min)) {
    max = Date.now();
    min = max - 864e5;
  }
  if (max - min < 864e5) {
    min -= 432e5;
    max += 432e5;
  }
  const pad = (max - min) * 0.03;
  min -= pad;
  max += pad;
  const x = (t: number) => L + ((t - min) / (max - min)) * (W - L - 20);
  const y = (i: number) => 28 + i * ROW + ROW / 2;

  const ql = query.toLowerCase();
  const match = (n: FNode) => !ql || n.name.toLowerCase().includes(ql);
  const order = [
    ...new Set(trail.filter((t) => t.type === "folder").map((t) => t.path)),
  ];
  const searched = (n: FNode) =>
    n.isDir &&
    n.path !== cwd &&
    (order.includes(n.path) || expanded.has(n.path));
  let sel: FNode | undefined;
  for (const r of rows) if ("n" in r && r.n.path === selected) sel = r.n;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderBottom: "1px solid #eee",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search expanded folders (Enter)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(q.trim())}
          sx={{ width: 260, "& input": { fontSize: 12, py: 0.75 } }}
        />
        <Box sx={{ color: "#777" }}>Trail:</Box>
        {trail.slice(-10).map((t, i, a) => (
          <Chip
            key={i}
            size="small"
            variant={i === a.length - 1 ? "filled" : "outlined"}
            label={
              (t.type === "search"
                ? "🔍 "
                : t.type === "file"
                  ? "📄 "
                  : "📁 ") + t.label
            }
            onClick={
              t.type === "folder"
                ? () => onNav(t.path)
                : t.type === "search"
                  ? () => {
                      setQ(t.label);
                      onSearch(t.label);
                    }
                  : undefined
            }
            sx={{ opacity: 0.45 + 0.55 * ((i + 1) / a.length) }}
          />
        ))}
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <svg
          width={W}
          height={rows.length * ROW + 40}
          style={{ display: "block", fontSize: 12 }}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const t = min + ((max - min) * i) / 5;
            return (
              <g key={i}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={22}
                  y2={rows.length * ROW + 30}
                  stroke="#eee"
                />
                <text x={x(t)} y={14} textAnchor="middle" fill="#666">
                  {new Date(t).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </text>
              </g>
            );
          })}
          {rows.map((r, i) => {
            const cy = y(i),
              band = (
                <rect
                  x={0}
                  y={28 + i * ROW}
                  width={W}
                  height={ROW}
                  fill={i % 2 ? "#fafafa" : "#fff"}
                />
              );
            if (!("n" in r))
              return (
                <g
                  key={"m" + r.path}
                  onClick={() => setShowAll((s) => new Set(s).add(r.path))}
                  style={{ cursor: "pointer" }}
                >
                  {band}
                  <text x={40 + r.depth * 14} y={cy + 4} fill="#0067c0">
                    … {r.more} more (click to show)
                  </text>
                </g>
              );
            const { n, depth } = r,
              m = match(n),
              mute = searched(n),
              isCwd = n.path === cwd;
            const c = mute
              ? MUTED
              : n.isDir
                ? FOLDER
                : KIND_COLOR[kindOf(n.ext)];
            const num = order.indexOf(n.path) + 1,
              lx = 28 + depth * 14;
            const name =
              n.name.length > 34 - depth * 2
                ? n.name.slice(0, 32 - depth * 2) + "…"
                : n.name;
            return (
              <g key={n.path} opacity={m ? 1 : 0.2}>
                {band}
                {isCwd && (
                  <rect
                    x={0}
                    y={28 + i * ROW}
                    width={W}
                    height={ROW}
                    fill="#cce8ff"
                    opacity={0.7}
                  />
                )}
                <g
                  onClick={() => (n.isDir ? onNav(n.path) : onSelect(n.path))}
                  onDoubleClick={() => !n.isDir && onOpen(n)}
                  style={{ cursor: "pointer" }}
                >
                  {num > 0 && num < 100 && (
                    <>
                      <circle
                        cx={12}
                        cy={cy}
                        r={7}
                        fill="#fff"
                        stroke={mute ? MUTED : "#0067c0"}
                      />
                      <text
                        x={12}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize={9}
                        fill={mute ? "#999" : "#0067c0"}
                      >
                        {num}
                      </text>
                    </>
                  )}
                  {n.isDir && (
                    <text
                      x={lx}
                      y={cy + 4}
                      fill="#666"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(n.path);
                      }}
                    >
                      {expanded.has(n.path) ? "▾" : "▸"}
                    </text>
                  )}
                  <text
                    x={lx + 14}
                    y={cy + 4}
                    fill={mute ? "#999" : "#222"}
                    fontWeight={isCwd ? 700 : 400}
                  >
                    {n.isDir ? "📁 " : ""}
                    {name}
                    <title>{n.path}</title>
                  </text>
                </g>
                <line
                  x1={x(n.ctime)}
                  x2={x(n.mtime)}
                  y1={cy}
                  y2={cy}
                  stroke={c}
                  strokeWidth={2}
                  opacity={0.55}
                />
                <circle
                  cx={x(n.ctime)}
                  cy={cy}
                  r={3.5}
                  fill="#fff"
                  stroke={c}
                  strokeWidth={1.5}
                />
                <path
                  d={`M${x(n.atime) - 4},${cy - 9} L${x(n.atime) + 4},${cy - 9} L${x(n.atime)},${cy - 3} Z`}
                  fill={mute ? MUTED : "#0067c0"}
                />
                {ql && m && (
                  <circle
                    cx={x(n.mtime)}
                    cy={cy}
                    r={10}
                    fill="none"
                    stroke="#e8710a"
                    strokeWidth={2}
                  />
                )}
                {n.isDir ? (
                  <rect
                    x={x(n.mtime) - 5}
                    y={cy - 5}
                    width={10}
                    height={10}
                    rx={2}
                    fill={c}
                  />
                ) : (
                  <circle
                    cx={x(n.mtime)}
                    cy={cy}
                    r={n.path === selected ? 7 : 5}
                    fill={c}
                    stroke={n.path === selected ? "#000" : "none"}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </Box>
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderTop: "1px solid #eee",
          color: "#555",
          minHeight: 20,
        }}
      >
        {sel ? (
          <>
            {sel.name} · created {fmtDate(sel.ctime)} · modified{" "}
            {fmtDate(sel.mtime)} · accessed {fmtDate(sel.atime)}{" "}
            {fmtSize(sel) && "· " + fmtSize(sel)}
          </>
        ) : (
          "○ created · ● modified · ▾ last accessed. Faded folders are ones you've already looked through; numbers show the order you visited them. Click ▸ to expand."
        )}
      </Box>
    </Box>
  );
}
