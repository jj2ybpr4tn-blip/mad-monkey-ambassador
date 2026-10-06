import type { Metadata, Viewport } from "next";
import { Bungee, Montserrat } from "next/font/google";
import { DemoBar } from "@/components/Chrome";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-montserrat" });
// Sticker chrome only ("WIN", "WINNER"), never paragraphs.
const bungee = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-bungee" });

export const metadata: Metadata = {
  title: "Mad Monkey · Win a trip",
  description: "Enter the Mad Monkey giveaway at your uni. Bring your mates, get more entries.",
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${montserrat.variable} ${bungee.variable}`}>
      <body className="min-h-dvh">
        <DemoBar />
        {children}
      </body>
    </html>
  );
}
