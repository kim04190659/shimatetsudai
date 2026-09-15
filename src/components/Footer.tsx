import Image from "next/image";
import Link from "next/link";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";

// 2026-09-15 鯨本さん(離島経済新聞社)からの依頼でフッターを整理:
// - 「分室情報」列は、分室(地域単位)の概念自体をやめたため削除
// - 「事業紹介」列は、実際に機能しているもの(テーマ一覧・てつだって)だけに絞った
// - 下部の「本サイトに掲載する各分室は実証用のデモンストレーション」という注記は、
//   複数の自治体・団体のページを間借りしていた頃の文言のため、
//   離島経済新聞社自身のページとなった今は不要と判断し削除
// - 離島経済新聞社のロゴ(2種)は引き続き掲載
export default function Footer() {
  return (
    <footer className="border-t border-brand-soft bg-brand-soft/40">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-foreground/70">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-base font-bold text-brand-dark">{SITE_NAME}</p>
            <p className="mt-1 text-xs font-medium text-accent-green">{SITE_TAGLINE}</p>
            <p className="mt-2 leading-relaxed">
              {PARTNER_NAME}が運営する、離島や地方の暮らしと社会に寄り添う対話・意思決定支援ツールです。
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">事業紹介</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/themes" className="hover:text-brand-dark">
                  意思決定支援(テーマ)
                </Link>
              </li>
              <li>
                <a
                  href="https://shimatetsudai-tetsudatte.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-dark"
                >
                  てつだって
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-brand-soft/60 pt-6">
          <Image
            src="/partners/ritokei-logo.png"
            alt="ritokei.com"
            width={120}
            height={40}
            className="h-8 w-auto opacity-80"
          />
          <Image
            src="/partners/ritokei-shimbunsha-logo.png"
            alt="離島経済新聞社"
            width={160}
            height={40}
            className="h-7 w-auto opacity-80"
          />
        </div>

        <p className="mt-8 border-t border-brand-soft/60 pt-4 text-xs text-foreground/50">
          © {new Date().getFullYear()} {PARTNER_NAME} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
