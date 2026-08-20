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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
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

  return isClerkEnabled ? <ClerkProvider
    appearance={{
      variables: {
        colorPrimary: '#22d3ee',
        colorBackground: '#050505',
        colorInputBackground: 'rgba(255,255,255,0.04)',
        colorInputText: '#ffffff',
        colorText: '#ffffff',
        colorTextSecondary: 'rgba(255,255,255,0.65)',
        colorNeutral: 'rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        fontFamily: 'Inter, sans-serif',
      },
      elements: {
        card: 'landing-card',
        formButtonPrimary:
          'bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold hover:opacity-90',
        formFieldInput:
          'bg-white/5 border border-white/10 text-white placeholder:text-white/40',
        formFieldLabel: 'text-white/80',
        // Show / hide password toggle (eye icon) — make it clearly visible
        // on the dark glass card so users can reveal the password they type.
        formFieldInputShowPasswordButton:
          'text-white/70 hover:text-white hover:bg-white/10 rounded-md',
        formFieldInputShowPasswordIcon: 'text-white/70 hover:text-white',
        footerActionLink: 'text-cyan-300 hover:text-cyan-200',
        identityPreviewText: 'text-white',
        identityPreviewEditButton: 'text-cyan-300',
      },
    }}
  >{tree}</ClerkProvider> : tree;
}
