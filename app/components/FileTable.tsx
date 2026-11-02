import type { HTMLAttributes, ReactNode } from "react";
import { Box } from "@mui/material";
import { type FNode, fmtDate, fmtSize, typeLabel } from "../utils";

export type TableProps = { items: FNode[]; selected: string | null; onSelect: (p: string) => void; onOpen: (n: FNode) => void };
type Props = TableProps & {
  renderIcon: (n: FNode) => ReactNode;
  extraCol?: { label: string; render: (n: FNode) => ReactNode };
  rowProps?: (n: FNode) => HTMLAttributes<HTMLDivElement>;
};

export default function FileTable({ items, selected, onSelect, onOpen, renderIcon, extraCol, rowProps }: Props) {
  const grid = `320px 160px 120px 80px${extraCol ? " 200px" : ""}`;
  const heads = ["Name", "Date modified", "Type", "Size", ...(extraCol ? [extraCol.label] : [])];
  return (
    <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#fff", fontSize: 12 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: grid, position: "sticky", top: 0, bgcolor: "#fff", zIndex: 1, color: "#555" }}>
        {heads.map((h, i) => (
          <Box key={h} sx={{ px: 1, py: .75, borderRight: "1px solid #e5e5e5", textAlign: i === 3 ? "right" : "left" }}>{h}</Box>
        ))}
      </Box>
      {items.length === 0 && <Box sx={{ textAlign: "center", color: "#777", mt: 4 }}>This folder is empty.</Box>}
      {items.map((n) => (
        <Box key={n.path} {...rowProps?.(n)} onClick={() => onSelect(n.path)} onDoubleClick={() => onOpen(n)}
          sx={{ display: "grid", gridTemplateColumns: grid, alignItems: "center", height: 28, cursor: "default", userSelect: "none",
            bgcolor: selected === n.path ? "#cce8ff" : "transparent", "&:hover": { bgcolor: selected === n.path ? "#cce8ff" : "#e5f3ff" } }}>
          <Box sx={{ px: 1, display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
            <Box sx={{ width: 30, display: "flex", justifyContent: "center", flexShrink: 0 }}>{renderIcon(n)}</Box>
            <Box sx={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{n.name}</Box>
          </Box>
          <Box sx={{ px: 1, color: "#555" }}>{fmtDate(n.mtime)}</Box>
          <Box sx={{ px: 1, color: "#555" }}>{typeLabel(n)}</Box>
          <Box sx={{ px: 1, textAlign: "right", color: "#555" }}>{fmtSize(n)}</Box>
          {extraCol && <Box sx={{ px: 1 }}>{extraCol.render(n)}</Box>}
        </Box>
      ))}
    </Box>
  );
}
