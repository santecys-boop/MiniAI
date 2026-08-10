// Sahte (görsel) Linux terminali — Termux/bash hissi. Komutlar gerçekten kurulum YAPMAZ,
// ama gerçekçi loglar üretir. AI'nin kullandığı npm/pkg komutları için.
export type TermLine = { kind: "in" | "out" | "err" | "ok"; text: string };

function pkgName(args: string[]): string {
  return args.find((a) => a && !a.startsWith("-")) || "package";
}

const FAKE_VERSIONS: Record<string, string> = {
  ninja: "1.11.1", express: "4.19.2", react: "18.3.1", vite: "5.4.10",
  typescript: "5.6.3", tailwindcss: "3.4.14", lodash: "4.17.21",
  axios: "1.7.7", zod: "3.23.8", "framer-motion": "11.11.1",
};

function ver(name: string): string {
  return FAKE_VERSIONS[name] || `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`;
}

export function runFakeCommand(line: string): TermLine[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const sub = parts[1];
  const args = parts.slice(2);
  const out: TermLine[] = [{ kind: "in", text: `mini@termux ~ $ ${trimmed}` }];

  if (cmd === "clear") return [];
  if (cmd === "help") {
    out.push({ kind: "out", text: "Kullanılabilir komutlar:" });
    out.push({ kind: "out", text: "  npm/pnpm/yarn install <paket>" });
    out.push({ kind: "out", text: "  pkg install <paket>      (Termux tarzı)" });
    out.push({ kind: "out", text: "  ls, pwd, whoami, echo, cat, date" });
    out.push({ kind: "out", text: "  node --version, python --version" });
    out.push({ kind: "out", text: "  clear, help" });
    return out;
  }
  if (cmd === "ls") {
    out.push({ kind: "out", text: "node_modules  package.json  src  index.html  README.md" });
    return out;
  }
  if (cmd === "pwd") { out.push({ kind: "out", text: "/home/mini/project" }); return out; }
  if (cmd === "whoami") { out.push({ kind: "out", text: "mini" }); return out; }
  if (cmd === "date") { out.push({ kind: "out", text: new Date().toString() }); return out; }
  if (cmd === "echo") { out.push({ kind: "out", text: parts.slice(1).join(" ") }); return out; }
  if (cmd === "node" && sub === "--version") { out.push({ kind: "out", text: "v20.18.0" }); return out; }
  if (cmd === "python" && (sub === "--version" || sub === "-V")) { out.push({ kind: "out", text: "Python 3.12.5" }); return out; }
  if (cmd === "cat" && sub === "package.json") {
    out.push({ kind: "out", text: '{\n  "name": "mini-project",\n  "version": "1.0.0"\n}' });
    return out;
  }

  if ((cmd === "npm" || cmd === "pnpm" || cmd === "yarn" || cmd === "bun") && (sub === "install" || sub === "i" || sub === "add")) {
    const pkg = pkgName(args);
    out.push({ kind: "out", text: `⠋ Resolving dependencies...` });
    out.push({ kind: "out", text: `⠙ Fetching ${pkg}@${ver(pkg)} from registry...` });
    out.push({ kind: "out", text: `⠹ Downloading (${Math.floor(Math.random() * 800 + 200)}KB)...` });
    out.push({ kind: "out", text: `⠸ Linking dependencies...` });
    out.push({ kind: "ok", text: `+ ${pkg}@${ver(pkg)}` });
    out.push({ kind: "ok", text: `added ${Math.floor(Math.random() * 30 + 5)} packages in ${(Math.random() * 4 + 1).toFixed(1)}s` });
    return out;
  }
  if (cmd === "pkg" && sub === "install") {
    const pkg = pkgName(args);
    out.push({ kind: "out", text: `Reading package lists... Done` });
    out.push({ kind: "out", text: `Building dependency tree... Done` });
    out.push({ kind: "out", text: `Get:1 ${pkg} ${ver(pkg)} [${Math.floor(Math.random() * 2000 + 500)}kB]` });
    out.push({ kind: "ok", text: `Setting up ${pkg} (${ver(pkg)}) ...` });
    out.push({ kind: "ok", text: `Done.` });
    return out;
  }
  if (cmd === "git" && sub === "clone") {
    const url = args[0] || "repo";
    out.push({ kind: "out", text: `Cloning into '${url.split("/").pop()?.replace(".git", "")}'...` });
    out.push({ kind: "out", text: `remote: Counting objects: ${Math.floor(Math.random() * 500 + 100)}, done.` });
    out.push({ kind: "ok", text: `Receiving objects: 100% done.` });
    return out;
  }
  if (cmd === "curl" || cmd === "wget") {
    out.push({ kind: "out", text: `Connecting to ${(parts[1] || "host").replace(/https?:\/\//, "").split("/")[0]}...` });
    out.push({ kind: "ok", text: `200 OK   ${Math.floor(Math.random() * 50 + 5)}KB transferred` });
    return out;
  }

  out.push({ kind: "err", text: `${cmd}: command not found (try 'help')` });
  return out;
}
