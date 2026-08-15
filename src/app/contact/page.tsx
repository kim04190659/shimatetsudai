import type { Metadata } from "next";
import { PARTNER_NAME } from "@/lib/partner";
import ContactChat from "@/components/ContactChat";

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
    </div>
  );
}
