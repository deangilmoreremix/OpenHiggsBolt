import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const root = process.cwd();

function loadEnv(file) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

const envProduction = loadEnv('.env.production');
const envLocal = loadEnv('.env.local');

Object.assign(process.env, envProduction, envLocal);

const args = process.argv.slice(2);
const child = spawn('npx', ['next', 'dev', '--turbopack', ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code));
