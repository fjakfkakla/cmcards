import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Shop from "@/components/Shop";

export const metadata: Metadata = { title: "Boosters · cm cards" };

export default function Page() {
  return (
    <>
      <Nav at="boosters" />
      <main className="flex-1 overflow-x-hidden pb-24 md:pb-10">
        <Shop />
      </main>
    </>
  );
}
