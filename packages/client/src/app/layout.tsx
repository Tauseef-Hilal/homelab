import "@client/styles/global.css";
import { ReactQueryProvider } from "@client/providers/reactQuery.provider";
import type { Metadata } from "next";
import { inter } from "@client/styles/fonts";
import { Toaster } from "sonner";
import Me from "@client/components/Me";

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
      <body
        className={`dark:bg-black dark:text-white bg-gray-50 text-gray-900 ${inter.className}`}
      >
        <ReactQueryProvider>
          {children}
          <Toaster />
          <Me />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
