import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Folder from "@mui/icons-material/Folder";
import { crumbs, nameOf } from "../utils";
import { useDir } from "./views/dirs";

type Shared = {
  open: Set<string>;
  toggle: (p: string) => void;
  cwd: string;
  onNav: (p: string) => void;
};

function Children({
  path,
  depth,
  s,
}: {
  path: string;
  depth: number;
  s: Shared;
}) {
  const items = useDir(path); // lazy: only mounted when the parent is expanded
  if (!items)
    return (
      <Box sx={{ pl: `${depth * 14 + 26}px`, color: "#999", height: 24 }}>
        Loading…
      </Box>
    );
  return (
    <>
      {items
        .filter((c) => c.isDir)
        .map((c) => (
          <NavNode key={c.path} path={c.path} depth={depth} s={s} />
        ))}
    </>
  );
}

function NavNode({
  path,
  depth,
  s,
}: {
  path: string;
  depth: number;
  s: Shared;
}) {
  const isOpen = s.open.has(path);
  return (
    <Box>
      <Box
        onClick={() => s.onNav(path)}
        sx={{
          display: "flex",
          alignItems: "center",
          height: 26,
          pl: `${depth * 14 + 4}px`,
          cursor: "default",
          whiteSpace: "nowrap",
          bgcolor: path === s.cwd ? "#cce8ff" : "transparent",
          "&:hover": { bgcolor: path === s.cwd ? "#cce8ff" : "#e5f3ff" },
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            s.toggle(path);
          }}
          sx={{
            width: 18,
            display: "flex",
            justifyContent: "center",
            color: "#666",
          }}
        >
          {isOpen ? (
            <ExpandMore sx={{ fontSize: 16 }} />
          ) : (
            <ChevronRight sx={{ fontSize: 16 }} />
          )}
        </Box>
        <Folder sx={{ fontSize: 18, color: "#F6C74F", mr: 0.75 }} />
        {nameOf(path)}
      </Box>
      {isOpen && <Children path={path} depth={depth + 1} s={s} />}
    </Box>
  );
}

export default function NavTree({
  root,
  cwd,
  onNav,
}: {
  root: string;
  cwd: string;
  onNav: (p: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set([root]));
  useEffect(
    () =>
      setOpen((prev) => {
        const n = new Set(prev);
        crumbs(cwd).forEach((c) => n.add(c.path));
        return n;
      }),
    [cwd],
  );
  const toggle = (p: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  return (
    <Box
      sx={{
        width: 230,
        flexShrink: 0,
        overflow: "auto",
        borderRight: "1px solid #e5e5e5",
        bgcolor: "#fff",
        fontSize: 12,
        py: 0.5,
      }}
    >
      <NavNode path={root} depth={0} s={{ open, toggle, cwd, onNav }} />
    </Box>
  );
}
