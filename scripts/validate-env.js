import fs from 'fs';
import path from 'path';

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

const envLocal = loadEnv('.env.local');
const envProduction = loadEnv('.env.production');

const merged = { ...process.env, ...envLocal, ...envProduction };

const publishableKey = merged.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const secretKey = merged.CLERK_SECRET_KEY || '';

let errors = [];

if (!publishableKey) {
  errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
} else if (publishableKey.startsWith('pk_test_')) {
  errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is a test key (pk_test_*) — production keys required');
}

if (!secretKey) {
  errors.push('CLERK_SECRET_KEY is missing');
} else if (secretKey.startsWith('sk_test_')) {
  errors.push('CLERK_SECRET_KEY is a test key (sk_test_*) — production keys required');
}

if (errors.length > 0) {
  console.error('\n❌ Environment validation failed:\n');
  for (const error of errors) {
    console.error(`   • ${error}`);
  }
  console.error('\nThis application runs in production mode only.');
  console.error('Ensure production keys are set in .env.production or your deployment platform.\n');
  process.exit(1);
}

console.log('✅ Environment validation passed — production keys are configured.');
