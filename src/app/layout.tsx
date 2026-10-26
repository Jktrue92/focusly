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
    <html lang="en">
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
      </body>
    </html>
  );
}
