import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workflow MVP",
  description: "Production work management platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
