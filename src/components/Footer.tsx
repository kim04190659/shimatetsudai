import { PARTNER_NAME } from "@/lib/partner";

export default function Footer() {
  return (
    <footer className="border-t border-brand-soft bg-brand-soft/40">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-foreground/70">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-base font-bold text-brand-dark">{PARTNER_NAME} しまてつだい分室</p>
            <p className="mt-2 leading-relaxed">
              {PARTNER_NAME}の分室として、離島や地方の暮らしと社会に寄り添うツールを開発しています。
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">事業紹介</p>
            <ul className="mt-2 space-y-1">
              <li>てつだって</li>
              <li>意思決定支援</li>
              <li>カードゲーム</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">分室情報</p>
            <ul className="mt-2 space-y-1">
              <li>20〜40代の女性が中心となって活動しています</li>
              <li>{PARTNER_NAME}の分室です</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-foreground/50">
          © {new Date().getFullYear()} {PARTNER_NAME} しまてつだい分室(仮). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
