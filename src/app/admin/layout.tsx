"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/members", label: "Members", icon: "👥" },
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

  return (
    <div className="min-h-screen flex bg-saffron-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-saffron-200 bg-navy">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 h-16 border-b border-white/10"
        >
          <span className="text-xl" aria-hidden="true">
            🇮🇳
          </span>
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
                {item.label}
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-navy/70 hidden sm:inline">
              Admin User
            </span>
            <div className="h-9 w-9 rounded-full bg-navy flex items-center justify-center text-sm font-semibold text-white">
              AU
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
