import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Bhartiya Namo Sangh"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-heading text-base font-semibold">
                Bhartiya Namo Sangh
              </span>
            </div>
            <p className="text-sm text-white/70">
              Building Bharat, one action at a time — serving communities
              across India through social, charitable, environmental, and
              educational initiatives.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-saffron-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/branches" className="hover:text-white">Branches</Link></li>
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/donate" className="hover:text-white">Donate</Link></li>
            </ul>
          </div>

          {/* Member Portal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-saffron-400 mb-4">
              Member Portal
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white">Become a Member</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-saffron-400 mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>New Delhi, India</li>
              <li>contact@bnsindia.org</li>
              <li><Link href="/contact" className="hover:text-white">Contact Form</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {year} Bhartiya Namo Sangh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
