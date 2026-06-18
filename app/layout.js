import './globals.css';
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Open Generative AI — Free AI Image & Video Studio',
  description: 'Generate AI images and videos using 200+ models — Flux, Midjourney, Kling, Veo, Seedance and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} h-full bg-black text-white`}>{children}</body>
    </html>
  );
}
