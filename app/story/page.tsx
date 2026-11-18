import type { Metadata } from "next";
import Site from "@/components/Site";

export const metadata: Metadata = {
  title: "Story — Joey Concepcion",
  description: "Education, interests, the countries his work reached, a mini game, fun facts and his character sheet.",
  alternates: { canonical: "/story/" },
};

export default function Page() {
  return <Site page="story" />;
}
