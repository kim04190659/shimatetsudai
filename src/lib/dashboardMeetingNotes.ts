// ダッシュボード「編集モード」から登録する議事録・議事メモの保存/取得。
//
// 背景: 以前は /admin/meeting-import という別画面で議事録を取り込んでいたが、
// 「AIによる4分類・確認画面」の使い勝手が悪いという指摘を受け、廃止した。
// 代わりに、分室スタッフが普段使っているダッシュボードの「編集モード」(合い言葉ログイン)
// から、その場で議事メモを直接書き込めるようにする。
//
// 保存先はNotion(新規DB「📝 議事メモ(ダッシュボード投稿)」)。
// CLAUDE.mdの方針「成果物はNotionに集約する」に従い、セル上書き(Supabase)とは違い、
// 議事メモは他のIssue関連データと同じくNotionに残す。
//
// AIによる事実/発言/目標/決定への自動分類・4DBへの書き込みは、ここでは行わない。
// 「しまてつだいダッシュボードエージェント」に反映を頼んだときに、エージェントが
// このDBを確認しながら会話の中で分類・確認・書き込みを行う(Web UIでの自動処理はしない)。

import { Client, isFullPage } from "@notionhq/client";

const MEETING_NOTE_DATA_SOURCE_ID = "251a0391-d257-4da7-b373-bf51b825b526";

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

export type MeetingNote = {
  pageId: string;
  pageUrl: string;
  title: string;
  body: string;
  authorName: string;
  postedAt: string;
  status: "未反映" | "反映済み";
};

/**
 * 議事メモを1件登録する。編集モードでログイン済みのスタッフが、
 * ダッシュボード上のフォームから直接書いた内容をそのまま保存する
 * (AIによる要約・分類はしない。生のメモをそのまま残す)。
 */
export async function createMeetingNote(input: {
  dashboardSlug: string;
  issuePageId: string | null;
  dashboardUrl: string | null;
  title: string;
  body: string;
  authorName: string;
}): Promise<{ pageUrl: string }> {
  const notion = getClient();
  const issueUrl = input.issuePageId
    ? `https://app.notion.com/${input.issuePageId.replace(/-/g, "")}`
    : undefined;

  const page = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: MEETING_NOTE_DATA_SOURCE_ID },
    properties: {
      Title: { title: [{ text: { content: input.title.slice(0, 200) } }] },
      ダッシュボードSlug: { rich_text: [{ text: { content: input.dashboardSlug } }] },
      ...(issueUrl ? { IssueURL: { url: issueUrl } } : {}),
      ...(input.dashboardUrl ? { 対象ダッシュボードURL: { url: input.dashboardUrl } } : {}),
      本文: { rich_text: [{ text: { content: input.body.slice(0, 2000) } }] },
      投稿者: { rich_text: [{ text: { content: input.authorName } }] },
      投稿日時: { date: { start: new Date().toISOString() } },
      Status: { select: { name: "未反映" } },
    },
  });

  return { pageUrl: "url" in page ? page.url ?? "" : "" };
}

type RichTextLike = { plain_text?: string };
function extractRichText(arr: unknown): string {
  if (!Array.isArray(arr)) return "";
  return arr.map((t: RichTextLike) => t?.plain_text ?? "").join("");
}

/**
 * 指定したダッシュボード(slug)に登録済みの議事メモを新しい順に取得する。
 * ダッシュボード画面の「🗒️ 議事メモ」タブから、ログイン不要で誰でも見られる想定。
 */
export async function listMeetingNotes(dashboardSlug: string, limit = 50): Promise<MeetingNote[]> {
  const notion = getClient();
  const results: MeetingNote[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: MEETING_NOTE_DATA_SOURCE_ID,
      start_cursor: cursor,
      page_size: 100,
      filter: {
        property: "ダッシュボードSlug",
        rich_text: { equals: dashboardSlug },
      },
      sorts: [{ property: "投稿日時", direction: "descending" }],
    });

    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      const props = page.properties;
      const titleProp = props["Title"];
      const title = titleProp && titleProp.type === "title" ? extractRichText(titleProp.title) : "";
      const bodyProp = props["本文"];
      const body = bodyProp && bodyProp.type === "rich_text" ? extractRichText(bodyProp.rich_text) : "";
      const authorProp = props["投稿者"];
      const authorName =
        authorProp && authorProp.type === "rich_text" ? extractRichText(authorProp.rich_text) : "匿名";
      const dateProp = props["投稿日時"];
      const postedAt = dateProp && dateProp.type === "date" ? dateProp.date?.start ?? "" : "";
      const statusProp = props["Status"];
      const status =
        statusProp && statusProp.type === "select" && statusProp.select?.name === "反映済み"
          ? "反映済み"
          : "未反映";

      results.push({
        pageId: page.id,
        pageUrl: page.url,
        title,
        body,
        authorName,
        postedAt,
        status,
      });
      if (results.length >= limit) break;
    }

    cursor = res.has_more && results.length < limit ? res.next_cursor ?? undefined : undefined;
  } while (cursor);

  return results;
}
