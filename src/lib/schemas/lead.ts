import { z } from "zod";

export const BRIDAL_SERVICE_OPTIONS = [
  "bruid",
  "proefsessie",
  "bruidsmeisjes",
  "moeder-bruid",
  "hairextensions",
] as const;

export type BridalServiceOption = (typeof BRIDAL_SERVICE_OPTIONS)[number];

const phoneRegex = /^[+0-9()\s-]{6,20}$/;
const postcodeRegex = /^\d{4}\s?[A-Za-z]{2}$/;

const today = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const leadInputSchema = z.object({
  fullName: z.string().trim().min(2, "Naam is te kort").max(120),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres").max(254),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Ongeldig telefoonnummer")
    .max(20),
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Kies een datum")
    .refine((v) => v >= today(), "Trouwdatum moet in de toekomst liggen"),
  city: z.string().trim().min(2, "Stad is te kort").max(80),
  postcode: z
    .string()
    .trim()
    .regex(postcodeRegex, "Bijv. 1234 AB")
    .max(7),
  partySize: z
    .number({ message: "Vul aantal personen in" })
    .int()
    .min(1, "Minstens 1 persoon")
    .max(50, "Te groot — neem direct contact op"),
  servicesWanted: z
    .array(z.enum(BRIDAL_SERVICE_OPTIONS))
    .min(1, "Kies minimaal één dienst"),
  budgetCents: z
    .number()
    .int()
    .min(0)
    .max(2_000_000)
    .optional()
    .nullable(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot
  website: z.string().max(0).optional().or(z.literal("")),
  // Cloudflare Turnstile token
  turnstileToken: z.string().min(1, "Verifieer dat je geen robot bent"),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
