import ChangePasswordForm from "@client/features/auth/components/ChangePasswordForm";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const token = (await searchParams).token;
  console.log(await searchParams)
  return (
    <ChangePasswordForm token={token} />
  );
}
