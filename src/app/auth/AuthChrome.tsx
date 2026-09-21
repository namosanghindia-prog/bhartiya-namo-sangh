"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AuthChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const wide = pathname === "/auth/signup" || pathname === "/auth/login";

  if (wide) {
    return <div className="min-h-screen bg-[#f6f4f0]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-saffron-gradient px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-3">
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
