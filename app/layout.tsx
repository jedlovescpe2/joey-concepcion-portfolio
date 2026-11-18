import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Joey Concepcion · IT Professional, Digital Channel Lead & IT Mentor";
const description =
  "Joseph (Joey) Mandado Concepcion: 20+ years in IT across databases, batch jobs, front-end and digital channels in Singapore and the Philippines. Digital Channel Lead at Boehringer Ingelheim and part-time mentor at Mapúa Malayan Digital College.";

export const metadata: Metadata = {
  metadataBase: new URL("https://joey-concepcion.netlify.app"),
  title,
  description,
  openGraph: { title, description, type: "profile", images: ["/img/og.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/img/og.jpg"] },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "48x48" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#36421f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Netlify injects a "hosted on Netlify" comment + newline into <head>; the stray text node breaks React 19 hydration (error 418). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=document.head;for(var n=h.firstChild;n;){var x=n.nextSibling;if((n.nodeType===8&&/hosted on Netlify/i.test(n.nodeValue))||(n.nodeType===3&&!n.nodeValue.trim()))h.removeChild(n);n=x}var o=new MutationObserver(function(){document.querySelectorAll('script[data-nf-variant],iframe[id^="nl-"]').forEach(function(e){e.remove()})});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){o.disconnect()},8000)})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Mrs+Saint+Delafield&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
