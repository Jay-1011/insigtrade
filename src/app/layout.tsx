import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Insigtrade — Use AI & Automation to Trade Smarter",
    template: "%s | Insigtrade",
  },
  description:
    "Discover the best AI tools, automation strategies, and trading systems to improve your decision-making and efficiency in the markets.",
  keywords: [
    "AI trading tools",
    "trading automation",
    "AI for finance",
    "algorithmic trading",
    "market analysis AI",
    "trading bots",
    "smart trading",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Insigtrade",
    title: "Insigtrade — Use AI & Automation to Trade Smarter",
    description:
      "Discover the best AI tools, automation strategies, and trading systems to improve your decision-making and efficiency in the markets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insigtrade — Use AI & Automation to Trade Smarter",
    description:
      "Discover the best AI tools, automation strategies, and trading systems.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {isAdmin ? (
          children
        ) : (
          <>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
