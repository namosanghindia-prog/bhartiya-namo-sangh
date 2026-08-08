"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SocialLinks {
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    async function loadSocialLinks() {
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_settings")
        .select("facebook_url, instagram_url, youtube_url")
        .eq("id", 1)
        .single();

      if (data) {
        setSocialLinks(data);
      }
    }
    loadSocialLinks();
  }, []);

  const hasSocialLinks = socialLinks && (
    socialLinks.facebook_url || socialLinks.instagram_url || socialLinks.youtube_url
  );

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

            {/* Social icons */}
            {hasSocialLinks && (
              <div className="flex gap-3 mt-4">
                {socialLinks?.facebook_url && (
                  <a
                    href={socialLinks.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit our Facebook page"
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                )}
                {socialLinks?.instagram_url && (
                  <a
                    href={socialLinks.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit our Instagram page"
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                )}
                {socialLinks?.youtube_url && (
                  <a
                    href={socialLinks.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit our YouTube channel"
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
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
