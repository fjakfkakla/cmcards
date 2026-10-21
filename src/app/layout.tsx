import type { Metadata } from "next";
import { Chewy, Instrument_Serif, Inter_Tight, Nunito } from "next/font/google";
import AccountProvider from "@/lib/account";
import "./globals.css";

// les polices des cartes elles-mêmes (leur dessin ne change pas avec l'app)
const chewy = Chewy({ variable: "--font-chewy", weight: "400", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", weight: ["600", "700", "800", "900"], style: ["normal", "italic"], subsets: ["latin"] });
// le set Kimchi : un sérif italique et des capitales espacées, rien de plus
const serif = Instrument_Serif({ variable: "--font-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"] });
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "cm cards",
  description: "Les cartes des traders de memecoins. Ouvre des boosters, revends tes cartes aux autres joueurs, en SOL.",
  icons: { icon: "/brand/cmcards-favicon.svg", apple: "/brand/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${chewy.variable} ${nunito.variable} ${serif.variable} ${tight.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
