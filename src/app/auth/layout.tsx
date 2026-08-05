import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-saffron-gradient px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-6">
          <Image
            src="/logo.png"
            alt="Bhartiya Namo Sangh"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <span className="font-heading text-xl font-semibold text-white">
            Bhartiya Namo Sangh
          </span>
        </Link>
        <div className="rounded-xl bg-white p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
