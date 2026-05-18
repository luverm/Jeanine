"use client";

import Image from "next/image";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadHero, deleteHero } from "@/actions/hero";

type Img = { src: string; alt: string; name?: string };

export function HeroAdmin({ images }: { images: Img[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function upload(formData: FormData) {
    startTransition(async () => {
      const r = await uploadHero(formData);
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
      const r = await deleteHero(name);
      if (r.ok) {
        toast.success("Verwijderd");
        router.refresh();
      } else {
        toast.error("Verwijderen mislukt.");
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
            {pending ? "Uploaden…" : "Upload hero-foto's"}
          </Button>
        </div>
      </form>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nog geen hero-foto&apos;s. Zolang dit leeg is gebruikt de
          homepagina automatisch je portfolio-foto&apos;s als hero.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.name ?? img.src} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg border">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              {img.name && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => remove(img.name)}
                  disabled={pending}
                >
                  Verwijder
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
