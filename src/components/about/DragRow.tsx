"use client";

import { useRef, type ReactNode } from "react";

export default function DragRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scroll: 0 });

  return (
    <div
      ref={scroller}
      className={`flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-4 active:cursor-grabbing ${className}`}
      style={{ scrollbarWidth: "thin" }}
      onPointerDown={(e) => {
        const el = scroller.current;
        if (!el) return;
        drag.current = { active: true, startX: e.clientX, scroll: el.scrollLeft };
        el.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current.active || !scroller.current) return;
        scroller.current.scrollLeft =
          drag.current.scroll - (e.clientX - drag.current.startX);
      }}
      onPointerUp={() => {
        drag.current.active = false;
      }}
      onPointerCancel={() => {
        drag.current.active = false;
      }}
    >
      {children}
    </div>
  );
}
