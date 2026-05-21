// Registry of website text blocks Jeanine can edit from the admin
// (Instellingen → Teksten). Each block carries its built-in default;
// the DB only stores overrides, so the site works before migration
// 0020 is applied.

import { landing } from "@/content/landing";
import { faq } from "@/content/faq";

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

export const CONTENT_GROUPS: EditableGroup[] = [
  {
    title: "Homepage",
    blocks: [
      {
        key: "home.hero.title",
        label: "Hero — titel",
        defaultValue: landing.hero.title,
        multiline: false,
      },
      {
        key: "home.hero.subtitle",
        label: "Hero — ondertitel",
        defaultValue: landing.hero.subtitle,
        multiline: true,
      },
      {
        key: "home.about.title",
        label: "Over Jeanine — kop",
        defaultValue: landing.about.title,
        multiline: false,
      },
      {
        key: "home.about.body",
        label: "Over Jeanine — tekst",
        defaultValue: landing.about.body,
        multiline: true,
      },
    ],
  },
  {
    title: "Diensten",
    blocks: [
      {
        key: "diensten.intro",
        label: "Diensten — introtekst",
        defaultValue: DIENSTEN_INTRO_DEFAULT,
        multiline: true,
      },
    ],
  },
  {
    title: "Bruid",
    blocks: [
      {
        key: "bruid.intro",
        label: "Bruidsstyling — tekst",
        defaultValue: landing.bridal.intro,
        multiline: true,
      },
    ],
  },
  {
    title: "Veelgestelde vragen",
    blocks: faq.items.flatMap((it, i) => [
      {
        key: `faq.${i}.q`,
        label: `Vraag ${i + 1}`,
        defaultValue: it.q,
        multiline: false,
      },
      {
        key: `faq.${i}.a`,
        label: `Antwoord ${i + 1}`,
        defaultValue: it.a,
        multiline: true,
      },
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
