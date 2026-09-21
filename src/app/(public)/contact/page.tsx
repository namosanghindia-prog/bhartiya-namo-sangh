import type { Metadata } from "next";
import ContactExperience from "@/components/contact/ContactExperience";
import { getContactPageData } from "@/lib/contact-query";

export const metadata: Metadata = {
  title: "Contact | Bhartiya Namo Sangh",
  description:
    "Contact Bhartiya Namo Sangh — write to us, find a branch, join as a member, or support the organisation’s work.",
};

export const revalidate = 300;

export default async function ContactPage() {
  const data = await getContactPageData();
  return <ContactExperience branches={data.branches} contact={data.contact} />;
}
