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
const envDevelopment = loadEnv('.env.development');

const nodeEnv = process.env.NODE_ENV || 'development';

// Next.js loads these files depending on NODE_ENV:
// - dev:   .env.local, .env.development, .env
// - build: .env.production, .env, (NOT .env.local)
// - start: .env.local, .env.production, .env
const relevantFiles =
  nodeEnv === 'production' ? [envLocal, envProduction] : [envLocal, envDevelopment];

const merged = { ...process.env };
for (const fileEnv of relevantFiles) {
  Object.assign(merged, fileEnv);
}

const publishableKey = merged.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const secretKey = merged.CLERK_SECRET_KEY || '';

let errors = [];

if (!publishableKey) {
  errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
} else if (nodeEnv === 'production' && publishableKey.startsWith('pk_test_')) {
  errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is a test key (pk_test_*) but NODE_ENV=production');
}

if (!secretKey) {
  errors.push('CLERK_SECRET_KEY is missing');
} else if (nodeEnv === 'production' && secretKey.startsWith('sk_test_')) {
  errors.push('CLERK_SECRET_KEY is a test key (sk_test_*) but NODE_ENV=production');
}

if (errors.length > 0) {
  console.error('\n❌ Environment validation failed:\n');
  for (const error of errors) {
    console.error(`   • ${error}`);
  }
  console.error('\nEnsure production keys are set in .env.production or your deployment platform.');
  console.error("For local development, use 'npm run dev' which loads .env.development.\n");
  process.exit(1);
}

console.log('✅ Environment validation passed — production keys are configured.');
