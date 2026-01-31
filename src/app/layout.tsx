import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StorageProvider } from "@/providers/StorageProvider";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <StorageProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </StorageProvider>
      </body>
    </html>
  );
}
