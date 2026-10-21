import type { Metadata } from "next";
import Market from "@/components/Market";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Market · cm cards" };

export default function Page() {
  return (
    <>
      <Nav at="market" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-28 md:pb-16">
        <Market />
      </main>
    </>
  );
}
