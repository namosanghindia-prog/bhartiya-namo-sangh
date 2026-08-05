"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/approvals", label: "Approvals", icon: "✅", badgeKey: "approvals" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/businesses", label: "Businesses", icon: "🏪" },
  { href: "/admin/promotions", label: "Promotions", icon: "📣", badgeKey: "promotions" },
  { href: "/admin/events", label: "Events", icon: "📅" },
  { href: "/admin/donations", label: "Donations", icon: "💰" },
  { href: "/admin/branches", label: "Branches", icon: "🏢" },
  { href: "/admin/homepage-slider", label: "Homepage Slider", icon: "🖼️" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const [admin, setAdmin] = useState<Member | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [approvalsRes, promotionsRes] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("business_promotions").select("*", { count: "exact", head: true }).in("status", ["requested", "payment_submitted", "payment_confirmed"]),
      ]);

      setBadgeCounts({
        approvals: approvalsRes.count || 0,
        promotions: promotionsRes.count || 0,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("members")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) setAdmin(data as Member);
      }
    }
    fetchData();
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-saffron-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-saffron-200 bg-navy">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 h-16 border-b border-white/10"
        >
          <Image
            src="/logo.png"
            alt="Bhartiya Namo Sangh"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-heading text-sm font-semibold text-white">
            BNS Admin
          </span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-saffron-700 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="text-sm text-white/50 hover:text-white">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between border-b border-saffron-200 bg-white px-4 sm:px-6">
          <span className="md:hidden font-heading text-sm font-semibold text-navy">
            BNS Admin
          </span>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-saffron-50 transition-colors"
            >
              <span className="text-sm text-navy/70 hidden sm:inline">
                {admin?.first_name || "Admin"} {admin?.last_name || ""}
              </span>
              {admin?.avatar_url ? (
                <img
                  src={admin.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-navy flex items-center justify-center text-sm font-semibold text-white">
                  {admin?.first_name?.[0] || "A"}
                  {admin?.last_name?.[0] || ""}
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
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-navy hover:bg-saffron-50"
                    onClick={() => setShowMenu(false)}
                  >
                    Member Dashboard
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
