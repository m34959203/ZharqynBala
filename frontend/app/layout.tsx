import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://zharqynbala.kz"),
  title: {
    default: "ZharqynBala - Психологическая диагностика детей",
    template: "%s | ZharqynBala",
  },
  description:
    "Платформа психологической диагностики и развития детей в Казахстане. Психологические тесты, AI-рекомендации, консультации с психологами.",
  keywords: [
    "психологическая диагностика",
    "детская психология",
    "психологические тесты",
    "развитие ребенка",
    "Казахстан",
    "балаларды тексеру",
    "психологиялық тест",
  ],
  authors: [{ name: "ZharqynBala Team" }],
  creator: "ZharqynBala",
  publisher: "ZharqynBala",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    alternateLocale: "kk_KZ",
    url: "https://zharqynbala.kz",
    siteName: "ZharqynBala",
    title: "ZharqynBala - Психологическая диагностика детей",
    description:
      "Платформа психологической диагностики и развития детей в Казахстане.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZharqynBala - Психологическая диагностика детей",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZharqynBala - Психологическая диагностика детей",
    description:
      "Платформа психологической диагностики и развития детей в Казахстане.",
    images: ["/og-image.png"],
    creator: "@zharqynbala",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://zharqynbala.kz",
    languages: {
      "ru-KZ": "https://zharqynbala.kz",
      "kk-KZ": "https://zharqynbala.kz/kz",
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  category: "education",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#667eea" },
    { media: "(prefers-color-scheme: dark)", color: "#4c51bf" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.zharqynbala.kz" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ZharqynBala",
              description: "Платформа психологической диагностики и развития детей",
              url: "https://zharqynbala.kz",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KZT",
              },
              author: {
                "@type": "Organization",
                name: "ZharqynBala",
                url: "https://zharqynbala.kz",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ZharqynBala",
              url: "https://zharqynbala.kz",
              logo: "https://zharqynbala.kz/logo.png",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+7-700-123-4567",
                contactType: "customer service",
                availableLanguage: ["Russian", "Kazakh"],
              },
              sameAs: [
                "https://www.facebook.com/zharqynbala",
                "https://www.instagram.com/zharqynbala",
                "https://t.me/zharqynbala",
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
