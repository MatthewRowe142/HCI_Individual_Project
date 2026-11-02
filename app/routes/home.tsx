import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Explorer from "../components/Explorer";
import { ROOT, listDir } from "../server/fs.server";
import type { FNode } from "../utils";

const theme = createTheme({
  typography: { fontFamily: '"Segoe UI", "Segoe UI Variable", system-ui, sans-serif', fontSize: 12 },
  palette: { mode: "light", primary: { main: "#0067c0" } },
});
export async function loader() { return { root: ROOT, items: listDir(ROOT) }; }
export default function Home({ loaderData }: { loaderData: { root: string; items: FNode[] } }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Explorer root={loaderData.root} initial={loaderData.items} />
    </ThemeProvider>
  );
}
