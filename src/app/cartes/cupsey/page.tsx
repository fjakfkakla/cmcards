import TradingCard from "@/components/TradingCard";
import type { Card } from "@/lib/data";

const CUPSEY: Card = { id: "cupsey-exclusive-3", trader: "cupsey", rarity: "exclusive", coin: "BONK", amount: 19_250_000, serial: 3, supply: 5 };

export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <TradingCard card={CUPSEY} />
      </div>
    </main>
  );
}
