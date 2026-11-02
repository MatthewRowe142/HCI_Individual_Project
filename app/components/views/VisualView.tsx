import { Box } from "@mui/material";
import FileTable, { type TableProps } from "../FileTable";
import { OnVisible, useDir } from "./dirs";
import {
  type FNode,
  type Kind,
  KIND_COLOR,
  countKinds,
  kindOf,
} from "../../utils";

const KINDS: Kind[] = ["visual", "document", "code", "other"];
const LABEL: Record<Kind, string> = {
  visual: "Visual",
  document: "Document",
  code: "Code",
  other: "Other",
};

// Each kind has a unique silhouette: circle / page / hexagon / diamond
export function Shape({ kind, size }: { kind: Kind; size: number }) {
  const s = {
    fill: KIND_COLOR[kind],
    stroke: "rgba(0,0,0,.35)",
    strokeWidth: 1,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {kind === "visual" && <circle cx="12" cy="12" r="10.5" {...s} />}
      {kind === "document" && (
        <rect x="4" y="1.5" width="16" height="21" rx="2.5" {...s} />
      )}
      {kind === "code" && (
        <polygon points="12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7" {...s} />
      )}
      {kind === "other" && (
        <polygon points="12,1.5 22.5,12 12,22.5 1.5,12" {...s} />
      )}
    </svg>
  );
}

function FolderSvg({
  n,
  counts,
  size,
}: {
  n: FNode;
  counts: Record<Kind, number> | null;
  size: number;
}) {
  const total = counts ? KINDS.reduce((a, k) => a + counts[k], 0) : 0;
  const stops: { o: number; c: string }[] = [];
  let acc = 0;
  if (!counts || !total)
    stops.push({ o: 0, c: "#E8E8E8" }, { o: 100, c: "#E8E8E8" });
  else
    for (const k of KINDS) {
      if (!counts[k]) continue;
      stops.push({ o: acc, c: KIND_COLOR[k] });
      acc += (counts[k] / total) * 100;
      stops.push({ o: acc, c: KIND_COLOR[k] });
    }
  const id = "g" + n.path.replace(/\W/g, "_");
  return (
    <svg width={size * 1.3} height={size} viewBox="0 0 32 24">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          {stops.map((s, i) => (
            <stop key={i} offset={`${s.o}%`} stopColor={s.c} />
          ))}
        </linearGradient>
      </defs>
      <path
        d="M1.5 3h10l3 3.5h16v15.5h-29z"
        fill={`url(#${id})`}
        stroke="rgba(0,0,0,.45)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
// Reads only the folder's direct files (lazy); subfolders aren't scanned.
function FolderGlyph({ n }: { n: FNode }) {
  const items = useDir(n.path);
  return (
    <FolderSvg
      n={n}
      counts={items ? countKinds(items) : null}
      size={16 + Math.min(8, Math.round(Math.log2((items?.length ?? 0) + 1)))}
    />
  );
}
function Contents({ n }: { n: FNode }) {
  const items = useDir(n.path);
  if (!items) return null;
  const c = countKinds(items);
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {KINDS.filter((k) => c[k]).map((k) => (
        <Box key={k} sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Shape kind={k} size={11} />
          {c[k]}
        </Box>
      ))}
    </Box>
  );
}

export default function VisualView(p: TableProps) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          px: 1.5,
          py: 0.75,
          borderBottom: "1px solid #eee",
          alignItems: "center",
          color: "#555",
        }}
      >
        Legend:
        {KINDS.map((k) => (
          <Box key={k} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Shape kind={k} size={14} />
            {LABEL[k]}
          </Box>
        ))}
        <Box sx={{ ml: "auto" }}>
          Icon size = file size · Folder fill = share of files inside
        </Box>
      </Box>
      <FileTable
        {...p}
        renderIcon={(n) =>
          n.isDir ? (
            <OnVisible fallback={<FolderSvg n={n} counts={null} size={16} />}>
              <FolderGlyph n={n} />
            </OnVisible>
          ) : (
            <Shape
              kind={kindOf(n.ext)}
              size={12 + 16 * Math.min(1, Math.log10(n.size + 1) / 8)}
            />
          )
        }
        extraCol={{
          label: "Contents",
          render: (n) =>
            n.isDir ? (
              <OnVisible>
                <Contents n={n} />
              </OnVisible>
            ) : null,
        }}
      />
    </>
  );
}
