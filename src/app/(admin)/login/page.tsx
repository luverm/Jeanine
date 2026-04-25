import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { business } from "@/content/business";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {business.name} — admin
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Voer je e-mailadres in om een magische inloglink te ontvangen.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      {params?.error && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Inloggen mislukt. De link is mogelijk verlopen — vraag een nieuwe aan.
        </p>
      )}
    </div>
  );
}
