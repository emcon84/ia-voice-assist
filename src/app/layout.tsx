import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import BrandingStyle from "@/components/branding/BrandingStyle";
import { getActiveAssistant } from "@/assistants/registry";

const assistant = getActiveAssistant();
const { name, company, tagline } = assistant.identity;
const title = `${company} - Asistente ${name}`;
const description = `${name}, ${tagline}.`;

export const metadata: Metadata = {
  title,
  description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: `${company} ${name}`,
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || assistant.branding.baseUrl,
  ),
  openGraph: {
    title,
    description,
    url: "/",
    siteName: company,
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: title,
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/icons/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: assistant.branding.colors.primary,
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
        {/* Favicon y apple-icon los genera Next dinámicamente (app/icon.tsx, app/apple-icon.tsx). */}
        <BrandingStyle />
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
