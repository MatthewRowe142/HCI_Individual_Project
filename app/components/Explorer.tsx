import { useState } from "react";
import { Box, IconButton, MenuItem, Select } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ChevronRight from "@mui/icons-material/ChevronRight";
import {
  type FNode,
  type TrailItem,
  crumbs,
  fileUrl,
  isRoot,
  nameOf,
  parentOf,
} from "../utils";
import { DirProvider, useDir } from "./views/dirs";
import NavTree from "./NavTree";
import BaseView from "./views/BaseView";
import VisualView from "./views/VisualView";
import PreviewView from "./views/PreviewView";
import TimelineView from "./views/TimelineView";

const VIEWS = {
  base: "Base (Windows)",
  visual: "1 · Visual encoding",
  preview: "2 · Preview & peek",
  timeline: "3 · Timeline & trail",
};

export default function Explorer({
  root,
  initial,
}: {
  root: string;
  initial: FNode[];
}) {
  return (
    <DirProvider root={root} initial={initial}>
      <Inner root={root} />
    </DirProvider>
  );
}

function Inner({ root }: { root: string }) {
  const [view, setView] = useState<keyof typeof VIEWS>("base");
  const [hist, setHist] = useState([root]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const folderItem = (p: string): TrailItem => ({
    type: "folder",
    label: nameOf(p),
    path: p,
  });
  const [trail, setTrail] = useState<TrailItem[]>([folderItem(root)]);
  const cwd = hist[idx];
  const items = useDir(cwd);
  const add = (t: TrailItem) => setTrail((p) => [...p, t]);

  const nav = (p: string) => {
    if (p === cwd) return;
    setHist((h) => [...h.slice(0, idx + 1), p]);
    setIdx((i) => i + 1);
    setSelected(null);
    add(folderItem(p));
  };
  const step = (d: number) => {
    setIdx(idx + d);
    setSelected(null);
    add(folderItem(hist[idx + d]));
  };
  const open = (n: FNode) => {
    if (n.isDir) return nav(n.path);
    window.open(fileUrl(n.path), "_blank");
    add({ type: "file", label: n.name, path: n.path });
  };
  const search = (q: string) => {
    setQuery(q);
    if (q) add({ type: "search", label: q, path: "" });
  };
  const common = {
    items: items ?? [],
    selected,
    onSelect: setSelected,
    onOpen: open,
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        color: "#1a1a1a",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          bgcolor: "#f3f3f3",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Select
          size="small"
          value={view}
          onChange={(e) => setView(e.target.value as any)}
          sx={{ minWidth: 190, bgcolor: "#fff", fontSize: 12 }}
        >
          {Object.entries(VIEWS).map(([k, v]) => (
            <MenuItem key={k} value={k} sx={{ fontSize: 12 }}>
              {v}
            </MenuItem>
          ))}
        </Select>
        <IconButton size="small" disabled={idx === 0} onClick={() => step(-1)}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          disabled={idx >= hist.length - 1}
          onClick={() => step(1)}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          disabled={isRoot(cwd)}
          onClick={() => nav(parentOf(cwd))}
        >
          <ArrowUpward fontSize="small" />
        </IconButton>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            bgcolor: "#fff",
            border: "1px solid #d1d1d1",
            borderRadius: "4px",
            px: 1,
            height: 30,
            overflow: "hidden",
          }}
        >
          {crumbs(cwd).map((c, i) => (
            <Box
              key={c.path}
              sx={{
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              {i > 0 && <ChevronRight sx={{ fontSize: 16, color: "#777" }} />}
              <Box
                onClick={() => nav(c.path)}
                sx={{
                  px: 0.5,
                  cursor: "pointer",
                  borderRadius: "3px",
                  "&:hover": { bgcolor: "#e5f3ff" },
                }}
              >
                {c.label}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        <NavTree root={root} cwd={cwd} onNav={nav} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {view === "timeline" ? (
            <TimelineView
              root={root}
              cwd={cwd}
              trail={trail}
              query={query}
              onNav={nav}
              onSearch={search}
              onOpen={open}
              selected={selected}
              onSelect={setSelected}
            />
          ) : !items ? (
            <Box sx={{ p: 3, color: "#777" }}>Loading…</Box>
          ) : view === "base" ? (
            <BaseView {...common} />
          ) : view === "visual" ? (
            <VisualView {...common} />
          ) : (
            <PreviewView {...common} />
          )}
        </Box>
      </Box>
      <Box
        sx={{ px: 1.5, py: 0.5, borderTop: "1px solid #e5e5e5", color: "#555" }}
      >
        {items?.length ?? 0} items
      </Box>
    </Box>
  );
}
