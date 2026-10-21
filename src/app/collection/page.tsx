import type { Metadata } from "next";
import Collection from "@/components/Collection";
import Nav from "@/components/Nav";

export const metadata: Metadata = { title: "Ma collection · cm cards" };

export default function Page() {
  return (
    <>
      <Nav at="collection" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16">
        <Collection />
      </main>
    </>
  );
}
