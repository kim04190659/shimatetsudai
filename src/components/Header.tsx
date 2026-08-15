import Link from "next/link";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "会社概要" },
  { href: "/tools", label: "事業紹介" },
  { href: "/contact", label: "お問い合わせ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-soft bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl sm:text-2xl">🌾</span>
          <span className="leading-tight">
            <span className="block text-[10px] font-semibold text-accent-green sm:text-xs">
              離島経済新聞社
            </span>
            <span className="block whitespace-nowrap text-sm font-bold tracking-wide text-brand-dark sm:text-lg">
              しまてつだい分室
            </span>
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
