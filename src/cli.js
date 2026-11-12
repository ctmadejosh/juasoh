#!/usr/bin/env node
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, stderr, platform } from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { createVCard, profile } from "./profile.js";

const version = "1.0.0";
const reset = "\u001b[0m";
const cyan = "\u001b[36m";
const bright = "\u001b[1m";
const yellow = "\u001b[33m";

export function parseArgs(args) {
  const options = { action: "menu", color: true };
  for (const arg of args) {
    if (arg === "--help" || arg === "-h") options.action = "help";
    else if (arg === "--version" || arg === "-v") options.action = "version";
    else if (arg === "--qr") options.action = "qr";
    else if (arg === "--no-color") options.color = false;
    else if (arg === "--vcard") {
      options.action = "vcard";
      options.path = "joshua-asoh.vcf";
    } else if (arg.startsWith("--vcard=")) {
      const path = arg.slice("--vcard=".length);
      if (!path) throw new Error("Provide a file path after --vcard=.");
      options.action = "vcard";
      options.path = path;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function paint(text, ...codes) {
  if (!stdout.isTTY || process.env.NO_COLOR) return text;
  return `${codes.join("")}${text}${reset}`;
}

export function renderCard({ color = true } = {}) {
  const style = color && !process.env.NO_COLOR ? paint : (text) => text;
  const width = 48;
  const row = (text = "", codes = []) => {
    const padded = text.padEnd(width);
    const content = codes.length ? style(padded, ...codes) : padded;
    return `  ${style("║", cyan)} ${content} ${style("║", cyan)}`;
  };
  const top = `  ${style(`╔${"═".repeat(width + 2)}╗`, cyan)}`;
  const divider = `  ${style(`╟${"─".repeat(width + 2)}╢`, cyan)}`;
  const bottom = `  ${style(`╚${"═".repeat(width + 2)}╝`, cyan)}`;
  const lines = [
    "",
    top,
    row("JUASOH / ENGINEERING PROFILE", [bright, cyan]),
    divider,
    row(),
    row(profile.name.toUpperCase(), [bright, yellow]),
    row(profile.role.toUpperCase(), [bright]),
    row(`AT ${profile.company.toUpperCase()}`, [cyan]),
    row(),
    row("PORTFOLIO", [bright, cyan]),
    row(profile.website, [bright]),
    divider,
    row("SELECT AN OPTION BELOW TO CONNECT", [bright]),
    bottom,
    "",
  ];
  return lines.join("\n");
}

function helpText() {
  return `juasoh ${version} — Joshua Asoh's terminal profile card

Usage:
  npx juasoh [option]

Options:
  -h, --help       Show this help
  -v, --version    Show the version
  --qr             Print a QR code for ${profile.website}
  --vcard[=FILE]   Export a contact card (default: joshua-asoh.vcf)
  --no-color       Disable terminal colors
`;
}

function openUrl(url) {
  let command;
  let args;
  if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else if (platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", (error) => {
    stderr.write(`Could not open the link: ${error.message}\n`);
  });
  child.unref();
}

async function showQr() {
  const qr = await QRCode.toString(profile.website, { type: "terminal", small: true });
  stdout.write(`${qr}\nScan to visit ${profile.website}\n`);
}

async function animateIntro() {
  if (!stdin.isTTY || !stdout.isTTY) return;
  for (const frame of ["|", "/", "-", "\\"]) {
    stdout.write(`\r${paint(frame, cyan)} Preparing your contact card...`);
    await sleep(65);
  }
  stdout.write("\r                                  \r");
}

async function exportVCard(path) {
  await writeFile(path, createVCard(), { flag: "wx" });
  stdout.write(`Contact card saved to ${path}\n`);
}

const actions = [
  ["Open portfolio", profile.website],
  ["Open resume", profile.resume],
  ["Open LinkedIn", profile.linkedin],
  ["Open GitHub", profile.github],
  ["Send email", `mailto:${profile.email}`],
  ["Copy email", null],
  ["Export contact card", null],
  ["Show portfolio QR code", null],
  ["Quit", null],
];

async function copyWith(commandName, args) {
  const command = spawn(commandName, args, { stdio: ["pipe", "ignore", "ignore"] });
  let inputError;
  command.stdin.on("error", (error) => {
    inputError = error;
  });
  command.stdin.end(profile.email);
  await new Promise((resolve, reject) => {
    command.on("error", reject);
    command.on("close", (code) => {
      if (code === 0) resolve();
      else reject(inputError || new Error(`${commandName} exited with code ${code}.`));
    });
  });
}

async function copyEmail() {
  if (platform === "win32") await copyWith("clip", []);
  else if (platform === "darwin") await copyWith("pbcopy", []);
  else {
    let lastError;
    for (const [command, args] of [
      ["wl-copy", []],
      ["xclip", ["-selection", "clipboard"]],
    ]) {
      try {
        await copyWith(command, args);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) {
      throw new Error(`Clipboard unavailable (${lastError.message}). You can copy the email from the card above.`);
    }
  }
  stdout.write("Email copied to clipboard.\n");
}

async function runMenu() {
  const rl = createInterface({ input: stdin, output: stdout });
  let interrupted = false;
  rl.on("SIGINT", () => {
    interrupted = true;
    rl.close();
  });
  try {
    while (true) {
      stdout.write("\n");
      actions.forEach(([label], index) => stdout.write(`  ${index + 1}. ${label}\n`));
      const answer = await rl.question("\nChoose an option: ");
      const selection = Number(answer.trim());
      if (!Number.isInteger(selection) || selection < 1 || selection > actions.length) {
        stdout.write("Choose a number from the menu.\n");
        continue;
      }
      if (selection === actions.length) break;
      if (selection <= 5) openUrl(actions[selection - 1][1]);
      else if (selection === 6) await copyEmail();
      else if (selection === 7) await exportVCard("joshua-asoh.vcf");
      else await showQr();
    }
  } catch (error) {
    if (!interrupted) throw error;
  } finally {
    rl.close();
  }
  stdout.write(interrupted ? "\nSee you online.\n" : "See you online.\n");
}

export async function main(args = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    stderr.write(`${error.message}\nRun "juasoh --help" for usage.\n`);
    return 2;
  }

  if (options.action === "help") stdout.write(helpText());
  else if (options.action === "version") stdout.write(`${version}\n`);
  else if (options.action === "qr") await showQr();
  else if (options.action === "vcard") await exportVCard(options.path);
  else {
    await animateIntro();
    stdout.write(renderCard({ color: options.color }));
    if (stdin.isTTY && stdout.isTTY) await runMenu();
    else stdout.write("Run in a terminal to choose an action, or use --help for options.\n");
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
