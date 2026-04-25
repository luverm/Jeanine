"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateLeadStatusAction } from "@/actions/lead";
import type { LeadRow, LeadStatus } from "@/lib/db/leads";

const COLUMNS: Array<{ id: LeadStatus; title: string }> = [
  { id: "new", title: "Nieuw" },
  { id: "contacted", title: "Contact gehad" },
  { id: "quoted", title: "Voorstel" },
  { id: "won", title: "Won" },
  { id: "lost", title: "Lost" },
];

export function LeadsKanban({ initial }: { initial: LeadRow[] }) {
  const [leads, setLeads] = useState<LeadRow[]>(initial);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const map: Record<LeadStatus, LeadRow[]> = {
      new: [],
      contacted: [],
      quoted: [],
      won: [],
      lost: [],
    };
    for (const lead of leads) map[lead.status].push(lead);
    return map;
  }, [leads]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const newStatus = String(over.id) as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update.
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    );

    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, newStatus);
      if (!result.ok) {
        // Roll back.
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l)),
        );
        toast.error("Wijzigen mislukt — probeer het opnieuw.");
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <Column key={col.id} status={col.id} title={col.title} leads={grouped[col.id]} />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  status,
  title,
  leads,
}: {
  status: LeadStatus;
  title: string;
  leads: LeadRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={
        "rounded-lg border bg-muted/20 p-3 transition " +
        (isOver ? "border-foreground bg-muted/40" : "")
      }
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{leads.length}</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
            Leeg
          </p>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: LeadRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-md border bg-background p-3 text-sm shadow-sm hover:shadow"
    >
      <Link href={`/leads/${lead.id}`} className="block">
        <p className="font-medium">{lead.full_name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lead.wedding_date ?? "datum onbekend"}
        </p>
        {lead.location && (
          <p className="text-xs text-muted-foreground">{lead.location}</p>
        )}
        {typeof lead.party_size === "number" && (
          <p className="mt-1 text-xs text-muted-foreground">
            {lead.party_size} {lead.party_size === 1 ? "persoon" : "personen"}
          </p>
        )}
      </Link>
    </div>
  );
}
