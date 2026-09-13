import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${PARTNER_NAME}`,
  description: `${SITE_NAME}は、${PARTNER_NAME}が提供する${SITE_TAGLINE}。話し合いの資料や意見をもとに、意思決定を後押しします。`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
