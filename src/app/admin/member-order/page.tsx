"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import type { PublicMember } from "@/lib/supabase/types";
import { orderMembers, fetchPositions } from "@/lib/member-order";

function MemberTile({
  member,
  position,
  placed,
}: {
  member: PublicMember;
  position: number;
  placed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: member.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${member.first_name} ${member.last_name}, position ${position}`}
      className={`relative select-none touch-manipulation cursor-grab active:cursor-grabbing rounded-xl border bg-white p-4 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 ${
        isDragging
          ? "z-10 border-saffron-500 shadow-lg opacity-90"
          : "border-saffron-200 hover:border-saffron-400"
      }`}
    >
      <span className="absolute left-2 top-2 rounded-full bg-saffron-100 px-2 py-0.5 text-xs font-semibold text-saffron-800">
        {position}
      </span>
      {!placed && (
        <span className="absolute right-2 top-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          New
        </span>
      )}
      {member.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatar_url}
          alt=""
          draggable={false}
          className="mx-auto h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="mx-auto h-14 w-14 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-lg font-semibold text-saffron-800">
          {member.first_name[0]}
          {member.last_name[0]}
        </div>
      )}
      <p className="mt-3 text-sm font-semibold text-navy break-words">
        {member.first_name} {member.last_name}
      </p>
      {member.designation && (
        <p className="mt-0.5 text-xs text-navy/60 break-words">{member.designation}</p>
      )}
    </li>
  );
}

export default function MemberOrderPage() {
  const [members, setMembers] = useState<PublicMember[]>([]);
  // The order as last saved, to detect unsaved changes and to undo them.
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const sensors = useSensors(
    // A short drag threshold so a click doesn't start a drag; press-and-hold
    // on touch so the page can still be scrolled past the cards.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      // Same source and ordering as the public page, so what is arranged here
      // is exactly what visitors see.
      const [{ data, error }, positions] = await Promise.all([
        supabase.from("public_members").select("*"),
        fetchPositions(supabase),
      ]);

      if (error) {
        console.error("Failed to load members:", error);
        setMessage({ type: "err", text: "Failed to load members: " + error.message });
      } else if (data) {
        const ordered = orderMembers(data, positions);
        setMembers(ordered);
        setSavedIds(ordered.map((m) => m.id));
        setPlacedIds(new Set(positions.keys()));
      }
      setLoading(false);
    }
    load();
  }, []);

  const dirty = members.some((m, i) => m.id !== savedIds[i]);
  const hasUnplaced = members.some((m) => !placedIds.has(m.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMembers((prev) => {
      const from = prev.findIndex((m) => m.id === active.id);
      const to = prev.findIndex((m) => m.id === over.id);
      return arrayMove(prev, from, to);
    });
    setMessage(null);
  }

  function handleUndo() {
    const byId = new Map(members.map((m) => [m.id, m]));
    setMembers(savedIds.map((id) => byId.get(id)!));
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const ids = members.map((m) => m.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_member_display_order", { member_ids: ids });

    if (error) {
      console.error("Failed to save member order:", error);
      setMessage({ type: "err", text: "Failed to save the order: " + error.message });
    } else {
      setSavedIds(ids);
      setPlacedIds(new Set(ids));
      setMessage({ type: "ok", text: "Order saved. The members page now shows this order." });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">Member Order</h1>
          <p className="mt-1 text-sm text-navy/60 max-w-2xl">
            Drag the cards into the order they should appear on the public
            members page, then save. On a phone, press and hold a card to pick
            it up. With a keyboard, focus a card, press Space, move it with the
            arrow keys and press Space again.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={!dirty || saving}
            className="rounded-md border border-saffron-200 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50 disabled:opacity-50"
          >
            Undo changes
          </button>
          <button
            onClick={handleSave}
            disabled={(!dirty && !hasUnplaced) || saving}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save order"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-forest/10 text-forest border border-forest/20"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {dirty && !message && (
        <p className="text-sm text-saffron-800">You have unsaved changes.</p>
      )}

      {hasUnplaced && !loading && (
        <p className="text-xs text-navy/60">
          Cards marked <span className="font-medium text-blue-700">New</span> have
          no saved position yet. On the public page they appear after everyone
          else until you save an order that includes them.
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center text-navy/60">
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center text-navy/60">
          No members are shown on the public page yet.
        </div>
      ) : (
        <DndContext
          id="member-order"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={members.map((m) => m.id)} strategy={rectSortingStrategy}>
            <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member, idx) => (
                <MemberTile
                  key={member.id}
                  member={member}
                  position={idx + 1}
                  placed={placedIds.has(member.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
