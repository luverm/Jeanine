export const business = {
  name: "{{BEDRIJFSNAAM}}",
  ownerName: "{{VOORNAAM}} {{ACHTERNAAM}}",
  tagline: "{{TAGLINE}}",
  email: "{{ZAKELIJK_EMAIL}}",
  phone: "{{TELEFOON}}",
  whatsapp: "{{WHATSAPP_LINK}}",
  address: {
    street: "{{STRAAT_HUISNR}}",
    postcode: "{{POSTCODE}}",
    city: "{{STAD}}",
  },
  kvk: "{{KVK_NUMMER}}",
  btw: "{{BTW_NUMMER}}",
  iban: "{{IBAN}}",
  socials: {
    instagram: "{{INSTAGRAM_HANDLE}}",
    tiktok: "{{TIKTOK_HANDLE}}",
  },
  brand: {
    primaryHex: "{{PRIMARY_KLEUR}}",
    accentHex: "{{ACCENT_KLEUR}}",
    fontDisplay: "{{HEADING_FONT}}",
    fontBody: "{{BODY_FONT}}",
  },
} as const;
