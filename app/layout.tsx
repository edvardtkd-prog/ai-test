import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Audience Lab",
  description: "Simulate 1000 target users and forecast FTD/NGR before spending ad budget.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
