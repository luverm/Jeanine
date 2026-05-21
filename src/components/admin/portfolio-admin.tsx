"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadPortfolio,
  deletePortfolio,
  reorderPortfolio,
} from "@/actions/portfolio";

type Img = { src: string; alt: string; name?: string };

export function PortfolioAdmin({ images }: { images: Img[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Img[]>(images);

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

  function remove(name?: string) {
    if (!name) return;
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

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    startTransition(async () => {
      const r = await reorderPortfolio(
        next.map((i) => i.name).filter((n): n is string => !!n),
      );
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
            Met de pijltjes pas je de volgorde aan — die volgorde wordt
            ook op de website gebruikt.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((img, i) => (
              <div key={img.name ?? img.src} className="group relative">
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[11px] font-medium text-background">
                    {i + 1}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    aria-label="Naar voren"
                    onClick={() => move(i, -1)}
                    disabled={pending || i === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    aria-label="Naar achteren"
                    onClick={() => move(i, 1)}
                    disabled={pending || i === items.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {img.name && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-1 w-full"
                    onClick={() => remove(img.name)}
                    disabled={pending}
                  >
                    Verwijder
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
