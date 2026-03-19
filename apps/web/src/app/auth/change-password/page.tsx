import ChangePasswordForm from "@client/features/auth/components/ChangePasswordForm";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const token = (await searchParams).token;
  console.log(await searchParams)
  return (
    <main className="h-full flex items-center justify-center">
      <ChangePasswordForm token={token} />
    </main>
  );
}
