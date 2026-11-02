import { ROOT, listDir } from "../server/fs.server";
export async function loader({ request }: { request: Request }) {
  const p = new URL(request.url).searchParams.get("path") ?? ROOT;
  return Response.json({ items: listDir(p) });
}
