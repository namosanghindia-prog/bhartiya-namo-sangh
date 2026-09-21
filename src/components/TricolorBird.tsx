"use client";

import { useEffect, useRef } from "react";

const HIDE_AFTER_MS = 700;

export default function TricolorBird() {
  const elRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -120, y: 80 });
  const target = useRef({ x: -120, y: 80 });
  const visible = useRef(false);
  const hideTimer = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduce) return;

    function reveal() {
      visible.current = true;
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        visible.current = false;
      }, HIDE_AFTER_MS);
    }

    function onMove(e: MouseEvent) {
      target.current = { x: e.clientX + 24, y: e.clientY - 18 };
      reveal();
    }

    function onWheel(e: WheelEvent) {
      target.current = {
        x: target.current.x + e.deltaX * 0.12 + e.deltaY * 0.04,
        y: target.current.y + e.deltaY * 0.18,
      };
      reveal();
    }

    function tick() {
      const el = elRef.current;
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      if (el) {
        const dx = target.current.x - pos.current.x;
        const rot = Math.max(-22, Math.min(22, dx * 0.18));
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) rotate(${rot}deg)`;
        el.style.opacity = visible.current ? "1" : "0";
      }
      raf.current = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
      window.clearTimeout(hideTimer.current);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed left-0 top-0 z-[80] hidden opacity-0 transition-opacity duration-300 md:block"
      style={{ willChange: "transform, opacity" }}
      aria-hidden="true"
    >
      <svg
        width="88"
        height="64"
        viewBox="0 0 120 86"
        fill="none"
        className="drop-shadow-[0_6px_10px_rgba(10,25,41,0.28)]"
      >
        <g className="tricolor-bird-wing origin-[52px_40px]">
          <path
            d="M48 40 C 28 8, 8 6, 4 18 C 18 16, 36 28, 50 44 Z"
            fill="#FF9933"
          />
          <path
            d="M50 46 C 22 58, 10 78, 18 82 C 22 68, 40 56, 56 48 Z"
            fill="#138808"
          />
        </g>
        <path
          d="M46 38 C 52 22, 78 18, 96 32 C 108 40, 108 52, 96 58 C 78 70, 52 64, 46 50 Z"
          fill="#FFFFFF"
          stroke="#0A1929"
          strokeWidth="1.2"
        />
        <circle cx="72" cy="44" r="9" fill="none" stroke="#000080" strokeWidth="1.4" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = 72 + Math.cos(a) * 2.2;
          const y1 = 44 + Math.sin(a) * 2.2;
          const x2 = 72 + Math.cos(a) * 8.2;
          const y2 = 44 + Math.sin(a) * 8.2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#000080"
              strokeWidth="0.9"
            />
          );
        })}
        <circle cx="72" cy="44" r="1.6" fill="#000080" />
        <path d="M96 36 C 108 28, 118 34, 116 40 C 118 44, 108 48, 96 46 Z" fill="#FF9933" />
        <circle cx="102" cy="36" r="2" fill="#0A1929" />
        <path d="M44 42 L 8 36 L 12 42 L 8 48 Z" fill="#FF9933" />
        <path d="M44 46 L 10 48 L 14 52 L 12 58 Z" fill="#FFFFFF" stroke="#0A1929" strokeWidth="0.6" />
        <path d="M44 50 L 14 60 L 18 64 L 16 70 Z" fill="#138808" />
      </svg>
    </div>
  );
}
