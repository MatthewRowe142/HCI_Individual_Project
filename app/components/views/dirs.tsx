import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FNode } from "../../utils";

// Lazy directory cache: a folder is fetched the first time something asks for it.
type Ctx = { cache: Record<string, FNode[]>; ensure: (p: string) => void };
const C = createContext<Ctx>(null as any);

export function DirProvider({
  root,
  initial,
  children,
}: {
  root: string;
  initial: FNode[];
  children: ReactNode;
}) {
  const [cache, setCache] = useState<Record<string, FNode[]>>({
    [root]: initial,
  });
  const asked = useRef(new Set([root]));
  const ensure = useCallback((p: string) => {
    if (asked.current.has(p)) return;
    asked.current.add(p);
    fetch("/api/dir?path=" + encodeURIComponent(p))
      .then((r) => r.json())
      .then((d) => setCache((c) => ({ ...c, [p]: d.items })))
      .catch(() => setCache((c) => ({ ...c, [p]: [] })));
  }, []);
  const value = useMemo(() => ({ cache, ensure }), [cache, ensure]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useDirs = () => useContext(C);
/** Children of a folder (undefined while loading). Triggers the lazy load. */
export function useDir(p: string): FNode[] | undefined {
  const { cache, ensure } = useDirs();
  useEffect(() => ensure(p), [p, ensure]);
  return cache[p];
}
/** Renders children only once scrolled into view, so offscreen rows never trigger loads. */
export function OnVisible({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setV(true);
        o.disconnect();
      }
    });
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return (
    <span ref={ref} style={{ display: "inline-flex", alignItems: "center" }}>
      {v ? children : fallback}
    </span>
  );
}
