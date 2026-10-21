import Nav from "@/components/Nav";
import Shop from "@/components/Shop";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1 overflow-x-hidden">
        <Shop />
      </main>
    </>
  );
}
