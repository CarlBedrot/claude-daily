import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Daily",
  description: "Your daily briefing on everything Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-charcoal antialiased">{children}</body>
    </html>
  );
}
