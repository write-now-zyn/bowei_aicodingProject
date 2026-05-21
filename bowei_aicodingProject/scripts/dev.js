import { spawn } from "node:child_process";

const processes = [
  {
    name: "api",
    command: process.execPath,
    args: ["src/server/index.js"],
    env: { PORT: process.env.PORT ?? "3000" },
  },
  {
    name: "web",
    command: process.execPath,
    args: ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    env: {},
  },
];

const children = processes.map(({ name, command, args, env }) => {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => writeOutput(name, data));
  child.stderr.on("data", (data) => writeOutput(name, data));
  child.on("exit", (code, signal) => {
    if (code || signal) {
      shutdown(code ?? 1);
    }
  });

  return child;
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function writeOutput(name, data) {
  for (const line of data.toString().split(/\r?\n/)) {
    if (line) {
      console.log(`[${name}] ${line}`);
    }
  }
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}
