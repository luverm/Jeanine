import type { Metadata } from "next";
import { faq } from "@/content/faq";
import { business } from "@/content/business";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description: faq.intro,
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.items.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a },
          })),
        }}
      />

      <h1 className="text-4xl tracking-tight sm:text-5xl">
        Veelgestelde vragen
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{faq.intro}</p>

      <dl className="mt-12 divide-y">
        {faq.items.map((it) => (
          <div key={it.q} className="py-6">
            <dt className="text-lg font-medium">{it.q}</dt>
            <dd className="mt-2 leading-relaxed text-muted-foreground">
              {it.a}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-12 text-sm text-muted-foreground">
        Andere vraag? Neem gerust contact op met {business.ownerName}.
      </p>
    </div>
  );
}
