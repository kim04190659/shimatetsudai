// Notion連携ライブラリ(お問い合わせチャットのログ用)
// 環境変数:
//   NOTION_API_KEY               … Notionインテグレーションのシークレット(てつだって拡張版と同じキーを流用可)
//   NOTION_CONTACT_DATA_SOURCE_ID … ContactInquiryデータソースのID
import { Client } from "@notionhq/client";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error("NOTION_API_KEY が設定されていません");
    }
    client = new Client({ auth: apiKey });
  }
  return client;
}

export type ContactInquiryInput = {
  title: string;
  inquiryType: "スタッフについて" | "サービスについて" | "取材・プレス" | "その他";
  summary: string;
  canAnswer: boolean;
  escalationReason?: string;
  assigneeHint?: string;
  contactEmail?: string;
};

/**
 * お問い合わせチャットの会話ログをNotionのContactInquiryデータソースに1件記録する。
 * canAnswer=false(AIが回答できなかった)のときだけ担当者エスカレーションの起点になる。
 */
export async function logContactInquiry(input: ContactInquiryInput): Promise<void> {
  const dataSourceId = process.env.NOTION_CONTACT_DATA_SOURCE_ID;
  if (!dataSourceId) {
    // 環境変数が未設定の場合はNotion保存をスキップし、チャット自体は継続させる
    console.warn("NOTION_CONTACT_DATA_SOURCE_ID が未設定のため、Notionへの記録をスキップしました");
    return;
  }

  const notion = getClient();

  await notion.pages.create({
    parent: { data_source_id: dataSourceId, type: "data_source_id" },
    properties: {
      Title: { title: [{ text: { content: input.title } }] },
      InquiryType: { select: { name: input.inquiryType } },
      Summary: { rich_text: [{ text: { content: input.summary.slice(0, 2000) } }] },
      CanAnswer: { checkbox: input.canAnswer },
      ...(input.escalationReason
        ? { EscalationReason: { rich_text: [{ text: { content: input.escalationReason.slice(0, 2000) } }] } }
        : {}),
      ...(input.assigneeHint
        ? { AssigneeHint: { rich_text: [{ text: { content: input.assigneeHint.slice(0, 500) } }] } }
        : {}),
      ...(input.contactEmail ? { ContactEmail: { email: input.contactEmail } } : {}),
    },
  });
}
