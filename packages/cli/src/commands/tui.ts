import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command } from "commander";

function findInPath(name: string): string | null {
  const result = spawnSync("which", [name], { encoding: "utf-8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function runBinary(path: string, args: string[]): void {
  const child = spawn(path, args, { stdio: "inherit", cwd: process.cwd() });
  child.on("exit", (code) => process.exit(code ?? 0));
}

function runBunx(bunPath: string, args: string[]): boolean {
  let started = false;
  const child = spawn(bunPath, ["x", "@kaban-board/tui", ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  child.on("spawn", () => {
    started = true;
  });
  child.on("error", () => {
    if (!started) showInstallError();
  });
  child.on("exit", (code) => process.exit(code ?? 0));
  return true;
}

function showInstallError(): never {
  console.error(`
Error: kaban-tui not found

The TUI requires Bun runtime. Install with one of:

  # Homebrew (recommended)
  brew install beshkenadze/tap/kaban-tui

  # Or install Bun, then run via bunx
  curl -fsSL https://bun.sh/install | bash
  bunx @kaban-board/tui
`);
  process.exit(1);
}

export const tuiCommand = new Command("tui")
  .description("Start interactive Terminal UI (requires Bun)")
  .action(async () => {
    const args = process.argv.slice(3);

    const siblingBinary = join(dirname(process.execPath), "kaban-tui");
    if (existsSync(siblingBinary)) return runBinary(siblingBinary, args);

    const pathBinary = findInPath("kaban-tui");
    if (pathBinary) return runBinary(pathBinary, args);

    const bunPath = findInPath("bun");
    if (bunPath) return runBunx(bunPath, args);

    showInstallError();
  });
