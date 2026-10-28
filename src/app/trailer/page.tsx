import { notFound } from "next/navigation";
import Trailer from "@/components/trailer/Trailer";

/* La bande-annonce, montée image par image par tools/trailer/render.cjs. Seulement en
   développement : en production, la page n'existe pas. */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Trailer />;
}
