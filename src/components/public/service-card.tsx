import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDuration,
  formatPrice,
  type Service,
} from "@/lib/services-format";

export function ServiceCard({ service }: { service: Service }) {
  const bookable = service.kind === "regular" && service.is_online_bookable;
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{service.name}</h3>
        {service.kind === "bridal" && <Badge variant="secondary">Bruid</Badge>}
      </div>
      {service.description && (
        <p className="mt-2 text-sm text-muted-foreground">
          {service.description}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
        <span>{formatDuration(service.duration_min)}</span>
        <span aria-hidden>·</span>
        <span>{formatPrice(service.price_cents)}</span>
      </div>
      <div className="mt-auto pt-6">
        {bookable ? (
          <Link
            href={`/boeken?dienst=${service.slug}`}
            className="inline-flex rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            Boek deze dienst
          </Link>
        ) : (
          <Link
            href="/bruid/contact"
            className="inline-flex rounded-full border px-4 py-2 text-sm hover:bg-accent"
          >
            Plan een consult
          </Link>
        )}
      </div>
    </Card>
  );
}
