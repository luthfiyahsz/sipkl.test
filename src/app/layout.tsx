import type { Metadata } from "next";
import "./globals.css";
import { Flash } from "@/components/flash";

export const metadata: Metadata = {
  title: {
    default: "SI-PKL",
    template: "%s | SI-PKL",
  },
  description: "Sistem Informasi Praktik Kerja Lapangan",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Flash />
      </body>
    </html>
  );
}
