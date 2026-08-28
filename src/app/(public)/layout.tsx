import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaymentSafetyNotice from "@/components/PaymentSafetyNotice";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PaymentSafetyNotice />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
