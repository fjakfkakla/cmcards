import { Suspense } from "react";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Opening from "@/components/Opening";
import { PACKS, pack, packTraders } from "@/lib/data";

export function generateStaticParams() {
  return PACKS.map((p) => ({ id: p.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Nav at="boosters" />
      <main className="flex flex-1 flex-col">
        <Suspense>
          <Booster params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Booster({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = pack(id);
  if (!p || !packTraders(p).length) notFound();
  return <Opening pack={p} />;
}
