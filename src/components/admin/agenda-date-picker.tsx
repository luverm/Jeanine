"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

type View = "maand" | "week" | "dag";

export function AgendaDatePicker({
  view,
  currentDate,
  title,
}: {
  view: View;
  currentDate: Date;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(d: Date | undefined) {
    if (!d) return;
    setOpen(false);
    router.push(`/agenda?view=${view}&date=${format(d, "yyyy-MM-dd")}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="mt-4 inline-flex items-center gap-2 rounded-md px-2 py-1 text-lg font-semibold capitalize transition hover:bg-secondary"
        aria-label="Kies een datum"
        title="Kies een datum"
      >
        {title}
        <CalendarDays className="size-4 opacity-60" aria-hidden />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kies een datum</DialogTitle>
        </DialogHeader>
        <Calendar
          mode="single"
          locale={nl}
          weekStartsOn={1}
          selected={currentDate}
          onSelect={go}
          defaultMonth={currentDate}
        />
      </DialogContent>
    </Dialog>
  );
}
