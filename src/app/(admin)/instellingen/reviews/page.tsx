import Link from "next/link";
import type { Metadata } from "next";
import { listAllReviews } from "@/lib/db/reviews";
import { ReviewsAdmin } from "@/components/admin/reviews-admin";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ReviewsAdminPage() {
  let reviews;
  try {
    reviews = await listAllReviews();
  } catch {
    reviews = null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Zichtbare reviews verschijnen op de homepagina.
      </p>

      <div className="mt-8">
        {reviews === null ? (
          <p className="rounded-lg border p-6 text-sm text-muted-foreground">
            Reviews-tabel nog niet beschikbaar. Draai migratie 0007 in
            Supabase om dit te activeren.
          </p>
        ) : (
          <ReviewsAdmin
            initial={reviews.map((r) => ({
              id: r.id,
              author: r.author,
              quote: r.quote,
              is_visible: r.is_visible,
            }))}
          />
        )}
      </div>
    </div>
  );
}
