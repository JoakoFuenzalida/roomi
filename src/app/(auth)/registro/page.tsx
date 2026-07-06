import { RegistroForm } from "./form";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <RegistroForm callbackUrl={callbackUrl} />;
}
