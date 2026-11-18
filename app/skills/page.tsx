import type { Metadata } from "next";
import Site from "@/components/Site";

export const metadata: Metadata = {
  title: "Skills & certifications — Joey Concepcion",
  description: "Databases, languages, platforms, and certifications in service management, agile delivery, UX and analytics.",
  alternates: { canonical: "/skills/" },
};

export default function Page() {
  return <Site page="skills" />;
}
