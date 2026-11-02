import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("api/dir", "routes/dir.ts"),
  route("api/file", "routes/file.ts"),
] satisfies RouteConfig;
