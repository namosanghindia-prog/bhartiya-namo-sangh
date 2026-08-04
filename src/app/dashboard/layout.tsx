"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CURRENT_MEMBER } from "@/lib/dashboard-data";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
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

  return (
    <div className="min-h-screen flex bg-saffron-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-saffron-200 bg-white">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 h-16 border-b border-saffron-100"
        >
          <span className="text-xl" aria-hidden="true">
            🇮🇳
          </span>
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-navy/70 hidden sm:inline">
              {CURRENT_MEMBER.firstName} {CURRENT_MEMBER.lastName}
            </span>
            <div className="h-9 w-9 rounded-full bg-saffron-200 flex items-center justify-center text-sm font-semibold text-saffron-800">
              {CURRENT_MEMBER.firstName[0]}
              {CURRENT_MEMBER.lastName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
