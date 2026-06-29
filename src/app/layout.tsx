import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://acopiovnzla-production.up.railway.app"),
  title: "Acopio Venezuela — Gestión de Centros de Acopio",
  description: "Plataforma independiente de gestión de centros de acopio humanitario para Venezuela.",
  applicationName: "Acopio Venezuela",
  openGraph: {
    title: "Acopio Venezuela — Centros de Acopio",
    description: "Plataforma independiente de gestión de centros de acopio humanitario para Venezuela.",
    siteName: "Acopio Venezuela",
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Acopio Venezuela — Centros de Acopio",
    description: "Plataforma independiente de gestión de centros de acopio humanitario para Venezuela.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
