"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical, Star } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ServiceRow } from "@/components/admin/service-row";
import {
  reorderServicesAction,
  setFeaturedServiceAction,
} from "@/actions/service";
import type { Service } from "@/lib/services-format";

export function ServiceList({
  services,
  featuredIds = [],
}: {
  services: Service[];
  featuredIds?: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Service[]>(services);
  const [featured, setFeatured] = useState<Set<string>>(
    () => new Set(featuredIds),
  );
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      const r = await reorderServicesAction(next.map((s) => s.id));
      if (!r.ok) toast.error("Volgorde opslaan mislukt.");
      router.refresh();
    });
  }

  function toggleFeatured(id: string) {
    const willFeature = !featured.has(id);
    const next = new Set(featured);
    if (willFeature) next.add(id);
    else next.delete(id);
    setFeatured(next);
    startTransition(async () => {
      const r = await setFeaturedServiceAction(id, willFeature);
      if (!r.ok) {
        toast.error("Homepage-selectie opslaan mislukt.");
        setFeatured(featured);
        return;
      }
      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-2">
          {items.map((s) => (
            <SortableRow
              key={s.id}
              service={s}
              featured={featured.has(s.id)}
              onToggleFeatured={() => toggleFeatured(s.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  service,
  featured,
  onToggleFeatured,
}: {
  service: Service;
  featured: boolean;
  onToggleFeatured: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Versleep om de volgorde te wijzigen"
        className="flex w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border text-muted-foreground hover:bg-accent active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <ServiceRow service={service} />
      </div>
      <button
        type="button"
        onClick={onToggleFeatured}
        aria-pressed={featured}
        title={
          featured
            ? "Wordt getoond op de homepage — klik om te verbergen"
            : "Niet op de homepage — klik om te tonen"
        }
        className={`flex w-9 shrink-0 items-center justify-center rounded-md border transition ${
          featured
            ? "border-primary bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent"
        }`}
      >
        <Star className={`h-4 w-4 ${featured ? "fill-current" : ""}`} />
        <span className="sr-only">
          {featured ? "Van homepage halen" : "Op homepage tonen"}
        </span>
      </button>
    </div>
  );
}
