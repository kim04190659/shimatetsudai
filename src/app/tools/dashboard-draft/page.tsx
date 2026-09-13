import type { Metadata } from "next";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";
import DashboardWorkspace from "@/components/DashboardWorkspace";

export const metadata: Metadata = {
  title: `意思決定支援ダッシュボード | ${SITE_NAME} | ${PARTNER_NAME}`,
};

export default function DashboardDraftPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">意思決定支援</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">意思決定支援ダッシュボード</h1>
      <p className="mt-2 text-sm font-medium text-accent-green">{SITE_TAGLINE}</p>
      <p className="mt-4 max-w-3xl leading-relaxed text-foreground/80">
        左の「資料投入エリア」に議事録やヒアリングメモの文章を貼り付けると、AIが論点整理の下書きを作成し、
        中央のダッシュボードに反映します。右の「質問エリア」では、反映された内容について気になることを
        その場で質問できます。音声・PDFファイルをそのままアップロードする機能は現在準備中です。
        まずはテキストとして貼り付けてお試しください。
      </p>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-foreground/50">
        ここで作成される下書きは、あくまで「たたき台」です。実際に分室ページへ公開する場合は、
        お問い合わせページからご相談ください。担当者が内容を確認したうえで、専用ページとしてご用意します。
      </p>

      <div className="mt-8">
        <DashboardWorkspace />
      </div>
    </div>
  );
}
