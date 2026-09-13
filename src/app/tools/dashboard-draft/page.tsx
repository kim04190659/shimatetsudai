import type { Metadata } from "next";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";
import DashboardDraftForm from "@/components/DashboardDraftForm";

export const metadata: Metadata = {
  title: `資料からたたき台を作る | ${SITE_NAME} | ${PARTNER_NAME}`,
};

export default function DashboardDraftPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">意思決定支援</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">資料からたたき台を作る</h1>
      <p className="mt-2 text-sm font-medium text-accent-green">{SITE_TAGLINE}</p>
      <p className="mt-4 leading-relaxed text-foreground/80">
        議事録、ヒアリングメモ、資料の文章などを貼り付けると、AIが論点整理の下書き(A3意思決定支援シートの元になる文章)を
        その場で作成します。音声・PDFファイルをそのままアップロードする機能は現在準備中です。
        まずはテキストとして貼り付けてお試しください。
      </p>
      <p className="mt-2 text-xs leading-relaxed text-foreground/50">
        ここで作成される下書きは、あくまで「たたき台」です。実際に分室ページへ公開する場合は、
        お問い合わせページからご相談ください。担当者が内容を確認したうえで、専用ページとしてご用意します。
      </p>

      <div className="mt-8">
        <DashboardDraftForm />
      </div>
    </div>
  );
}
