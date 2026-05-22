"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
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
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  uploadPortfolio,
  deletePortfolio,
  reorderPortfolio,
  setAboutImage,
  setBruidProcessImage,
  toggleBruidHeroImage,
} from "@/actions/portfolio";

type Img = { src: string; alt: string; name?: string };
type Photo = { src: string; alt: string; name: string };

export function PortfolioAdmin({
  images,
  aboutImage,
  processImage,
  heroImages = [],
}: {
  images: Img[];
  aboutImage: string;
  processImage: string;
  heroImages?: string[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Photo[]>(
    images.filter((i): i is Photo => typeof i.name === "string"),
  );
  const [aboutSel, setAboutSel] = useState(aboutImage);
  const [processSel, setProcessSel] = useState(processImage);
  const [heroSet, setHeroSet] = useState<Set<string>>(
    () => new Set(heroImages),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function upload(formData: FormData) {
    startTransition(async () => {
      const r = await uploadPortfolio(formData);
      if (r.ok) {
        toast.success(`${r.uploaded} foto('s) geüpload`);
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(r.message ?? "Upload mislukt.");
      }
    });
  }

  function remove(name: string) {
    startTransition(async () => {
      const r = await deletePortfolio(name);
      if (r.ok) {
        toast.success("Verwijderd");
        router.refresh();
      } else {
        toast.error("Verwijderen mislukt.");
      }
    });
  }

  function pickAbout(name: string) {
    const prev = aboutSel;
    setAboutSel(name);
    startTransition(async () => {
      const r = await setAboutImage(name);
      if (r.ok) {
        toast.success("Foto bij ‘Over Jeanine’ ingesteld");
      } else {
        setAboutSel(prev);
        toast.error("Instellen mislukt.");
      }
    });
  }

  function pickProcess(name: string) {
    const prev = processSel;
    const next = processSel === name ? "" : name;
    setProcessSel(next);
    startTransition(async () => {
      const r = await setBruidProcessImage(next);
      if (r.ok) {
        toast.success(
          next ? "Foto bij ‘Hoe het werkt’ ingesteld" : "Foto losgekoppeld",
        );
      } else {
        setProcessSel(prev);
        toast.error("Instellen mislukt.");
      }
    });
  }

  function toggleHero(name: string) {
    const selected = !heroSet.has(name);
    const next = new Set(heroSet);
    if (selected) next.add(name);
    else next.delete(name);
    setHeroSet(next);
    startTransition(async () => {
      const r = await toggleBruidHeroImage(name, selected);
      if (!r.ok) {
        setHeroSet(heroSet);
        toast.error("Opslaan mislukt.");
      }
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.name === active.id);
    const newIndex = items.findIndex((i) => i.name === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      const r = await reorderPortfolio(next.map((i) => i.name));
      if (!r.ok) {
        toast.error("Volgorde opslaan mislukt.");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-8">
      <form
        ref={formRef}
        action={upload}
        className="grid gap-3 rounded-lg border p-4"
      >
        <input
          type="file"
          name="files"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="text-sm"
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploaden…" : "Upload foto's"}
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nog geen foto&apos;s in Storage. Bundelde foto&apos;s uit{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">
            public/images/portfolio
          </code>{" "}
          blijven zichtbaar tot je hier uploadt.
        </p>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Sleep de foto&apos;s om de volgorde aan te passen. Met de knoppen
            kies je per foto waar hij verschijnt: <strong>Over Jeanine</strong>{" "}
            (homepage), <strong>Bruid-intro</strong> (foto bij &lsquo;Hoe het
            werkt&rsquo;) en <strong>Bruidsfoto</strong> (verschijnt in de
            wisselende foto&apos;s op de bruidspagina).
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.name)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((img, i) => (
                  <SortablePhoto
                    key={img.name}
                    img={img}
                    index={i}
                    pending={pending}
                    isAbout={img.name === aboutSel}
                    isProcess={img.name === processSel}
                    isHero={heroSet.has(img.name)}
                    onRemove={remove}
                    onPickAbout={pickAbout}
                    onPickProcess={pickProcess}
                    onToggleHero={toggleHero}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function RoleChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={
        "rounded-full border px-2 py-0.5 text-[11px] font-medium transition disabled:opacity-50 " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-accent")
      }
    >
      {label}
    </button>
  );
}

function SortablePhoto({
  img,
  index,
  pending,
  isAbout,
  isProcess,
  isHero,
  onRemove,
  onPickAbout,
  onPickProcess,
  onToggleHero,
}: {
  img: Photo;
  index: number;
  pending: boolean;
  isAbout: boolean;
  isProcess: boolean;
  isHero: boolean;
  onRemove: (name: string) => void;
  onPickAbout: (name: string) => void;
  onPickProcess: (name: string) => void;
  onToggleHero: (name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className={
          "relative aspect-square cursor-grab touch-none select-none overflow-hidden rounded-lg border bg-muted active:cursor-grabbing " +
          (isAbout ? "ring-2 ring-primary ring-offset-2" : "")
        }
      >
        <Image
          src={img.src}
          alt={img.alt}
          fill
          draggable={false}
          sizes="(max-width:768px) 50vw, 25vw"
          className="object-cover"
        />
        <span className="absolute left-1.5 top-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[11px] font-medium text-background">
          {index + 1}
        </span>
        <span className="absolute right-1.5 top-1.5 rounded bg-background/80 p-1 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <RoleChip
          label="Over Jeanine"
          active={isAbout}
          disabled={pending || isAbout}
          onClick={() => onPickAbout(img.name)}
        />
        <RoleChip
          label="Bruid-intro"
          active={isProcess}
          disabled={pending}
          onClick={() => onPickProcess(img.name)}
        />
        <RoleChip
          label="Bruidsfoto"
          active={isHero}
          disabled={pending}
          onClick={() => onToggleHero(img.name)}
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="mt-1 w-full"
        onClick={() => onRemove(img.name)}
        disabled={pending}
      >
        Verwijder
      </Button>
    </div>
  );
}
