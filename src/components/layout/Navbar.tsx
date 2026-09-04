"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/branches", label: "Branches" },
  { href: "/members", label: "Members" },
  { href: "/businesses", label: "Businesses" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-saffron-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Bhartiya Namo Sangh"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-heading text-lg font-semibold text-navy">
              Bhartiya Namo Sangh
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/80 hover:text-saffron-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-navy/80 hover:text-saffron-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/donate"
              className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors"
            >
              Donate Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-navy"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/80 hover:text-saffron-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-saffron-100" />
            <Link href="/auth/login" className="text-sm font-medium text-navy/80">
              Login
            </Link>
            <Link
              href="/donate"
              className="rounded-md bg-saffron-700 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Donate Now
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
