import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function fileUrlToPath(urlOrPath: string): string {
  if (!urlOrPath.startsWith("file:")) return urlOrPath;
  if (urlOrPath.startsWith("file:///") || urlOrPath.startsWith("file://localhost/")) {
    return fileURLToPath(urlOrPath);
  }
  return urlOrPath.replace(/^file:/, "");
}

export function ensureDbDir(filePath: string) {
  if (filePath === ":memory:" || filePath.trim() === "") return;
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
