import './globals.css';
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: 'SmartVideo GO — Free AI Video Studio',
  description: 'Generate videos, VFX, and campaign assets using 200+ models — Flux, Midjourney, Kling, Veo, Seedance and more.',
};

// Clerk is optional. If the publishable key is missing we still render the app
// (landing page + studios) instead of white-screening everything.
const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({ children }) {
  const tree = (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );

  return isClerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
