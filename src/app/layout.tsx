import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `${PARTNER_NAME} しまてつだい分室`,
  description: `${PARTNER_NAME}の分室。てつだって・意思決定支援・カードゲームなど、暮らしと地域に寄り添うツールを開発しています。`,
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
