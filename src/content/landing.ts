export const landing = {
  hero: {
    eyebrow: "Hair & bridal styling",
    title: "{{HERO_TITLE}}",
    subtitle: "{{HERO_SUBTITLE}}",
    primaryCta: { label: "Boek afspraak", href: "/boeken" },
    secondaryCta: { label: "Bruid? Plan consult", href: "/bruid" },
  },
  about: {
    title: "Over Jeanine",
    body: "{{OVER_MIJ_TEKST}}",
  },
  reviews: [
    {
      quote: "{{REVIEW_QUOTE_1}}",
      author: "{{REVIEW_AUTHOR_1}}",
    },
    {
      quote: "{{REVIEW_QUOTE_2}}",
      author: "{{REVIEW_AUTHOR_2}}",
    },
    {
      quote: "{{REVIEW_QUOTE_3}}",
      author: "{{REVIEW_AUTHOR_3}}",
    },
  ],
  bridal: {
    title: "Bruidsstyling",
    intro:
      "Jouw trouwdag verdient een styliste die meedenkt, niet alleen meekrult. Plan een vrijblijvend consult — we bespreken jouw look, locatie en planning.",
    bullets: [
      "Persoonlijk consult vooraf",
      "Proefsessie ruim voor de dag",
      "Op locatie of in de studio",
      "Bruidsmeisjes, moeder van de bruid en bridal party in één pakket",
    ],
    cta: { label: "Plan een consult", href: "/bruid/contact" },
  },
} as const;
