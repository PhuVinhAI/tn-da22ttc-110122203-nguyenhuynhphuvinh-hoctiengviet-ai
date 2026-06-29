#!/usr/bin/env node

import { networkInterfaces } from "os";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.resolve(__dirname, "mobile", ".env");

// --- Lấy IP local (IPv4, không phải loopback) ---
// Bỏ qua adapter ảo (VMware, VirtualBox, Hyper-V, Docker, WSL...) vì trên
// Windows chúng thường được liệt kê trước Wi-Fi/Ethernet vật lý và khiến
// script chọn nhầm IP không reachable từ điện thoại cùng mạng Wi-Fi.
const VIRTUAL_ADAPTER_RE =
  /vmware|virtualbox|vbox|hyper-?v|vethernet|loopback|wsl|docker|vEthernet/i;
const PHYSICAL_RE = /wi-?fi|wlan|ethernet|local\s*area\s*connection/i;

function getLocalIP() {
  const nets = networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    if (VIRTUAL_ADAPTER_RE.test(name)) continue;
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        candidates.push({ name, address: net.address });
      }
    }
  }
  if (candidates.length === 0) return "127.0.0.1";
  // Ưu tiên adapter vật lý rõ ràng (Wi-Fi / Ethernet)
  const preferred = candidates.find((c) => PHYSICAL_RE.test(c.name));
  return (preferred || candidates[0]).address;
}

// --- Regex match IP trong value ---
const IP_REGEX = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;

// --- Parse .env ---
function parseEnv(content) {
  return content.split("\n").map((line) => {
    const match = line.match(/^([^#=]+?)=(.*)$/);
    if (!match) return { raw: line, key: null, value: null };
    return { raw: line, key: match[1].trim(), value: match[2].trim() };
  });
}

// --- Tìm các field chứa IP ---
function findIPFields(entries) {
  return entries
    .filter((e) => e.key && e.value && IP_REGEX.test(e.value))
    .map((e) => ({
      key: e.key,
      oldValue: e.value,
      oldIP: e.value.match(IP_REGEX)[1],
    }));
}

// --- Main ---
async function main() {
  const localIP = getLocalIP();
  console.log(`\n🌐 IP máy local: \x1b[36m${localIP}\x1b[0m\n`);

  // Đọc .env
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`❌ Không tìm thấy file: ${ENV_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(ENV_FILE, "utf-8");
  const entries = parseEnv(content);
  const ipFields = findIPFields(entries);

  if (ipFields.length === 0) {
    console.log("ℹ️  Không tìm thấy field nào chứa IP trong .env");
    return;
  }

  // Hiển thị các field chứa IP
  console.log("📋 Các field chứa IP trong \x1b[33mmobile/.env\x1b[0m:");
  ipFields.forEach((f, i) => {
    console.log(`   ${i + 1}. \x1b[32m${f.key}\x1b[0m = ${f.oldValue}`);
    console.log(`      IP hiện tại: \x1b[31m${f.oldIP}\x1b[0m`);
  });

  // Nếu IP đã đúng → skip
  const allMatch = ipFields.every((f) => f.oldIP === localIP);
  if (allMatch) {
    console.log(`\n✅ Tất cả IP đã là \x1b[36m${localIP}\x1b[0m, không cần đổi.`);
    return;
  }

  // Hỏi confirm
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question(
      `\n🔄 Đổi IP thành \x1b[36m${localIP}\x1b[0m cho tất cả? (Y/n): `,
      resolve
    );
  });
  rl.close();

  if (answer.toLowerCase() === "n") {
    console.log("⏭️  Đã bỏ qua.");
    return;
  }

  // Thay IP
  let newContent = content;
  ipFields.forEach((f) => {
    const newValue = f.oldValue.replace(f.oldIP, localIP);
    newContent = newContent.replace(`${f.key}=${f.oldValue}`, `${f.key}=${newValue}`);
  });

  fs.writeFileSync(ENV_FILE, newContent, "utf-8");

  console.log(`\n✅ Đã cập nhật \x1b[33mmobile/.env\x1b[0m:`);
  ipFields.forEach((f) => {
    const newValue = f.oldValue.replace(f.oldIP, localIP);
    console.log(`   \x1b[32m${f.key}\x1b[0m = ${newValue}`);
  });
}

main().catch(console.error);
