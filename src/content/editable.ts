// Registry of website text blocks Jeanine can edit from the admin
// (Instellingen → Teksten). Each block carries its built-in default;
// the DB only stores overrides, so the site works before migration
// 0020 is applied.

import { landing } from "@/content/landing";
import { faq } from "@/content/faq";
import { business } from "@/content/business";

export type EditableBlock = {
  key: string;
  label: string;
  defaultValue: string;
  multiline: boolean;
};

export type EditableGroup = {
  title: string;
  blocks: EditableBlock[];
};

/** Default for the /diensten intro (kept here so it's editable). */
export const DIENSTEN_INTRO_DEFAULT =
  "Knippen, kleuren en feestkapsels kun je eenvoudig online boeken. Voor bruidsstyling vraag je eerst jouw trouwdatum aan. Daarna neem ik contact met je op en kun je zelf de proefsessie inplannen. Tijdens de proefsessie nemen we rustig jouw gewenste look, locatie en planning door, zodat alles perfect aansluit op jouw trouwdag.";

const t = (
  key: string,
  label: string,
  defaultValue: string,
  multiline = false,
): EditableBlock => ({ key, label, defaultValue, multiline });

export const CONTENT_GROUPS: EditableGroup[] = [
  {
    title: "Homepage",
    blocks: [
      t("home.hero.eyebrow", "Hero — boventekst", landing.hero.eyebrow),
      t("home.hero.title", "Hero — titel", landing.hero.title),
      t("home.hero.subtitle", "Hero — ondertitel", landing.hero.subtitle, true),
      t("home.hero.cta1", "Hero — knop 1", landing.hero.primaryCta.label),
      t("home.hero.cta2", "Hero — knop 2", landing.hero.secondaryCta.label),
      t("home.services.title", "Diensten-blok — kop", "Diensten"),
      t("home.portfolio.title", "Portfolio-blok — kop", "Portfolio"),
      t("home.about.title", "Over Jeanine — kop", landing.about.title),
      t("home.about.body", "Over Jeanine — tekst", landing.about.body, true),
      t("home.reviews.title", "Reviews-blok — kop", "Reviews"),
    ],
  },
  {
    title: "Diensten",
    blocks: [
      t("diensten.intro", "Diensten — introtekst", DIENSTEN_INTRO_DEFAULT, true),
    ],
  },
  {
    title: "Bruid",
    blocks: [
      t("bruid.hero.title", "Hero — titel", landing.bridal.title),
      t("bruid.intro", "Hero — tekst", landing.bridal.intro, true),
      t("bruid.process.title", "Hoe het werkt — kop", "Van aanvraag tot de grote dag"),
      t("bruid.step1.title", "Stap 1 — titel", "Vraag je trouwdatum aan"),
      t(
        "bruid.step1.body",
        "Stap 1 — tekst",
        "Laat je trouwdatum en wensen achter. Ik laat je weten of de datum nog vrij is.",
        true,
      ),
      t("bruid.step2.title", "Stap 2 — titel", "Proefsessie"),
      t(
        "bruid.step2.body",
        "Stap 2 — tekst",
        "Een uitgebreide proefsessie van circa 3 uur in de salon — we bespreken je wensen en werken jouw droomkapsel uit.",
        true,
      ),
      t("bruid.step3.title", "Stap 3 — titel", "De grote dag"),
      t(
        "bruid.step3.body",
        "Stap 3 — tekst",
        "Ik ben ongeveer 2.5 uur bezig met je haar en make-up, zodat alles tot in detail klopt. Daarna heb je nog een half uur om rustig je jurk aan te trekken en je klaar te maken voor dit bijzondere moment. Als je jurk aan is plaats ik de sluier, en is het plaatje compleet.",
        true,
      ),
      t(
        "bruid.step3.note",
        "Stap 3 — opmerking (laat leeg om te verbergen)",
        "De avond voor de bruiloft was je je haren 2 keer met shampoo en de lengten met conditioner. Geen stylingsproducten gebruiken.",
        true,
      ),
      t("bruid.services.title", "Bruidsdiensten — kop", "Bruidsdiensten"),
      t(
        "bruid.services.intro",
        "Bruidsdiensten — tekst",
        "Geen directe online boeking — je vraagt je trouwdatum aan en we plannen samen de proefsessie en de dag zelf.",
        true,
      ),
      t("bruid.cta.title", "Slot — kop", "Klaar om te plannen?"),
      t(
        "bruid.cta.body",
        "Slot — tekst",
        "Vertel kort over je trouwdag. Ik neem persoonlijk contact met je op.",
        true,
      ),
    ],
  },
  {
    title: "Bruid — aanvraagpagina",
    blocks: [
      t("bruidcontact.title", "Kop", "Vraag je trouwdatum aan"),
      t(
        "bruidcontact.intro",
        "Tekst",
        "Vertel kort over je trouwdag. Ik neem persoonlijk contact met je op.",
        true,
      ),
    ],
  },
  {
    title: "Bedankpagina (na aanvraag)",
    blocks: [
      t("bedankt.title", "Kop", "Van harte gefeliciteerd met jullie verloving!"),
      t(
        "bedankt.body",
        "Tekst",
        "Je aanvraag is goed bij mij binnengekomen. Ik lees alles rustig door en ik neem contact met je op met een persoonlijk antwoord. Heb je inspiratiebeelden of een Pinterest-bord? Stuur ze gerust mee als reply op de bevestigingsmail die je zo hebt ontvangen.",
        true,
      ),
    ],
  },
  {
    title: "Portfolio",
    blocks: [
      t(
        "portfolio.intro",
        "Portfolio — introtekst",
        "Een selectie van bruidsstyling, feestkapsels en haarstyling.",
        true,
      ),
    ],
  },
  {
    title: "Footer",
    blocks: [
      t(
        "site.tagline",
        "Footer — korte omschrijving (boven het adres)",
        business.tagline,
        true,
      ),
    ],
  },
  {
    title: "Veelgestelde vragen",
    blocks: faq.items.flatMap((it, i) => [
      t(`faq.${i}.q`, `Vraag ${i + 1}`, it.q),
      t(`faq.${i}.a`, `Antwoord ${i + 1}`, it.a, true),
    ]),
  },
];

export const ALL_BLOCKS: EditableBlock[] = CONTENT_GROUPS.flatMap(
  (g) => g.blocks,
);

/** Map of every key to its built-in default value. */
export function contentDefaults(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const b of ALL_BLOCKS) out[b.key] = b.defaultValue;
  return out;
}
