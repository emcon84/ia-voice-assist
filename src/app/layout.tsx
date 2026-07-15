import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PWAInstaller from "@/components/pwa/PWAInstaller";

export const metadata: Metadata = {
  title: "Unión Agrícola de Avellaneda - Asistente Omar",
  description:
    "Omar, el asistente de la Unión Agrícola de Avellaneda: hormigón, materiales de construcción y todas las divisiones de la cooperativa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UAA Omar",
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://yapurlearning.vercel.app",
  ),
  openGraph: {
    title: "Unión Agrícola de Avellaneda - Asistente Omar",
    description:
      "Omar, el asistente de la Unión Agrícola de Avellaneda: hormigón, materiales de construcción y todas las divisiones de la cooperativa",
    url: "/",
    siteName: "Unión Agrícola de Avellaneda",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Unión Agrícola de Avellaneda - Asistente Omar",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unión Agrícola de Avellaneda - Asistente Omar",
    description:
      "Omar, el asistente de la Unión Agrícola de Avellaneda: hormigón, materiales de construcción y todas las divisiones de la cooperativa",
    images: ["/icons/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#005bab",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <PWAInstaller />
        </ThemeProvider>
      </body>
    </html>
  );
}
