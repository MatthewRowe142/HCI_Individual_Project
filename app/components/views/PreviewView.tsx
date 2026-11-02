import { useEffect, useRef, useState } from "react";
import { Box, Paper } from "@mui/material";
import Folder from "@mui/icons-material/Folder";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import FileTable, { type TableProps } from "../FileTable";
import { useDir } from "./dirs";
import {
  type FNode,
  IMG,
  VID,
  fileUrl,
  fmtDate,
  fmtSize,
  isText,
  typeLabel,
} from "../../utils";

const icon = (n: FNode) =>
  n.isDir ? (
    <Folder sx={{ fontSize: 16, color: "#F6C74F" }} />
  ) : (
    <InsertDriveFileOutlined sx={{ fontSize: 16, color: "#777" }} />
  );
type OnItem = (c: FNode, el: HTMLElement) => void;

function useText(n: FNode) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    if (n.isDir || !isText(n.ext)) return;
    let on = true;
    fetch(fileUrl(n.path), { headers: { Range: "bytes=0-4095" } })
      .then((r) => r.text())
      .then((x) => on && setT(x))
      .catch(() => on && setT(""));
    return () => {
      on = false;
    };
  }, [n.path]);
  return t;
}

function FolderList({
  n,
  onItem,
  onItemLeave,
}: {
  n: FNode;
  onItem: OnItem;
  onItemLeave: () => void;
}) {
  const items = useDir(n.path); // lazy: loads when the popup opens
  if (!items) return <Box sx={{ color: "#777" }}>Loading…</Box>;
  if (!items.length) return <Box sx={{ color: "#777" }}>Empty folder</Box>;
  return (
    <Box sx={{ maxHeight: 260, overflow: "auto" }}>
      {items.map((c) => (
        <Box
          key={c.path}
          onMouseEnter={(e) => onItem(c, e.currentTarget)}
          onMouseLeave={onItemLeave}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            py: 0.25,
            px: 0.5,
            "&:hover": { bgcolor: "#e5f3ff" },
          }}
        >
          {icon(c)}
          <Box
            sx={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {c.name}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function Body({
  n,
  big,
  onItem,
  onItemLeave,
}: {
  n: FNode;
  big: boolean;
  onItem: OnItem;
  onItemLeave: () => void;
}) {
  const h = big ? 340 : 130,
    url = fileUrl(n.path),
    text = useText(n);
  if (n.isDir)
    return <FolderList n={n} onItem={onItem} onItemLeave={onItemLeave} />;
  if (IMG.includes(n.ext))
    return (
      <img
        src={url}
        style={{
          width: "100%",
          height: h,
          objectFit: "contain",
          background: "#f5f5f5",
        }}
      />
    );
  if (VID.includes(n.ext))
    return (
      <video
        src={url}
        controls={big}
        autoPlay
        muted
        loop={!big}
        style={{ width: "100%", height: h, background: "#000" }}
      />
    );
  if (n.ext === "pdf")
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        style={{ width: "100%", height: h, border: 0 }}
      />
    );
  if (isText(n.ext))
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1,
          bgcolor: "#f7f7f7",
          fontFamily: "Consolas, monospace",
          fontSize: 11,
          height: h,
          overflow: big ? "auto" : "hidden",
          whiteSpace: "pre-wrap",
        }}
      >
        {text === null
          ? "Loading…"
          : big
            ? text
            : text.split("\n").slice(0, 9).join("\n")}
      </Box>
    );
  return (
    <Box
      sx={{
        height: h / 2,
        display: "grid",
        placeItems: "center",
        color: "#777",
        bgcolor: "#f7f7f7",
      }}
    >
      No preview available
    </Box>
  );
}

type Pop = { n: FNode; dy: number };

