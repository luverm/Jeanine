export const landing = {
  hero: {
    eyebrow: "Kapper & bruidsstyliste · Krabbendijke",
    title: "Van knipbeurt tot bruidskapsel",
    subtitle:
      "Knippen, kleuren en stylen in mijn salon in Krabbendijke — én bruidsstyling aan huis op jouw grote dag.",
    primaryCta: { label: "Boek afspraak", href: "/boeken" },
    secondaryCta: { label: "Bruid? Vraag je datum aan", href: "/bruid" },
  },
  about: {
    title: "Over Jeanine",
    body: "Mijn naam is Jeanine Matthijsse-Murre, ik ben 25 jaar en sinds 20 maart 2025 getrouwd met Ruben. Samen wonen wij in Zeeland, waar ik met veel liefde mijn eigen salon aan huis heb opgebouwd. Sinds september 2024 werk ik vanuit mijn salon, gevestigd boven de garage in Krabbendijke.\n\nIn mijn salon kun je terecht voor knippen, kleuren en feestkapsels. Ik werk met veel aandacht om een look te creëren die past bij jouw stijl en persoonlijkheid, zodat jij met een goed gevoel en stralend de deur uitgaat.\n\nDaarnaast ben ik gespecialiseerd in bruidsstyling aan huis. Op jouw trouwdag kom ik bij je thuis om een kapsel te creëren dat helemaal aansluit bij jouw jurk, wensen en de sfeer van de dag — zodat jij je op je allermooist voelt en vol vertrouwen kunt genieten van je grote dag.",
  },
  // Reviews are intentionally empty in v1 — the landing page falls back to
  // an Instagram CTA when the array is empty. Add real testimonials here
  // when ready (e.g. { quote: "...", author: "Sophie K." }).
  reviews: [] as ReadonlyArray<{ quote: string; author: string }>,
  bridal: {
    title: "Bruidsstyling",
    intro:
      "Een bruidskapsel dat helemaal bij jou past. Vraag je trouwdatum aan — daarna neem ik contact met je op en kun je zelf je proefsessie inplannen. Tijdens het proefkapsel werken we jouw droomkapsel helemaal uit. Ook is dit het moment waarop ik jou en je haar leer kennen, zodat ik op de bruiloft jouw perfecte bruidslook kan realiseren. Samen kijken we naar een look die past bij jouw jurk, stijl en wensen, waarbij mijn focus ligt op het creëren van een kapsel waarin jij je helemaal jezelf voelt op jouw trouwdag. Zo kun je vol vertrouwen stralen op jullie trouwdag.",
    bullets: [
      "Bruidshaarstyling aan huis op jouw trouwdag",
      "Uitgebreide proefsessie van circa 3 uur in de salon",
      "Luxe clip-in haarextensions wanneer nodig",
      "Bruidsmake-up en feestkapsels voor moeder, zussen of vriendinnen mogelijk",
    ],
    cta: { label: "Vraag je trouwdatum aan", href: "/bruid/contact" },
  },
} as const;
