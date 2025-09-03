import { AuthForm } from "@client/features/auth/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="h-full flex items-center justify-center">
      <AuthForm mode="login" />
    </main>
  );
}
