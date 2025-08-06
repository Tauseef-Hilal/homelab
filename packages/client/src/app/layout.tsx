import "@/styles/globals.css";
import { ReactQueryProvider } from "@/providers/reactQuery.provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homelab",
  description: "Self-hosted LAN system for secure storage and messaging",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
