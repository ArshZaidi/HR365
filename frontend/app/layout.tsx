import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR365",
  description: "Enterprise AI HR Assistant",
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