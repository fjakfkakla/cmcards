import type { Metadata } from "next";
import { Chewy, Instrument_Serif, Inter_Tight, Nunito } from "next/font/google";
import "./globals.css";

const chewy = Chewy({ variable: "--font-chewy", weight: "400", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", weight: ["600", "700", "800", "900"], style: ["normal", "italic"], subsets: ["latin"] });
// le set Kimchi : un sérif italique et des capitales espacées, rien de plus
const serif = Instrument_Serif({ variable: "--font-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cm cards",
  description: "Des boosters de memecoins sur Solana : chaque carte contient de vrais coins.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${chewy.variable} ${nunito.variable} ${serif.variable} ${tight.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
