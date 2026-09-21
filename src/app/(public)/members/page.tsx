import type { Metadata } from "next";
import MembersHero from "@/components/members/MembersHero";
import MembersExperience from "@/components/members/MembersExperience";

export const metadata: Metadata = {
  title: "Members | Bhartiya Namo Sangh",
  description:
    "Meet the leaders, volunteers and members of Bhartiya Namo Sangh working together to serve communities and contribute to nation-building.",
};

export default function MembersPage() {
  return (
    <>
      <MembersHero />
      <MembersExperience />
    </>
  );
}
