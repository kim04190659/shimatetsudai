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
        <p className="mt-8 border-t border-brand-soft/60 pt-4 text-xs leading-relaxed text-foreground/50">
          本サイトに掲載する各分室(屋久島町・渡名喜村・りとけい等)のページは、インターネット上で公開されている情報をもとに作成した実証用のデモンストレーションです。掲載する自治体・商工会・観光協会・NPO等の名称は実在のものですが、当該団体から正式な許諾・監修を得て制作したものではなく、掲載内容(論点・立場表明・意思決定支援ダッシュボード等)は生成AIによる仮の整理案です。実際の団体の見解や意思決定を示すものではありませんので、あらかじめご了承ください。ご関係の団体様で内容について気になる点がございましたら、お問い合わせページよりご連絡ください。
        </p>
        <p className="mt-4 text-xs text-foreground/50">
          © {new Date().getFullYear()} {PARTNER_NAME} しまてつだい分室(仮). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
