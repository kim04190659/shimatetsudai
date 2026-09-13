import Link from "next/link";
import Image from "next/image";
import { PARTNER_NAME, SITE_NAME } from "@/lib/partner";

// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、ヘッダーのロゴを
// 絵文字+テキストから離島経済新聞社の実ロゴ画像に変更し、ナビも
// 「意思決定支援」中心の3項目にしぼった。
const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/branches", label: "分室一覧" },
  { href: "/contact", label: "お問い合わせ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-soft bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/partners/ritokei-shimbunsha-logo.png"
            alt={PARTNER_NAME}
            width={140}
            height={36}
            className="h-6 w-auto sm:h-7"
          />
          <span className="block whitespace-nowrap text-sm font-bold tracking-wide text-brand-dark sm:text-lg">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex gap-2 text-xs sm:gap-6 sm:text-base">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap font-medium text-foreground/80 transition hover:text-brand-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
