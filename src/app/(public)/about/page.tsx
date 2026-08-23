const PROGRAMMES = [
  "Digital India",
  "Start-up India",
  "Swachh Bharat Abhiyan",
  "Make in India",
  "MUDRA Bank Yojana",
  "Garib Kalyan Yojana",
  "PMKVY",
  "Sukanya Yojana",
  "PM-Kisan",
];

const MISSION_POINTS = [
  "Provide the required skills through training in non-traditional areas of employment.",
  "Create avenues for employment by increasing awareness of BNMS's vision and mission among like-minded people in society.",
  "Enlist the support of volunteers competent in the chosen area for imparting training.",
  "Create the necessary infrastructure to widen the scope and scale of training in chosen areas by mobilising funds from individual and institutional donors.",
  "Promote new projects and national policies of the Government of India — awareness for an eco-friendly environment, green and clean India, education, vocational training programmes, social work, skill development and self-employment training, placement facilities, and awareness programmes.",
  "Open branches of the organisation across India so that people receive good information and society has greater exposure to welfare initiatives.",
];

const VISION_POINTS = [
  "To enhance the socio-economic status of young underprivileged men and women by empowering them with self-confidence and the skills required to become independent and contribute to family and society.",
  "To create a workforce and team of professionals with analytical skills who can dream of a better world and transform that dream into reality.",
  "To create a dynamic and collaborative climate that broadens our team's competence, and to build an organisation that is resilient, flexible and productive — recognised for high ethical standards and responsiveness to the social environment.",
  "With these beliefs, BNMS will strive towards faster evolution and make its mark on the global academic map.",
];

const ACHIEVEMENT_STATS = [
  { label: "Candidates trained (2017–2019)", value: "1,200" },
  { label: "Secured jobs or self-business", value: "400" },
  { label: "Women in formal employment", value: "1,200" },
  { label: "Men & women to be skilled every year", value: "5,000" },
];

const LEADERSHIP = [
  {
    name: "Dr. Manoj Kumar Tomar “Mannu”",
    title: "National President & Founder",
    initials: "MT",
  },
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
            Educate a woman and a man to empower a family
          </p>
        </div>
      </section>

      {/* ABOUT US */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold text-navy text-center mb-10">
            Who We Are
          </h2>
          <div className="space-y-5 text-base leading-relaxed text-navy/80">
            <p>
              Bhartiya Namo Sangh (BNMS) is a non-government, non-profit,
              charitable association registered under the National Societies.
              Over the years, BNMS — with a clear purpose and a committed team —
              has expanded its innovative courses around national programmes
              and reached out to less-privileged women, men and farmers from
              different backgrounds with varied interests and skill sets.
            </p>
            <p>
              Determined to hold on to its strong belief,{" "}
              <em className="text-saffron-800 font-medium not-italic">
                &ldquo;Educate a woman and a man to empower a family&rdquo;
              </em>
              , BNMS constantly endeavours to explore and introduce new courses
              into its curriculum and to enhance its existing courses in order
              to create sustainable employment. With 1,200 women already
              employed in various formal employment sectors, BNMS envisions
              skilling another 5,000 women and men every year and inspiring
              them towards self-employment.
            </p>
            <p>
              BNMS is committed to building a strong and developed nation, and
              to the upliftment of lives across every section of the people of
              India.
            </p>
          </div>

          {/* Programmes */}
          <div className="mt-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-saffron-700 text-center mb-4">
              Programmes &amp; initiatives we work with
            </h3>
            <ul className="flex flex-wrap justify-center gap-2">
              {PROGRAMMES.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-saffron-50 border border-saffron-200 px-4 py-1.5 text-sm font-medium text-navy"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-8">
              <h2 className="font-heading text-2xl font-semibold text-navy">
                Our Mission &amp; Objectives
              </h2>
              <ul className="mt-5 space-y-3">
                {MISSION_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm leading-relaxed text-navy/75"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-700"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vision */}
            <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-8">
              <h2 className="font-heading text-2xl font-semibold text-navy">
                Our Vision
              </h2>
              <ul className="mt-5 space-y-3">
                {VISION_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm leading-relaxed text-navy/75"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-700"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold text-navy text-center mb-12">
            Leadership
          </h2>
          <div className="flex flex-wrap justify-center gap-10">
            {LEADERSHIP.map((person) => (
              <div key={person.name} className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-2xl font-semibold text-saffron-800">
                  {person.initials}
                </div>
                <h3 className="mt-4 font-semibold text-navy">{person.name}</h3>
                <p className="text-sm text-navy/60">{person.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="bg-navy text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold text-center mb-4">
            Our Achievements
          </h2>
          <p className="text-center text-sm text-white/70 max-w-3xl mx-auto mb-12">
            The organisation took the initiative for Swachh Bharat and trained
            1,200 candidates through awareness programmes in different sectors
            during 2017–2019, of whom 400 candidates have secured a job or
            started their own business. The organisation has received many
            commendable awards for its work in the social field.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {ACHIEVEMENT_STATS.map((item) => (
              <div key={item.label}>
                <div className="font-heading text-3xl sm:text-4xl font-semibold text-saffron-400">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-white/70">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
