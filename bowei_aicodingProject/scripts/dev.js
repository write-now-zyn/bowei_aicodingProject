import { spawn } from "node:child_process";
import { createConnection, createServer } from "node:net";

const DEFAULT_API_PORT = 3000;
const DEFAULT_WEB_PORT = 5173;
const LOCAL_HOST = "127.0.0.1";
const viteArgs = process.argv.slice(2);
const { port: cliWebPort, args: passthroughViteArgs } = parseViteArgs(viteArgs);
const explicitApiPort = process.env.API_PORT ?? process.env.PORT;
const explicitWebPort = process.env.WEB_PORT ?? cliWebPort;
const children = [];

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const apiPort = await resolvePort({
    name: "API",
    value: explicitApiPort,
    defaultPort: DEFAULT_API_PORT,
    host: LOCAL_HOST,
  });
  const webPort = await resolvePort({
    name: "Web",
    value: explicitWebPort,
    defaultPort: DEFAULT_WEB_PORT,
    host: LOCAL_HOST,
    unavailablePorts: [apiPort],
  });

  const processes = [
    {
      name: "api",
      command: process.execPath,
      args: ["src/server/index.js"],
      env: {
        API_HOST: LOCAL_HOST,
        API_PORT: String(apiPort),
        HOST: LOCAL_HOST,
        PORT: String(apiPort),
      },
    },
    {
      name: "web",
      command: process.execPath,
      args: [
        "node_modules/vite/bin/vite.js",
        "--host",
        LOCAL_HOST,
        "--port",
        String(webPort),
        ...passthroughViteArgs,
      ],
      env: {
        API_HOST: LOCAL_HOST,
        API_PORT: String(apiPort),
        WEB_PORT: String(webPort),
      },
    },
  ];

  for (const processConfig of processes) {
    children.push(startProcess(processConfig));
  }
}

function startProcess({ name, command, args, env }) {
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
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function parseViteArgs(args) {
  const remainingArgs = [];
  let port;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--port") {
      port = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      port = arg.slice("--port=".length);
      continue;
    }

    remainingArgs.push(arg);
  }

  return { port, args: remainingArgs };
}

async function resolvePort({
  name,
  value,
  defaultPort,
  host,
  unavailablePorts = [],
}) {
  if (value !== undefined) {
    const port = parsePort(value, name);

    if (unavailablePorts.includes(port)) {
      throw new Error(
        `${name} port ${port} is already reserved by another local service. Choose another port with ${
          name === "API" ? "API_PORT" : "WEB_PORT or --port"
        }.`,
      );
    }

    const available = await isPortAvailable(port, host);

    if (!available) {
      throw new Error(
        `${name} port ${port} is already in use. Choose another port with ${
          name === "API" ? "API_PORT" : "WEB_PORT or --port"
        }.`,
      );
    }

    return port;
  }

  return findAvailablePort(defaultPort, host, unavailablePorts);
}

function parsePort(value, name) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} port must be an integer between 1 and 65535.`);
  }

  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${name} port must be an integer between 1 and 65535.`);
  }

  return port;
}

async function findAvailablePort(startPort, host, unavailablePorts) {
  let port = startPort;

  while (
    port <= 65535 &&
    (unavailablePorts.includes(port) || !(await isPortAvailable(port, host)))
  ) {
    port += 1;
  }

  if (port > 65535) {
    throw new Error(`No available port found at or above ${startPort}.`);
  }

  return port;
}

async function isPortAvailable(port, host = LOCAL_HOST) {
  if (await canConnect(port, host)) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

function canConnect(port, host) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });

    socket.setTimeout(300);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
  });
}

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
