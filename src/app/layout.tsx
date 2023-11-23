import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inscription",
  description: "年轻人的第一张铭文",
  icons: 'favicon.jpeg'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        <Analytics />
      </body>
    </html>
  );
}
