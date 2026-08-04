const TIMELINE = [
  {
    year: "2022",
    title: "Founded in New Delhi",
    description:
      "Bhartiya Namo Sangh began with a small group of volunteers committed to community service.",
  },
  {
    year: "2023",
    title: "First 10 Branches",
    description:
      "Rapid growth across states as local coordinators established regional chapters.",
  },
  {
    year: "2024",
    title: "10,000+ Members",
    description:
      "Crossed a major membership milestone with active volunteers in 28+ branches.",
  },
  {
    year: "2025",
    title: "National Recognition",
    description:
      "Recognized for impact in education, environment, and disaster relief programs.",
  },
];

const VMV = [
  {
    title: "Vision",
    description:
      "A self-reliant, empowered Bharat where every citizen has the opportunity to contribute to national progress.",
  },
  {
    title: "Mission",
    description:
      "To mobilize volunteers and resources toward social, charitable, environmental, and educational impact across India.",
  },
  {
    title: "Values",
    description:
      "Seva (service), integrity, inclusivity, and unwavering commitment to community-first action.",
  },
];

const LEADERSHIP = [
  { name: "Rajesh Kumar", title: "Founder & President" },
  { name: "Priya Singh", title: "General Secretary" },
  { name: "Anil Sharma", title: "Treasurer" },
  { name: "Meena Iyer", title: "Head of Volunteer Programs" },
];

const ACHIEVEMENTS = [
  { label: "Members", value: "10,000+" },
  { label: "Events Organized", value: "500+" },
  { label: "Funds Raised", value: "₹5 Cr+" },
  { label: "Volunteer Hours", value: "1.2M+" },
];

export default function AboutPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            About Bhartiya Namo Sangh
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Our story, vision, and values
          </p>
        </div>
      </section>

      {/* STORY TIMELINE */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold text-navy text-center mb-12">
            Our Journey
          </h2>
          <div className="relative border-l-2 border-saffron-200 pl-8 space-y-10">
            {TIMELINE.map((item) => (
              <div key={item.year} className="relative">
                <span className="absolute -left-[38px] top-1 flex h-4 w-4 rounded-full bg-saffron-700 ring-4 ring-saffron-100" />
                <div className="font-heading text-xl font-semibold text-saffron-700">
                  {item.year}
                </div>
                <h3 className="mt-1 font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm text-navy/70">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION / MISSION / VALUES */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VMV.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-saffron-50 border border-saffron-200 p-8 text-center"
              >
                <h3 className="font-heading text-2xl font-semibold text-navy">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm text-navy/70">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP TEAM */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold text-navy text-center mb-12">
            Leadership Team
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {LEADERSHIP.map((person) => (
              <div key={person.name} className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-xl font-semibold text-saffron-800">
                  {person.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className="mt-3 font-semibold text-navy text-sm">
                  {person.name}
                </h3>
                <p className="text-xs text-navy/60">{person.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="bg-navy text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {ACHIEVEMENTS.map((item) => (
              <div key={item.label}>
                <div className="font-heading text-3xl sm:text-4xl font-semibold text-saffron-400">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-white/70">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
