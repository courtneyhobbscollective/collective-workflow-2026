import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <LoginForm error={sp.error} resetSuccess={sp.reset === "1"} />
    </div>
  );
}
