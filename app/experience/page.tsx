import type { Metadata } from "next";
import Site from "@/components/Site";

export const metadata: Metadata = {
  title: "Experience — Joey Concepcion",
  description: "Twenty years in IT: Boehringer Ingelheim, Citibank, Societe Generale, NETS, UOB, Manulife and more.",
  alternates: { canonical: "/experience/" },
};

export default function Page() {
  return <Site page="experience" />;
}
