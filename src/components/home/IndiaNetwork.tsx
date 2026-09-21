import {
  NETWORK_CITIES,
  NETWORK_EDGES,
  projectLonLat,
} from "@/lib/home-content";
import { INDIA_LAND_PATH, INDIA_MAP_VIEW } from "@/lib/india-official-map";

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
      viewBox={`0 0 ${INDIA_MAP_VIEW.w} ${INDIA_MAP_VIEW.h}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={INDIA_LAND_PATH}
        fill={dim ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}
        stroke={dim ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.32)"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {NETWORK_EDGES.map(([a, b]) => {
        const from = CITY_INDEX.get(a);
        const to = CITY_INDEX.get(b);
        if (!from || !to) return null;
        const p1 = projectLonLat(from.lon, from.lat);
        const p2 = projectLonLat(to.lon, to.lat);
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
        const p = projectLonLat(city.lon, city.lat);
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
