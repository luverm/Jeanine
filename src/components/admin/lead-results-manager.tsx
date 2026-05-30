"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadLeadResults,
  deleteLeadResult,
} from "@/actions/bridal-upload";

export type LeadResultPhoto = { path: string; url: string };

export function LeadResultsManager({
  leadId,
  initial,
}: {
  leadId: string;
  initial: LeadResultPhoto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<LeadResultPhoto[]>(initial);
  const fileInput = useRef<HTMLInputElement>(null);

  function onPick() {
    fileInput.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    startTransition(async () => {
      const result = await uploadLeadResults(leadId, fd);
      if (result.ok) {
        toast.success(
          result.paths && result.paths.length > 0
            ? `${result.paths.length} foto's geüpload`
            : "Geen geldige foto's geselecteerd",
        );
        router.refresh();
      } else {
        toast.error("Uploaden mislukt.");
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  function onDelete(path: string) {
    if (!confirm("Deze foto definitief verwijderen?")) return;
    startTransition(async () => {
      const result = await deleteLeadResult(leadId, path);
      if (result.ok) {
        setPhotos((prev) => prev.filter((p) => p.path !== path));
        toast.success("Foto verwijderd");
        router.refresh();
      } else {
        toast.error("Verwijderen mislukt.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Alleen jij ziet deze foto&apos;s — niet de bruid of bezoekers.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPick}
          disabled={pending}
        >
          <Upload className="h-4 w-4" aria-hidden />
          Foto&apos;s uploaden
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={onChange}
        />
      </div>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div
              key={p.path}
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              <a href={p.url} target="_blank" rel="noreferrer">
                <Image
                  src={p.url}
                  alt="Eindresultaat"
                  width={400}
                  height={400}
                  unoptimized
                  className="aspect-square w-full object-cover"
                />
              </a>
              <button
                type="button"
                onClick={() => onDelete(p.path)}
                disabled={pending}
                aria-label="Foto verwijderen"
                className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-destructive opacity-0 shadow transition group-hover:opacity-100 hover:bg-background"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nog geen eindresultaat-foto&apos;s. Upload ze hierboven.
        </p>
      )}
    </div>
  );
}