export default function PreviewView(p: TableProps) {
  const [stack, setStack] = useState<Pop[]>([]);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const [big, setBig] = useState(false);
  const t = useRef<Record<string, any>>({});
  const box = useRef<HTMLDivElement>(null);
  const stop = (k: string) => clearTimeout(t.current[k]);
  const closeAll = () => {
    t.current.hide = setTimeout(() => {
      setStack([]);
      setBig(false);
    }, 250);
  };

  // hovering an item inside popup `level` opens a child popup beside it; earlier popups shrink
  const openChild = (level: number, n: FNode, el: HTMLElement) => {
    stop("child");
    const dy =
      el.getBoundingClientRect().top -
      (box.current?.getBoundingClientRect().top ?? 0);
    t.current.child = setTimeout(() => {
      setStack((s) => [...s.slice(0, level + 1), { n, dy }]);
      setBig(false);
    }, 300);
  };

  const last = stack.length - 1;
  const totalW = stack.reduce(
    (a, _, i) => a + (i < last ? 150 : big ? 480 : 300) + 4,
    0,
  );
  const left = Math.max(8, Math.min(anchor.x, window.innerWidth - totalW - 16));
  const top = Math.max(8, Math.min(anchor.y, window.innerHeight - 380));

  return (
    <>
      <FileTable
        {...p}
        renderIcon={(n) =>
          n.isDir ? (
            <Folder sx={{ color: "#F6C74F", fontSize: 22 }} />
          ) : (
            <InsertDriveFileOutlined sx={{ color: "#6b7280", fontSize: 20 }} />
          )
        }
        rowProps={(n) => ({
          onMouseEnter: (e) => {
            stop("hide");
            stop("show");
            const r = e.currentTarget.getBoundingClientRect();
            t.current.show = setTimeout(() => {
              setAnchor({ x: r.left + 380, y: r.top });
              setStack([{ n, dy: 0 }]);
              setBig(false);
            }, 350);
          },
          onMouseLeave: () => {
            stop("show");
            closeAll();
          },
        })}
      />
      {stack.length > 0 && (
        <Box
          ref={box}
          onMouseEnter={() => stop("hide")}
          onMouseLeave={() => {
            stop("child");
            closeAll();
          }}
          sx={{
            position: "fixed",
            left,
            top,
            zIndex: 1300,
            display: "flex",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          {stack.map((pop, i) => {
            const compact = i < last,
              n = pop.n;
            return (
              <Paper
                key={n.path + i}
                elevation={compact ? 2 : 8}
                onMouseEnter={() => {
                  stop("hide");
                  if (compact)
                    t.current.back = setTimeout(
                      () => setStack((s) => s.slice(0, i + 1)),
                      120,
                    );
                  else if (!n.isDir)
                    t.current.big = setTimeout(() => setBig(true), 700);
                }}
                onMouseLeave={() => {
                  stop("back");
                  stop("big");
                }}
                sx={{
                  width: compact ? 150 : big ? 480 : 300,
                  mt: `${Math.max(0, Math.min(pop.dy, window.innerHeight - 340 - top))}px`,
                  p: compact ? 0.75 : 1.5,
                  fontSize: 12,
                  transition: "width .15s",
                  border: "1px solid #ddd",
                  overflow: "hidden",
                  flexShrink: 0,
                  bgcolor: compact ? "#f3f3f3" : "#fff",
                }}
              >
                <Box
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {icon(n)}
                  {n.name}
                </Box>
                {compact ? (
                  <Box
                    sx={{
                      color: "#0067c0",
                      fontSize: 11,
                      mt: 0.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    ↳ {stack[i + 1].n.name}
                  </Box>
                ) : (
                  <>
                    <Box sx={{ color: "#777", mb: 1 }}>
                      {typeLabel(n)} · {fmtDate(n.mtime)}
                      {n.isDir ? "" : " · " + fmtSize(n)}
                    </Box>
                    <Body
                      n={n}
                      big={big}
                      onItem={(c, el) => openChild(i, c, el)}
                      onItemLeave={() => stop("child")}
                    />
                  </>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </>
  );
}
