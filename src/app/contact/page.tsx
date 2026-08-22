import type { Metadata } from "next";
import { PARTNER_NAME } from "@/lib/partner";
import ContactChat from "@/components/ContactChat";
import DashboardTrialForm from "@/components/DashboardTrialForm";

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
        下のチャットにそのままご記入ください。AIがその場でお答えします。
        担当者の判断が必要な内容は、AIから折り返しの旨をご案内します。
      </p>

      <div className="mt-10">
        <ContactChat />
      </div>

      <div className="mt-16">
        <p className="text-sm font-semibold text-brand-dark">DASHBOARD TRIAL</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">
          意思決定支援ダッシュボードを試してみたい方へ
        </h2>
        <p className="mt-4 leading-relaxed text-foreground/80">
          限られた人・お金をどう配分するか、といった意思決定の論点があれば、専用のダッシュボードを
          パスワード付きでご用意します。議事録や関係者の意見を教えていただければ、生成AIが
          意思決定支援シートの下書きを作成します。費用はかかりません。今は実証段階のため、
          対応できる件数には限りがあります。
        </p>

        <div className="mt-6">
          <DashboardTrialForm />
        </div>
      </div>
    </div>
  );
}
