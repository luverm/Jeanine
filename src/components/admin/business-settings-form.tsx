"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessSettingsAction } from "@/actions/settings";

type Values = {
  name: string;
  ownerName: string;
  tagline: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  kvk: string;
  btw: string;
  instagram: string;
  instagramUrl: string;
  tiktok: string;
};

function clean(v: string) {
  return v && !v.startsWith("{{") ? v : "";
}

function Field({
  name,
  label,
  value,
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={clean(value)}
        className="mt-1.5"
      />
    </div>
  );
}

export function BusinessSettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const r = await updateBusinessSettingsAction(formData);
      if (r.ok) {
        toast.success("Opgeslagen");
        router.refresh();
      } else {
        toast.error("Opslaan mislukt.");
      }
    });
  }

  return (
    <form action={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Bedrijfsnaam" value={initial.name} />
        <Field name="ownerName" label="Eigenaar" value={initial.ownerName} />
      </div>
      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Textarea
          id="tagline"
          name="tagline"
          rows={2}
          defaultValue={clean(initial.tagline)}
          className="mt-1.5"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="email" label="E-mail" value={initial.email} type="email" />
        <Field name="phone" label="Telefoon" value={initial.phone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="street" label="Straat + nr" value={initial.street} />
        <Field name="postcode" label="Postcode" value={initial.postcode} />
        <Field name="city" label="Plaats" value={initial.city} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="kvk" label="KvK" value={initial.kvk} />
        <Field name="btw" label="BTW" value={initial.btw} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          name="instagram"
          label="Instagram handle"
          value={initial.instagram}
        />
        <Field
          name="instagramUrl"
          label="Instagram URL"
          value={initial.instagramUrl}
        />
        <Field name="tiktok" label="TikTok" value={initial.tiktok} />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </form>
  );
}
