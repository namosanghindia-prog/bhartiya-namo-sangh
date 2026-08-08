"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-forest"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="font-heading text-2xl font-semibold text-navy">
        Email Verified!
      </h1>

      <p className="mt-3 text-navy/70">
        Your email address has been successfully verified.
      </p>

      <div className="mt-6 rounded-lg bg-saffron-50 border border-saffron-200 px-4 py-3">
        <p className="text-sm text-navy/70">
          Redirecting to login in{" "}
          <span className="font-semibold text-saffron-700">{countdown}</span>{" "}
          seconds...
        </p>
      </div>

      <Link
        href="/auth/login"
        className="mt-6 inline-block text-sm font-medium text-saffron-700 hover:text-saffron-800"
      >
        Click here to login now →
      </Link>
    </div>
  );
}
