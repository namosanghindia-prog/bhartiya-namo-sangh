import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEventById } from "@/lib/events-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEventById(id);

  if (!event) {
    notFound();
  }

  const pct = Math.round(
    (event.registered / event.targetParticipants) * 100
  );

  return (
    <>
      {/* HERO */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/events"
            className="text-sm text-white/80 hover:text-white"
          >
            ← Back to Events
          </Link>
          <span className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            {event.category}
          </span>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-semibold">
            {event.title}
          </h1>
          <p className="mt-2 text-white/90">
            {formatDate(event.date)} &middot; {event.startTime} –{" "}
            {event.endTime}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-navy mb-3">
                About this event
              </h2>
              <p className="text-navy/70 leading-relaxed">
                {event.description}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-semibold text-navy mb-4">
                Agenda
              </h2>
              <div className="relative border-l-2 border-saffron-200 pl-6 space-y-6">
                {event.agenda.map((item, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-saffron-700 ring-4 ring-saffron-100" />
                    <div className="text-sm font-semibold text-saffron-700">
                      {item.time}
                    </div>
                    <div className="text-sm text-navy/70">
                      {item.activity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-navy/60">Date</dt>
                  <dd className="font-medium text-navy text-right">
                    {formatDate(event.date)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy/60">Time</dt>
                  <dd className="font-medium text-navy">
                    {event.startTime} – {event.endTime}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy/60">Location</dt>
                  <dd className="font-medium text-navy text-right">
                    {event.location}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy/60">Branch</dt>
                  <dd className="font-medium text-navy">{event.branch}</dd>
                </div>
              </dl>

              <div>
                <div className="flex justify-between text-xs text-navy/60 mb-1">
                  <span>
                    {event.registered} / {event.targetParticipants} registered
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                  <div
                    className="h-full bg-saffron-700"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-md bg-saffron-700 px-4 py-3 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors"
              >
                Register for this Event
              </button>
              <p className="text-xs text-navy/50 text-center">
                Login required to register
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
