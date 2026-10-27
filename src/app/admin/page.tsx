import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Refunds from "@/components/Refunds";

export const metadata: Metadata = { title: "Refunds · cm cards", robots: { index: false } };

export default function Page() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-8 pb-28 md:pb-16">
        <Refunds />
      </main>
    </>
  );
}
