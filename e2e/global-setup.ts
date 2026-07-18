import { clerkSetup } from '@clerk/testing/playwright';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// clerkSetup expects CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY (no NEXT_PUBLIC_ prefix).
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export default async function globalSetup() {
  await clerkSetup();
}

