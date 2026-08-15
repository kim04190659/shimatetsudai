import type { Metadata } from "next";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `お問い合わせ | ${PARTNER_NAME} しまてつだい分室`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">CONTACT</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">お問い合わせ</h1>
      <p className="mt-4 leading-relaxed text-foreground/80">
        サービスに関するご質問、取材のご依頼、拠点スタッフとしての参加にご興味のある方は、
        下記フォームよりお気軽にお問い合わせください。
      </p>

      <form className="mt-10 space-y-6">
        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-foreground">
            お問い合わせ種別
          </label>
          <select
            id="type"
            name="type"
            className="mt-2 w-full rounded-xl border border-brand-soft bg-card px-4 py-3 text-sm outline-none focus:border-brand"
            defaultValue="staff"
          >
            <option value="staff">拠点スタッフについて</option>
            <option value="service">サービスについて</option>
            <option value="press">取材・メディア掲載について</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-foreground">
            お名前
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="mt-2 w-full rounded-xl border border-brand-soft bg-card px-4 py-3 text-sm outline-none focus:border-brand"
            placeholder="山田 花子"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="mt-2 w-full rounded-xl border border-brand-soft bg-card px-4 py-3 text-sm outline-none focus:border-brand"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-foreground">
            お問い合わせ内容
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="mt-2 w-full rounded-xl border border-brand-soft bg-card px-4 py-3 text-sm outline-none focus:border-brand"
            placeholder="お問い合わせ内容をご記入ください"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          送信する(準備中)
        </button>
        <p className="text-xs text-foreground/50">
          ※ このフォームは現在準備中です。実際の送信機能は今後実装予定です。
        </p>
      </form>
    </div>
  );
}
