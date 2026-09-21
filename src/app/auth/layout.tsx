import { LocaleProvider } from "@/lib/locale";
import AuthChrome from "@/app/auth/AuthChrome";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider>
      <AuthChrome>{children}</AuthChrome>
    </LocaleProvider>
  );
}
