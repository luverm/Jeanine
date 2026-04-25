import { describe, expect, it, vi, beforeEach } from "vitest";

const insertedLeads: Array<{ id: string }> = [];

vi.mock("@/lib/db/leads", () => ({
  insertLead: vi.fn(async (input: { email: string }) => {
    const row = {
      id: `lead-${insertedLeads.length + 1}`,
      full_name: "x",
      email: input.email,
      phone: null,
      wedding_date: null,
      location: null,
      party_size: null,
      services_wanted: null,
      budget_cents: null,
      message: null,
      status: "new",
      assigned_staff: null,
      created_at: "",
      updated_at: "",
    };
    insertedLeads.push({ id: row.id });
    return row;
  }),
  updateLeadStatus: vi.fn(async () => {}),
}));

vi.mock("@/lib/db/bookings", () => ({
  writeAuditLog: vi.fn(async () => {}),
}));

const verifyMock = vi.fn(async (token: string, ip?: string) => {
  void token;
  void ip;
  return true;
});
vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: (token: string, ip?: string) => verifyMock(token, ip),
}));

vi.mock("@/lib/request-ip", () => ({
  getClientIp: async () => "10.0.0.1",
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(async () => ({ id: "stub" })),
}));

import { createLead } from "@/actions/lead";
import { _resetRateLimitStore } from "@/lib/rate-limit";

const validInput = {
  fullName: "Anna de Vries",
  email: "anna@example.com",
  phone: "+31612345678",
  weddingDate: "2099-06-15",
  city: "Amsterdam",
  postcode: "1011 AB",
  partySize: 4,
  servicesWanted: ["bruid", "proefsessie"],
  budgetCents: 200000,
  message: "Op locatie graag.",
  website: "",
  turnstileToken: "ts-ok",
};

beforeEach(() => {
  insertedLeads.length = 0;
  _resetRateLimitStore();
  verifyMock.mockReset();
  verifyMock.mockResolvedValue(true);
});

describe("createLead", () => {
  it("inserts a lead for valid input", async () => {
    const result = await createLead(validInput);
    expect(result.ok).toBe(true);
    expect(insertedLeads.length).toBe(1);
  });

  it("rejects when honeypot is filled", async () => {
    const result = await createLead({ ...validInput, website: "spam" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
    expect(insertedLeads.length).toBe(0);
  });

  it("returns VERIFICATION_FAILED when Turnstile rejects", async () => {
    verifyMock.mockResolvedValueOnce(false);
    const result = await createLead(validInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VERIFICATION_FAILED");
    expect(insertedLeads.length).toBe(0);
  });

  it("rate-limits after 3 successful requests within the window", async () => {
    const a = await createLead(validInput);
    const b = await createLead(validInput);
    const c = await createLead(validInput);
    const d = await createLead(validInput);
    expect(a.ok && b.ok && c.ok).toBe(true);
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.code).toBe("RATE_LIMITED");
    expect(insertedLeads.length).toBe(3);
  });

  it("rejects past wedding dates", async () => {
    const result = await createLead({ ...validInput, weddingDate: "2000-01-01" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
  });

  it("rejects empty servicesWanted", async () => {
    const result = await createLead({ ...validInput, servicesWanted: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
  });
});
