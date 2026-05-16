import Link from "next/link";
import type { Metadata } from "next";
import { listStoragePortfolio } from "@/lib/portfolio";
import { PortfolioAdmin } from "@/components/admin/portfolio-admin";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const images = await listStoragePortfolio();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/instellingen"
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Instellingen
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Portfolio</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Foto&apos;s die je hier uploadt verschijnen op de portfolio- en
        homepagina.
      </p>

      <div className="mt-8">
        <PortfolioAdmin images={images} />
      </div>
    </div>
  );
}
