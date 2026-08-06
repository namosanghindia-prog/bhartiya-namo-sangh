"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
  { href: "/dashboard/id-card", label: "My ID Card", icon: "🪪" },
  { href: "/dashboard/business", label: "My Business", icon: "🏪" },
  { href: "/dashboard/events", label: "My Events", icon: "📅" },
  { href: "/dashboard/donations", label: "Donations", icon: "💚" },
  { href: "/dashboard/activity", label: "Activity & Hours", icon: "📊" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function loadMember() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("members")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) setMember(data as Member);
      }
    }
    loadMember();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-saffron-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-saffron-200 bg-white">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 h-16 border-b border-saffron-100"
        >
          <Image
            src="/logo.png"
            alt="Bhartiya Namo Sangh"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-heading text-sm font-semibold text-navy">
            Bhartiya Namo Sangh
          </span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-saffron-100 text-saffron-800"
                    : "text-navy/70 hover:bg-saffron-50"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-saffron-100">
          <Link
            href="/"
            className="text-sm text-navy/60 hover:text-saffron-700"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between border-b border-saffron-200 bg-white px-4 sm:px-6">
          <span className="md:hidden font-heading text-sm font-semibold text-navy">
            Bhartiya Namo Sangh
          </span>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-saffron-50 transition-colors"
            >
              <span className="text-sm text-navy/70 hidden sm:inline">
                {member?.first_name || "Member"} {member?.last_name || ""}
              </span>
              {member?.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-saffron-200 flex items-center justify-center text-sm font-semibold text-saffron-800">
                  {member?.first_name?.[0] || "M"}
                  {member?.last_name?.[0] || ""}
                </div>
              )}
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-saffron-200 bg-white shadow-lg py-1">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-navy hover:bg-saffron-50"
                    onClick={() => setShowMenu(false)}
                  >
                    My Profile
                  </Link>
                  <hr className="my-1 border-saffron-100" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
