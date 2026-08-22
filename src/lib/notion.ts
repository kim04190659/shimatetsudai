// Notion連携ライブラリ(お問い合わせチャットのログ / 意思決定支援ダッシュボードのライブ取得用)
// 環境変数:
//   NOTION_API_KEY               … Notionインテグレーションのシークレット(てつだって拡張版と同じキーを流用可)
//   NOTION_CONTACT_DATA_SOURCE_ID … ContactInquiryデータソースのID
import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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
  inquiryType:
    | "スタッフについて"
    | "サービスについて"
    | "取材・プレス"
    | "ダッシュボード試用申請"
    | "その他";
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

// ------------------------------------------------------------------
// りとけい「420島への限られた取材・支援リソース配分」ダッシュボード用のライブ取得
//
// 現地の拠点スタッフがNotion上のPositionRecord(立場表明ログ)に
// 議事録・新しい意見を追加すると、ここで取得する内容が更新される。
// IssueページIDとデータソースIDは、Notionの「りとけい データベースリンク集」配下、
// りとけい専用の8DB(屋久島・渡名喜と同じスキーマで新規作成したもの)から採取したもの。
// ------------------------------------------------------------------

const RITOKEI_RESOURCE_ISSUE_PAGE_ID = "3bf960a9-1e23-819e-84f3-e19648bbb07a";
const RITOKEI_POSITION_RECORD_DATA_SOURCE_ID = "56112aae-dcd8-4e73-8f73-d3094f9edf0b";

function plainTextFromProperty(prop: PageObjectResponse["properties"][string] | undefined): string {
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "select":
      return prop.select?.name ?? "";
    case "created_time":
      return prop.created_time;
    default:
      return "";
  }
}

export type RitokeiPositionRecord = {
  title: string;
  stance: string;
  content: string;
  registeredAt: string;
};

export type RitokeiResourceDashboardData = {
  issueTitle: string;
  positionRecords: RitokeiPositionRecord[];
  /** LLMに渡す用に、取得した内容を1本のテキストにまとめたもの */
  sourceNotesText: string;
};

/**
 * 「420島への限られた取材・支援リソース配分」論点について、
 * Issueの内容と、それに紐づくPositionRecord(立場表明ログ = 議事録・意見)を
 * Notionからライブ取得する。ダッシュボードの更新ボタンが押されたときに呼ばれる想定。
 */
export async function getRitokeiResourceDashboardData(): Promise<RitokeiResourceDashboardData> {
  const notion = getClient();

  const issuePage = await notion.pages.retrieve({ page_id: RITOKEI_RESOURCE_ISSUE_PAGE_ID });
  const issueTitle = isFullPage(issuePage)
    ? plainTextFromProperty(issuePage.properties["Title"])
    : "420島への限られた取材・支援リソースを、どう配分するか";

  const positionRes = await notion.dataSources.query({
    data_source_id: RITOKEI_POSITION_RECORD_DATA_SOURCE_ID,
    filter: {
      property: "Issue",
      relation: { contains: RITOKEI_RESOURCE_ISSUE_PAGE_ID },
    },
    sorts: [{ property: "登録日時", direction: "descending" }],
  });

  const positionRecords: RitokeiPositionRecord[] = positionRes.results
    .filter(isFullPage)
    .map((page) => ({
      title: plainTextFromProperty(page.properties["Title"]),
      stance: plainTextFromProperty(page.properties["Stance"]),
      content: plainTextFromProperty(page.properties["内容"]),
      registeredAt: plainTextFromProperty(page.properties["登録日時"]),
    }));

  const sourceNotesText = [
    `【対象論点】${issueTitle}`,
    "",
    "【現在登録されている立場表明・議事録】(新しい順)",
    ...positionRecords.map(
      (r, i) =>
        `${i + 1}. [${r.stance || "立場不明"}] ${r.title}\n   ${r.content}\n   (登録: ${r.registeredAt})`
    ),
  ].join("\n");

  return { issueTitle, positionRecords, sourceNotesText };
}
