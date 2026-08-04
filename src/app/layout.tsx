import type { Metadata } from "next";
import "./globals.css";

// NOTE: next/font/google (Playfair Display, Inter) is blocked in this sandbox
// (no access to fonts.googleapis.com). On your real dev machine / Vercel,
// swap this back to next/font/google for self-hosted, zero-layout-shift fonts:
//
//   import { Playfair_Display, Inter } from "next/font/google";
//   const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["500","600","700"] });
//   const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600","700"] });
//   then use `${playfair.variable} ${inter.variable}` below instead of the static string.

export const metadata: Metadata = {
  title: "Bhartiya Namo Sangh | Building Bharat, One Action at a Time",
  description:
    "Bhartiya Namo Sangh is a New Delhi-based NGO with branches across India, driving social, charitable, environmental, and educational impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-saffron-50 text-navy">
        {children}
      </body>
    </html>
  );
}
