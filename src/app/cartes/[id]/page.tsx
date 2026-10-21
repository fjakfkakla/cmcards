import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import TraderSheet from "@/components/TraderSheet";
import { TRADERS } from "@/lib/data";

/* La planche d'un trader : ses cinq raretés. */
export function generateStaticParams() {
  return TRADERS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = TRADERS.find((x) => x.id === id);
  return { title: t ? `${t.name} · cm cards` : "cm cards" };
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Nav at="cartes" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-28 md:pb-16">
        <Suspense>
          <Sheet params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Sheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TRADERS.find((x) => x.id === id);
  if (!t) notFound();
  return <TraderSheet t={t} />;
}
