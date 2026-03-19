import "@client/styles/global.css";
import type { Metadata } from "next";
import { ReactQueryProvider } from "@client/providers/reactQuery.provider";
import { inter } from "@client/styles/fonts";
import { Toaster } from "sonner";
import { AuthProvider } from "@client/components/AuthProvider";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                const theme = localStorage.getItem("theme");
                if (theme === "dark") {
                  document.documentElement.classList.add("dark");
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`dark:bg-black dark:text-white bg-gray-50 text-gray-900 noselect ${inter.className}`}
      >
        <ReactQueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              theme="system"
              position="bottom-right"
              richColors
              closeButton
            />
            <Me />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
