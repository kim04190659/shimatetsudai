// 管理者画面「議事録取り込みフロー」のNotion連携・AI構造化ロジック。
// 「イシュー叩き台自動生成パイプライン設計書」フェーズ1(自動化仕様)の通り、
// 議事録の録音・文字起こし自体はNotion側で人が行う前提とし、
// このモジュールは「取得済みの議事録テキストを構造化データに変換し、Notionに書き込む」
// 部分だけを担当する。
//
// 分類ルール(既存マニュアルと同じ):
//   事実 → EvidenceRecord / 発言 → PositionRecord / 目標 → StakeholderGoal / 決定 → Agreement
//
// 環境変数:
//   NOTION_API_KEY … 他のNotion連携と共通のインテグレーションシークレット
//   ANTHROPIC_API_KEY … structureMeetingNotes()でのAI構造化に使用

import { Client, isFullPage, isFullDataSource } from "@notionhq/client";

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

// ------------------------------------------------------------------
// 共通: 画面に貼り付けられた「NotionのURL」または「素のページID」から
// ページID(ハイフン付きUUID形式)だけを取り出す。
// 例: https://app.notion.com/p/3cb960a91e23812d8c50f169695c971a?v=... のような
// URLをそのまま貼っても動くように、URLの中からID部分(32桁の16進数)を検出する。
// ------------------------------------------------------------------

export function extractNotionPageId(input: string): string {
  const trimmed = input.trim();
  // ハイフン付き/なしどちらの32桁16進数も拾う(URL中に含まれるビューIDより前に出てくる
  // 最初の一致がページIDになるため、matchの最初の結果を採用する)
  const match = trimmed.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i);
  if (!match) {
    throw new Error(
      `ページIDを読み取れませんでした。NotionのページURL、またはページID(32桁の英数字)を入力してください: 「${input}」`
    );
  }
  const hex = match[0].replace(/-/g, "").toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ------------------------------------------------------------------
// ステップ1: 議事録ページの本文をプレーンテキストとして取得する
// ------------------------------------------------------------------

type RichTextLike = { plain_text?: string };

function extractRichText(arr: unknown): string {
  if (!Array.isArray(arr)) return "";
  return arr.map((t: RichTextLike) => t?.plain_text ?? "").join("");
}

/**
 * Notionページの本文ブロックを再帰的にたどり、プレーンテキストとして連結する。
 * AIミーティングノートの「要約」「アクションアイテム」「文字起こし」を丸ごと拾う想定。
 * 深すぎるネストで暴走しないよう、深さは3階層までに制限する。
 */
export async function getPageTextContent(pageId: string, depth = 0): Promise<string> {
  if (depth > 3) return "";
  const notion = getClient();
  const lines: string[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const block of res.results) {
      if (!("type" in block)) continue;
      const type = block.type as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = block as any;
      const rt = b[type]?.rich_text;
      const text = rt ? extractRichText(rt) : "";
      if (text) lines.push(text);
      if (b.has_children) {
        const childText = await getPageTextContent(block.id, depth + 1);
        if (childText) lines.push(childText);
      }
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return lines.join("\n");
}

// ------------------------------------------------------------------
// ステップ2: Issueページから、書き込み先の4DB(Evidence/Position/Goal/Agreement)の
// データソースIDを動的に特定する(自治体ごとにIssue DBが別々のため、決め打ちにしない)
// ------------------------------------------------------------------

export type IssueRelationTargets = {
  issueTitle: string;
  evidenceDataSourceId: string | null;
  positionDataSourceId: string | null;
  goalDataSourceId: string | null;
  agreementDataSourceId: string | null;
};

export async function resolveIssueRelationTargets(issuePageId: string): Promise<IssueRelationTargets> {
  const notion = getClient();
  const page = await notion.pages.retrieve({ page_id: issuePageId });

  if (!isFullPage(page)) {
    throw new Error("Issueページの取得に失敗しました(アクセス権限を確認してください)");
  }

  const parent = page.parent;
  if (parent.type !== "data_source_id") {
    throw new Error(
      "Issueページの親がデータソースではありません(通常のIssue DB配下のページではない可能性があります)"
    );
  }
  const dataSourceId = parent.data_source_id;

  const titleProp = Object.values(page.properties).find((p) => p.type === "title");
  const issueTitle =
    titleProp && titleProp.type === "title" ? extractRichText(titleProp.title) : "(タイトル不明)";

  const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  if (!isFullDataSource(dataSource)) {
    throw new Error("Issue DBのスキーマ取得に失敗しました");
  }

  const relationTarget = (propName: string): string | null => {
    const prop = dataSource.properties[propName];
    if (prop && prop.type === "relation") {
      return prop.relation.data_source_id;
    }
    return null;
  };

  return {
    issueTitle,
    evidenceDataSourceId: relationTarget("Evidence"),
    positionDataSourceId: relationTarget("PositionRecords"),
    goalDataSourceId: relationTarget("Goals"),
    agreementDataSourceId: relationTarget("Agreement"),
  };
}

// ------------------------------------------------------------------
// ステップ3: AIによる構造化(下書き)。プレビュー用であり、人が確認・修正してから確定する。
// ------------------------------------------------------------------

export type StructuredEvidence = { title: string; summary: string };
export type StructuredPosition = {
  title: string;
  content: string;
  stance: "賛成" | "反対" | "条件付き賛成" | "保留";
};
export type StructuredGoal = { title: string; content: string; goalType: "need" | "offer" | "seek" };
export type StructuredAgreement = { title: string; summary: string; opposingSummary?: string };

export type StructuredMeetingResult = {
  evidence: StructuredEvidence[];
  positions: StructuredPosition[];
  goals: StructuredGoal[];
  agreements: StructuredAgreement[];
};

const STRUCTURE_TOOL = {
  name: "structure_meeting_notes",
  description: "議事録テキストを、事実・発言・目標・決定の4分類に構造化する",
  input_schema: {
    type: "object" as const,
    properties: {
      evidence: {
        type: "array",
        description: "客観的な事実・数値・現状データ(EvidenceRecordになるもの)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "20文字程度の見出し" },
            summary: { type: "string", description: "事実の要約(1〜3文)" },
          },
          required: ["title", "summary"],
        },
      },
      positions: {
        type: "array",
        description: "個人の意見・立場表明(PositionRecordになるもの)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "「誰が何を言ったか」が分かる20文字程度の見出し" },
            content: { type: "string", description: "発言内容の要約" },
            stance: { type: "string", enum: ["賛成", "反対", "条件付き賛成", "保留"] },
          },
          required: ["title", "content", "stance"],
        },
      },
      goals: {
        type: "array",
        description: "関係者が示した目標・ニーズ・提供できるもの(StakeholderGoalになるもの)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "20文字程度の見出し" },
            content: { type: "string", description: "目標の内容" },
            goalType: {
              type: "string",
              enum: ["need", "offer", "seek"],
              description: "need=必要としていること / offer=提供できること / seek=模索していること",
            },
          },
          required: ["title", "content", "goalType"],
        },
      },
      agreements: {
        type: "array",
        description: "会議で決定・合意した事項(Agreementになるもの)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "20文字程度の見出し" },
            summary: { type: "string", description: "合意内容の要約" },
            opposingSummary: { type: "string", description: "反対意見・少数意見があれば要約(なければ省略)" },
          },
          required: ["title", "summary"],
        },
      },
    },
    required: ["evidence", "positions", "goals", "agreements"],
  },
};

