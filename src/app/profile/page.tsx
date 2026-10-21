import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Profile from "@/components/Profile";

export const metadata: Metadata = { title: "Profile · cm cards" };

export default function Page() {
  return (
    <>
      <Nav at="profile" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-8 pb-28 md:pb-16">
        <Profile />
      </main>
    </>
  );
}
