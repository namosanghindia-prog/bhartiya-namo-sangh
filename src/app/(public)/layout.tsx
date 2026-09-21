import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaymentSafetyNotice from "@/components/PaymentSafetyNotice";
import { LocaleProvider } from "@/lib/locale";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow-lg"
      >
        Skip to content
      </a>
      <PaymentSafetyNotice />
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </LocaleProvider>
  );
}
