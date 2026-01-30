import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StorageProvider } from "@/providers/StorageProvider";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

// TODO: Auth
// - Add Supabase AuthProvider wrapping StorageProvider
// - Add SessionProvider for client-side auth state
// - Support Google/GitHub OAuth + email/password

// TODO: PWA
// - Add manifest.json for installable web app
// - Add service worker for offline support (cache test pages)
// - Add apple-touch-icon and favicon variants

// TODO: Analytics
// - Add anonymous usage tracking (which tests are popular, avg scores)
// - Use Vercel Analytics or PostHog

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baseline",
  description: "Measure your cognitive abilities. 18 tests across reaction time, memory, perception, audio, and spatial reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <StorageProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </StorageProvider>
      </body>
    </html>
  );
}
