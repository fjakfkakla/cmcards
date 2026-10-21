import CollectCard from "@/components/CollectCard";
import type { Card } from "@/lib/data";

const CUPSEY: Card = { id: "cupsey-mythic", trader: "cupsey", rarity: "mythic", coin: "BONK", amount: 120_000_000, serial: 1 };

export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <CollectCard card={CUPSEY} />
      </div>
    </main>
  );
}
