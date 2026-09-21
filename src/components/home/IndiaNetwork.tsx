import {
  indiaOutlinePath,
  NETWORK_CITIES,
  NETWORK_EDGES,
  projectLonLat,
} from "@/lib/home-content";

const VIEW_W = 1000;
const VIEW_H = 1140;
const OUTLINE = indiaOutlinePath(VIEW_W, VIEW_H);

const CITY_INDEX = new Map(NETWORK_CITIES.map((c) => [c.city, c]));

export default function IndiaNetwork({
  className = "",
  pulse = true,
  dim = false,
}: {
  className?: string;
  pulse?: boolean;
  dim?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={OUTLINE}
        fill={dim ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}
        stroke={dim ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.32)"}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Andaman */}
      <ellipse cx="850" cy="980" rx="10" ry="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      {NETWORK_EDGES.map(([a, b]) => {
        const from = CITY_INDEX.get(a);
        const to = CITY_INDEX.get(b);
        if (!from || !to) return null;
        const p1 = projectLonLat(from.lon, from.lat, VIEW_W, VIEW_H);
        const p2 = projectLonLat(to.lon, to.lat, VIEW_W, VIEW_H);
        return (
          <line
            key={`${a}-${b}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="rgba(255,166,81,0.35)"
            strokeWidth="1.2"
            className="home-dash"
          />
        );
      })}
      {NETWORK_CITIES.map((city) => {
        const p = projectLonLat(city.lon, city.lat, VIEW_W, VIEW_H);
        return (
          <g key={city.city} transform={`translate(${p.x} ${p.y})`}>
            {pulse ? (
              <circle r="9" className="home-map-pulse" fill="rgba(255,107,53,0.35)" />
            ) : null}
            <circle r="3.2" fill="#ffa651" />
          </g>
        );
      })}
    </svg>
  );
}
