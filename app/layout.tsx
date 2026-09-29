import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Taylor Products DAM",
  description: "Taylor Products Digital Asset Manager. Upload and manage photos and videos.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <SWRProvider>
              <ToastProvider>{children}</ToastProvider>
            </SWRProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