/**
 * 議事録テキストをAIで4分類に構造化する。あくまで下書きであり、
 * 呼び出し側で必ず人によるプレビュー確認・修正のステップを挟むこと(設計書の方針)。
 */
export async function structureMeetingNotes(input: {
  issueTitle: string;
  transcript: string;
}): Promise<StructuredMeetingResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const systemPrompt = `あなたは地域の合意形成プラットフォームの議事録整理を支援するアシスタントです。
論点「${input.issueTitle}」についての会議の議事録(要約・アクションアイテム・文字起こしを含む)を、
以下の4分類に構造化してください。

- 事実(EvidenceRecord): 客観的なデータ・現状・数値
- 発言(PositionRecord): 個人の意見・立場表明。誰の発言かが分かるものは主語を明確にする
- 目標(StakeholderGoal): 関係者が示した目標・ニーズ・提供できるもの
- 決定(Agreement): その場で決定・合意した事項

議事録に明記されていない内容を推測で補わないこと。該当する項目がない分類は空配列でよい。
必ずstructure_meeting_notesツールを使って構造化された形式で返すこと。`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: input.transcript.slice(0, 30000) }],
      tools: [STRUCTURE_TOOL],
      tool_choice: { type: "tool", name: "structure_meeting_notes" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI構造化に失敗しました: ${errText}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((block: { type: string }) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("AI応答の解析に失敗しました");
  }

  return toolUse.input as StructuredMeetingResult;
}

// ------------------------------------------------------------------
// ステップ4.5: 対象Issueの「ダッシュボードURL」プロパティを読む
// (静的HTMLダッシュボードの場合、確定後に反映待ちキューへ登録するために使う)
// ------------------------------------------------------------------

export async function getIssueDashboardUrl(issuePageId: string): Promise<string | null> {
  const notion = getClient();
  const page = await notion.pages.retrieve({ page_id: issuePageId });
  if (!isFullPage(page)) return null;

  const prop = page.properties["ダッシュボードURL"];
  if (!prop) return null;
  if (prop.type === "url") return prop.url;
  if (prop.type === "rich_text") return extractRichText(prop.rich_text) || null;
  return null;
}

// ------------------------------------------------------------------
// ステップ6(静的HTMLダッシュボードの場合のみ):
// 「🔔 ダッシュボード反映待ちキュー」DBに1件登録する。
// 動的ダッシュボード(/dashboard/[slug])はrevalidateTagで即時反映されるため対象外。
// 静的HTMLの場合はここにキューイングし、Cowork上のしまてつだいダッシュボード
// エージェントが「反映待ちを処理して」と頼まれたときに拾って処理する想定。
// ------------------------------------------------------------------

const DASHBOARD_QUEUE_DATA_SOURCE_ID = "f44eab93-5bd2-44ec-9974-642bbc633dd9";

