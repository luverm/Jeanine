"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadDocumentAction } from "@/actions/documents";

export function DocumentsAdmin({
  brochureUrl,
  proefkapselUrl,
}: {
  brochureUrl: string;
  proefkapselUrl: string;
}) {
  return (
    <div className="grid gap-4">
      <DocSlot
        slot="brochure"
        label="Bruidsbrochure"
        currentUrl={brochureUrl}
        fallback="/brochure-bruidsstyling.pdf"
      />
      <DocSlot
        slot="proefkapsel"
        label="Info proefkapsel"
        currentUrl={proefkapselUrl}
        fallback="/proefkapsel-info.pdf"
      />
    </div>
  );
}

function DocSlot({
  slot,
  label,
  currentUrl,
  fallback,
}: {
  slot: "brochure" | "proefkapsel";
  label: string;
  currentUrl: string;
  fallback: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const activeUrl = currentUrl || fallback;

  function upload(formData: FormData) {
    startTransition(async () => {
      const r = await uploadDocumentAction(formData);
      if (r.ok) {
        toast.success("PDF geüpload");
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(r.message ?? "Upload mislukt.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={upload}
      className="grid gap-3 rounded-lg border p-4"
    >
      <input type="hidden" name="slot" value={slot} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Huidige versie:{" "}
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            bekijk PDF
          </a>
          {currentUrl ? "" : " (standaardbestand)"}
        </p>
      </div>
      <input
        type="file"
        name="file"
        accept="application/pdf"
        className="text-sm"
      />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Uploaden…" : "Nieuwe PDF uploaden"}
        </Button>
      </div>
    </form>
  );
}
