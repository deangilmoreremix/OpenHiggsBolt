#!/usr/bin/env node
// Bulk-invite users via the Clerk Backend API.
// Each invitation emails the user a confirmation / accept link (the "confirmation").
//
// Usage:
//   node scripts/invite-users.mjs invites.csv            # one email per line (or comma-separated)
//   node scripts/invite-users.mjs invites.csv --redirect https://yourapp.com/welcome
//   node scripts/invite-users.mjs invites.csv --dry-run  # validate without sending
//
// Env:
//   CLERK_SECRET_KEY   (required)  from .env.local
//   CLERK_API_URL      (optional)  defaults to https://api.clerk.com
//
// Equivalent single-user `clerk` CLI command:
//   clerk api /invitations -d '{"email_address":"new@example.com","redirect_url":"https://yourapp.com/welcome"}'

import { readFileSync } from 'node:fs';

const secret = process.env.CLERK_SECRET_KEY;
const apiUrl = process.env.CLERK_API_URL || 'https://api.clerk.com';
const dryRun = process.argv.includes('--dry-run');
const redirectArg = process.argv.indexOf('--redirect');
const redirectUrl =
  redirectArg !== -1 ? process.argv[redirectArg + 1] : 'http://localhost:3000/';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/invite-users.mjs <file.csv> [--redirect URL] [--dry-run]');
  process.exit(1);
}

if (!secret) {
  console.error('Missing CLERK_SECRET_KEY. Source your .env.local first.');
  process.exit(1);
}

const raw = readFileSync(file, 'utf8');
const emails = [
  ...new Set(
    raw
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  ),
];

if (emails.length === 0) {
  console.error(`No valid emails found in ${file}`);
  process.exit(1);
}

console.log(`Found ${emails.length} email(s)${dryRun ? ' (dry-run, not sending)' : ''}.`);

let ok = 0;
let failed = 0;

for (const email of emails) {
  if (dryRun) {
    console.log(`  [dry-run] would invite ${email}`);
    ok++;
    continue;
  }

  try {
    const res = await fetch(`${apiUrl}/v1/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email, redirect_url: redirectUrl }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`  ✗ ${email}: ${res.status} ${body}`);
      failed++;
    } else {
      console.log(`  ✓ invited ${email}`);
      ok++;
    }
  } catch (err) {
    console.error(`  ✗ ${email}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} ok, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