function summarizeStructuredResult(confirmed: StructuredMeetingResult): string {
  const lines: string[] = [];
  if (confirmed.evidence.length) {
    lines.push("【事実】");
    confirmed.evidence.forEach((e) => lines.push(`- ${e.title}: ${e.summary}`));
  }
  if (confirmed.positions.length) {
    lines.push("【発言】");
    confirmed.positions.forEach((p) => lines.push(`- (${p.stance}) ${p.title}: ${p.content}`));
  }
  if (confirmed.goals.length) {
    lines.push("【目標】");
    confirmed.goals.forEach((g) => lines.push(`- (${g.goalType}) ${g.title}: ${g.content}`));
  }
  if (confirmed.agreements.length) {
    lines.push("【決定】");
    confirmed.agreements.forEach((a) => {
      lines.push(`- ${a.title}: ${a.summary}`);
      if (a.opposingSummary) lines.push(`  (反対意見) ${a.opposingSummary}`);
    });
  }
  return lines.join("\n").slice(0, 2000);
}

export async function createDashboardReflectionQueueEntry(input: {
  issueTitle: string;
  issuePageId: string;
  meetingNotePageId: string | null;
  dashboardUrl: string;
  confirmed: StructuredMeetingResult;
  writtenCount: number;
}): Promise<{ queueEntryUrl: string }> {
  const notion = getClient();
  const issueUrl = `https://app.notion.com/${input.issuePageId.replace(/-/g, "")}`;
  const meetingNoteUrl = input.meetingNotePageId
    ? `https://app.notion.com/${input.meetingNotePageId.replace(/-/g, "")}`
    : undefined;

  const page = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: DASHBOARD_QUEUE_DATA_SOURCE_ID },
    properties: {
      Title: { title: [{ text: { content: `${input.issueTitle} — 議事録反映待ち` } }] },
      IssueURL: { url: issueUrl },
      ...(meetingNoteUrl ? { 議事録URL: { url: meetingNoteUrl } } : {}),
      対象ダッシュボードURL: { url: input.dashboardUrl },
      構造化サマリー: { rich_text: [{ text: { content: summarizeStructuredResult(input.confirmed) } }] },
      書き込み件数: { number: input.writtenCount },
      Status: { select: { name: "未反映" } },
      登録日時: { date: { start: new Date().toISOString() } },
    },
  });

  return { queueEntryUrl: "url" in page ? page.url ?? "" : "" };
}

// ------------------------------------------------------------------
// ステップ4: 人が確認・修正した内容をNotionの各DBに書き込む
// ------------------------------------------------------------------

export async function writeStructuredMeetingResult(input: {
  issuePageId: string;
  targets: IssueRelationTargets;
  confirmed: StructuredMeetingResult;
}): Promise<{ writtenCount: number }> {
  const notion = getClient();
  const { targets, confirmed, issuePageId } = input;
  let writtenCount = 0;

  if (targets.evidenceDataSourceId) {
    for (const item of confirmed.evidence) {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: targets.evidenceDataSourceId },
        properties: {
          Title: { title: [{ text: { content: item.title.slice(0, 200) } }] },
          要約: { rich_text: [{ text: { content: item.summary.slice(0, 2000) } }] },
          SourceType: { select: { name: "internal_pulse" } },
          Issue: { relation: [{ id: issuePageId }] },
        },
      });
      writtenCount++;
    }
  }

  if (targets.positionDataSourceId) {
    for (const item of confirmed.positions) {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: targets.positionDataSourceId },
        properties: {
          Title: { title: [{ text: { content: item.title.slice(0, 200) } }] },
          内容: { rich_text: [{ text: { content: item.content.slice(0, 2000) } }] },
          Stance: { select: { name: item.stance } },
          Channel: { select: { name: "ワークショップ発言" } },
          Issue: { relation: [{ id: issuePageId }] },
        },
      });
      writtenCount++;
    }
  }

  if (targets.goalDataSourceId) {
    for (const item of confirmed.goals) {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: targets.goalDataSourceId },
        properties: {
          Title: { title: [{ text: { content: item.title.slice(0, 200) } }] },
          内容: { rich_text: [{ text: { content: item.content.slice(0, 2000) } }] },
          GoalType: { select: { name: item.goalType } },
          Issue: { relation: [{ id: issuePageId }] },
        },
      });
      writtenCount++;
    }
  }

  if (targets.agreementDataSourceId) {
    for (const item of confirmed.agreements) {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: targets.agreementDataSourceId },
        properties: {
          Title: { title: [{ text: { content: item.title.slice(0, 200) } }] },
          合意概要: { rich_text: [{ text: { content: item.summary.slice(0, 2000) } }] },
          ...(item.opposingSummary
            ? { 反対意見要約: { rich_text: [{ text: { content: item.opposingSummary.slice(0, 2000) } }] } }
            : {}),
          決定日: { date: { start: new Date().toISOString().slice(0, 10) } },
          Issue: { relation: [{ id: issuePageId }] },
        },
      });
      writtenCount++;
    }
  }

  return { writtenCount };
}
