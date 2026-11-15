import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./tokens.css";
import "./components.css";
import "./site.css";
import { ActionBar } from "@/components/ActionBar";
import { AgeGate } from "@/components/AgeGate";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { NoticeBanner } from "@/components/NoticeBanner";
import { ReviewBar } from "@/components/ReviewBar";
import { site } from "@/content/site";
import { breweryLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.fullName} | Atascadero, CA`, template: `%s | ${site.name}` },
  description: site.description,
  robots: site.indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

// Runs before the page paints: a visitor who already said they are of age never sees the gate flash.
const rememberAge = `try{var t=Number(localStorage.getItem("cm-age-ok"));if(t&&Date.now()-t<${site.ageGateDays}*864e5)document.documentElement.classList.add("cm-age-ok")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/MonaSans-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {site.ageGateEnabled ? <script dangerouslySetInnerHTML={{ __html: rememberAge }} /> : null}
        {/* Without scripts there is no way to answer the gate, so it stays out of the way. */}
        <noscript>
          <style>{".cm-gate-overlay{display:none}"}</style>
        </noscript>
      </head>
      <body className="cm-root" data-theme="paper">
        {site.ageGateEnabled ? <AgeGate /> : null}
        <div className="cm-site" id="site">
          <a className="cm-skip cm-body-strong" href="#main">
            Skip to content
          </a>
          <ReviewBar />
          <NoticeBanner />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ActionBar />
        </div>
        {site.indexable ? <JsonLd data={breweryLd()} /> : null}
      </body>
    </html>
  );
}
