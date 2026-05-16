import VerificationForm from "@client/features/auth/components/VerificationForm";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const tfaToken = (await searchParams).token;
  if (!tfaToken) {
    return <h1>Invalid token</h1>;
  }
  return (
    <VerificationForm token={tfaToken} />
  );
}
