import { ThemeSwitcher } from "@/components/theme-switcher";
import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Focusly — Less stress. More progress.",
  description:
    "A calmer space for your classes, assignments, and everything ahead.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('focusly-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}})();`,
          }}
        />
      </head>
      <body>
        <Suspense
          fallback={
            <main className="error-page">
              <p>Finding your focus…</p>
            </main>
          }
        >
          {children}
        </Suspense>
        <ThemeSwitcher />
      </body>
    </html>
  );
}
