import Link from "next/link";
import HeroSlider from "@/components/layout/HeroSlider";
import HomeGalleryStrip from "@/components/HomeGalleryStrip";

const STATS = [
  { label: "Members", value: "10,000+" },
  { label: "Events Held", value: "500+" },
  { label: "Funds Raised", value: "₹5 Cr+" },
  { label: "Branches", value: "28+" },
];

const PILLARS = [
  {
    title: "Social Impact",
    description:
      "Community programs that strengthen neighborhoods and support the underserved.",
    icon: "🤝",
  },
  {
    title: "Political Advocacy",
    description:
      "Encouraging civic participation and awareness in the spirit of nation-building.",
    icon: "🗳️",
  },
  {
    title: "Environmental Action",
    description:
      "Clean-up drives, tree plantations, and sustainability campaigns across branches.",
    icon: "🌱",
  },
  {
    title: "Education",
    description:
      "Skill-building and learning initiatives for students and communities alike.",
    icon: "📚",
  },
];

// The gallery strip below reads live data, so rebuild the page periodically
// rather than serving the build-time snapshot forever. Five minutes keeps the
// homepage statically served while newly uploaded photos still show up
// promptly.
export const revalidate = 300;

export default async function HomePage() {
  return (
    <>
      {/* HERO SLIDER — editable via /admin/homepage-slider */}
      <HeroSlider />

      {/* STATS */}
      <section className="bg-white border-b border-saffron-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-3xl sm:text-4xl font-semibold text-saffron-700">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-navy/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION PILLARS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-navy">
              Our Mission
            </h2>
            <p className="mt-3 text-navy/70 max-w-2xl mx-auto">
              Following the vision of nation-building, we work across four
              core pillars.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-saffron-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3" aria-hidden="true">
                  {pillar.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-saffron-700">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-navy/70">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-saffron-50 border-y border-saffron-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-3xl mb-3" aria-hidden="true">
            📷
          </div>
          <h2 className="font-heading text-3xl font-semibold text-navy">
            Moments From Our Work
          </h2>
          <p className="mt-3 text-navy/70 max-w-xl mx-auto">
            Photographs from our events, drives and community programs across
            India.
          </p>
          <HomeGalleryStrip />

          <Link
            href="/gallery"
            className="mt-8 inline-block rounded-md bg-saffron-700 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors"
          >
            View Photo Gallery
          </Link>
        </div>
      </section>

      {/* DONATION CTA */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-heading text-3xl font-semibold">
            Support the Mission
          </h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            Every contribution matters. Help us reach more communities across
            India.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {["₹500", "₹1,000", "₹5,000"].map((amount) => (
              <Link
                key={amount}
                href="/donate"
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                {amount}
              </Link>
            ))}
            <Link
              href="/donate"
              className="rounded-md bg-saffron-700 px-6 py-3 text-sm font-semibold hover:bg-saffron-800 transition-colors"
            >
              Custom Amount
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
