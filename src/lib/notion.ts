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
    | "改造・機能要望"
    | "その他";
  summary: string;
  canAnswer: boolean;
  escalationReason?: string;
  assigneeHint?: string;
  contactEmail?: string;
};

export type ContactInquiryResult = {
  pageId: string;
  url: string;
};

/**
 * お問い合わせチャットの会話ログをNotionのContactInquiryデータソースに1件記録する。
 * canAnswer=false(AIが回答できなかった)のときだけ担当者エスカレーションの起点になる。
 * 作成したページのid/urlを返す(改造・機能要望の場合、ChangeRequestからRelatedInquiryとして
 * 逆参照するために必要)。
 */
export async function logContactInquiry(input: ContactInquiryInput): Promise<ContactInquiryResult> {
  const dataSourceId = process.env.NOTION_CONTACT_DATA_SOURCE_ID;
  if (!dataSourceId) {
    // 環境変数が未設定の場合はNotion保存をスキップし、チャット自体は継続させる
    console.warn("NOTION_CONTACT_DATA_SOURCE_ID が未設定のため、Notionへの記録をスキップしました");
    return { pageId: "", url: "" };
  }

  const notion = getClient();

  const page = await notion.pages.create({
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

  return { pageId: page.id, url: isFullPage(page) ? page.url : "" };
}

// 高専サイト「先生・企業 登録リクエスト」DBのデータソースID
// CR「先生がやってほしい授業を簡単に登録できるインターフェースがない」
// CR「企業が自ら情報を登録する導線がなく、問い合わせフォームはダミー」への対応(2026-09-09)
const KOSEN_REGISTRATION_DATA_SOURCE_ID = "650bfdd5-1d62-4eed-b31b-155287a3c7a2";

export type KosenRegistrationInput = {
  name: string; // 先生名 or 会社名・担当者名
  type: "先生" | "企業";
  affiliation: string; // 所属高専 or 会社名
  content: string; // 先生: こんな授業をしてほしい／企業: これだったらできる
  contactEmail?: string;
  // CR「ドキュメント登録→自動マッチングの連携が未実装」対応(2026-09-09)。
  // CR「資料アップロードの上限が8MBと小さすぎる（Vercel関数の4.5MBハード制限に起因）」対応(2026-09-XX)で、
  // Notion File Upload APIへの直接送信からVercel Blobのクライアント直接アップロードに切り替えた。
  // CR「複数ファイルをまとめてアップロードしたい」対応(2026-09-09)で単一のfileUrl/fileNameから配列に変更。
  // 各要素のurl(=Vercel Blobの公開URL)を「資料」Filesプロパティに外部リンクとして紐づける。
  files?: { url: string; name: string }[];
};

export type KosenRegistrationResult = {
  pageId: string;
  url: string;
};

/**
 * 次世代高専教育サイト（public/kosen/）の登録フォーム（先生向け「こんな授業をしてほしい」、
 * 企業向け「これだったらできる」）から送信された内容を、Notionの「📥 先生・企業 登録リクエスト」
 * データソースに1件記録する。AIによる自動処理は行わず、対応状況=未確認で記録するのみ。
 * filesが指定された場合、「資料」Filesプロパティに複数の外部リンク(Vercel Blobの公開URL)として紐づける。
 */
export async function logKosenRegistration(
  input: KosenRegistrationInput
): Promise<KosenRegistrationResult> {
  const notion = getClient();

  // 添付ファイルは0〜複数件。Notionの「資料」Filesプロパティは1プロパティに複数ファイルを持てるため、
  // 配列をそのままexternalファイルのリストに変換する。
  const fileEntries = (input.files ?? []).map((f) => ({
    type: "external" as const,
    external: { url: f.url },
    name: (f.name || f.url).slice(0, 100),
  }));

  const page = await notion.pages.create({
    parent: { data_source_id: KOSEN_REGISTRATION_DATA_SOURCE_ID, type: "data_source_id" },
    properties: {
      Name: { title: [{ text: { content: input.name.slice(0, 200) } }] },
      Type: { select: { name: input.type } },
      所属: { rich_text: [{ text: { content: input.affiliation.slice(0, 500) } }] },
      内容: { rich_text: [{ text: { content: input.content.slice(0, 2000) } }] },
      対応状況: { select: { name: "未確認" } },
      ...(input.contactEmail ? { 連絡先: { email: input.contactEmail } } : {}),
      ...(fileEntries.length > 0 ? { 資料: { files: fileEntries } } : {}),
    },
  });

  return { pageId: page.id, url: isFullPage(page) ? page.url : "" };
}

// 「てつだって高専版 実施記録」DBのデータソースID
// CR「3ツール全てでデータがブラウザ内メモリ/静的配列のみで、Notion等への永続化がされていない」への対応(2026-09-09)
const KOSEN_RECORD_DATA_SOURCE_ID = "4c57e40f-04b7-4c62-8838-a0ade9cf4db1";

export type KosenRecordInput = {
  school: string; // 高専名
  teacher: string; // 先生・担当
  date: string; // 実施日 (YYYY-MM-DD)
  tag: string; // 分野タグ
  studentCount: number; // 参加学生数
  memo: string; // 授業内容メモ
};

export type KosenRecordResult = {
  pageId: string;
  url: string;
};

export type KosenRecordListItem = {
  school: string;
  teacher: string;
  date: string;
  tag: string;
  studentCount: number;
  memo: string;
};

/**
 * tetsudatte.html（高専版）で登録された実施記録を、Notionの
 * 「📔 てつだって高専版 実施記録」データソースに1件記録する。
 */
export async function logKosenRecord(input: KosenRecordInput): Promise<KosenRecordResult> {
  const notion = getClient();

  const page = await notion.pages.create({
    parent: { data_source_id: KOSEN_RECORD_DATA_SOURCE_ID, type: "data_source_id" },
    properties: {
      Name: { title: [{ text: { content: `${input.school}｜${input.teacher}｜${input.date}` } }] },
      実施日: { date: { start: input.date } },
      高専名: { select: { name: input.school } },
      先生担当: { rich_text: [{ text: { content: input.teacher.slice(0, 200) } }] },
      分野タグ: { select: { name: input.tag } },
      参加学生数: { number: input.studentCount },
      メモ: { rich_text: [{ text: { content: input.memo.slice(0, 2000) } }] },
    },
  });

  return { pageId: page.id, url: isFullPage(page) ? page.url : "" };
}

/**
 * 「📔 てつだって高専版 実施記録」データソースから、実施日の新しい順に一覧を取得する。
 */
export async function listKosenRecords(limit = 50): Promise<KosenRecordListItem[]> {
  const notion = getClient();

  const res = await notion.dataSources.query({
    data_source_id: KOSEN_RECORD_DATA_SOURCE_ID,
    sorts: [{ property: "実施日", direction: "descending" }],
    page_size: limit,
  });

  return res.results.filter(isFullPage).map((page) => ({
    school: plainTextFromProperty(page.properties["高専名"]),
    teacher: plainTextFromProperty(page.properties["先生担当"]),
    date: plainTextFromProperty(page.properties["実施日"]),
    tag: plainTextFromProperty(page.properties["分野タグ"]),
    studentCount: Number(plainTextFromProperty(page.properties["参加学生数"])) || 0,
    memo: plainTextFromProperty(page.properties["メモ"]),
  }));
}

// 全体共通の「ChangeRequest（改造要求管理）」DBのデータソースID
const CHANGE_REQUEST_DATA_SOURCE_ID = "78efaf0f-310d-4dc4-991f-ca5c3abf0d13";

export type ChangeRequestTargetArea = "てつだって" | "意思決定支援" | "カードゲーム" | "会社サイト";

export type AutoChangeRequestInput = {
  title: string;
  description: string;
  targetArea?: ChangeRequestTargetArea;
  requesterDetail?: string;
  relatedInquiryPageId: string;
};

/**
 * 「利用者からの改造要求 自動処理フロー設計書」の通り、お問い合わせAIチャットが
 * 改造・機能要望を判定した際に、ChangeRequestへ自動起票する。
 * Priority=中・Status=未着手・SourceChannel=お問い合わせフォーム・RequesterType=利用者からの要望で固定。
 */
export async function createChangeRequestFromInquiry(input: AutoChangeRequestInput): Promise<void> {
  const notion = getClient();

  await notion.pages.create({
    parent: { data_source_id: CHANGE_REQUEST_DATA_SOURCE_ID, type: "data_source_id" },
    properties: {
      Title: { title: [{ text: { content: input.title.slice(0, 200) } }] },
      Description: { rich_text: [{ text: { content: input.description.slice(0, 2000) } }] },
      RequesterType: { select: { name: "利用者からの要望" } },
      ...(input.requesterDetail
        ? { RequesterDetail: { rich_text: [{ text: { content: input.requesterDetail.slice(0, 200) } }] } }
        : {}),
      SourceChannel: { select: { name: "お問い合わせフォーム" } },
      ...(input.targetArea ? { TargetArea: { multi_select: [{ name: input.targetArea }] } } : {}),
      Priority: { select: { name: "中" } },
      Status: { select: { name: "未着手" } },
      ...(input.relatedInquiryPageId
        ? { RelatedInquiry: { relation: [{ id: input.relatedInquiryPageId }] } }
        : {}),
    },
  });
}

/**
 * ChangeRequest自動作成後、元のContactInquiryのAutoLoggedをtrueにする
 * (分室スタッフが手動で二重登録しないようにするための目印)。
 */
export async function markContactInquiryAutoLogged(pageId: string): Promise<void> {
  if (!pageId) return;
  const notion = getClient();
  await notion.pages.update({
    page_id: pageId,
    properties: {
      AutoLogged: { checkbox: true },
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

// ------------------------------------------------------------------
// 複数団体対応(マルチテナント化)用の汎用版。
// りとけい専用だった上のgetRitokeiResourceDashboardData()と処理内容は同じだが、
// IssuePageId・PositionRecordDataSourceIdを引数で受け取るため、
// テナント(団体)ごとに異なるNotionページを指せる。
// ------------------------------------------------------------------

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
    case "date":
      return prop.date?.start ?? "";
    case "number":
      return prop.number != null ? String(prop.number) : "";
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
  return getIssueDashboardData(RITOKEI_RESOURCE_ISSUE_PAGE_ID, RITOKEI_POSITION_RECORD_DATA_SOURCE_ID);
}

/**
 * 任意のIssuePageId・PositionRecordDataSourceIdについて、Issueの内容と
 * それに紐づくPositionRecord(立場表明ログ = 議事録・意見)をNotionからライブ取得する。
 * テナント(団体)ごとのダッシュボードから、このタイトル・データソースIDだけを
 * 差し替えて呼び出すことで、同じ仕組みを複数団体に対応させられる。
 */
export async function getIssueDashboardData(
  issuePageId: string,
  positionRecordDataSourceId: string
): Promise<RitokeiResourceDashboardData> {
  const notion = getClient();

  const issuePage = await notion.pages.retrieve({ page_id: issuePageId });
  const issueTitle = isFullPage(issuePage)
    ? plainTextFromProperty(issuePage.properties["Title"])
    : "意思決定支援の論点";

  const positionRes = await notion.dataSources.query({
    data_source_id: positionRecordDataSourceId,
    filter: {
      property: "Issue",
      relation: { contains: issuePageId },
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

// ------------------------------------------------------------------
// テナント(団体)向けダッシュボードの追加タブ用データ取得。
// EvidenceRecordはIssue単位(その論点専用のDB)、補助金・交付金マッチングDBは
// 全団体共通のDBを「対象自治体」タグで絞り込んで取得する。
// どちらも省略可能(データソースIDが渡されなければ空配列を返す)にしているのは、
// まだ8DBを個別に持たない試用段階のテナントでもエラーにしないため。
// ------------------------------------------------------------------

export type EvidenceRecord = {
  title: string;
  summary: string;
};

export async function getIssueEvidenceRecords(
  issuePageId: string,
  evidenceDataSourceId: string
): Promise<EvidenceRecord[]> {
  const notion = getClient();
  const res = await notion.dataSources.query({
    data_source_id: evidenceDataSourceId,
    filter: {
      property: "Issue",
      relation: { contains: issuePageId },
    },
  });

  return res.results.filter(isFullPage).map((page) => ({
    title: plainTextFromProperty(page.properties["Title"]),
    summary: plainTextFromProperty(page.properties["要約"]),
  }));
}

export type FundingMatch = {
  name: string;
  agency: string;
  summary: string;
  amount: string;
  matchReason: string;
  sourceUrl: string;
};

function urlFromProperty(prop: PageObjectResponse["properties"][string] | undefined): string {
  if (!prop || prop.type !== "url") return "";
  return prop.url ?? "";
}

// ------------------------------------------------------------------
// 分室ページから、パスワードなしで誰でも意見を届けられる投稿機能。
// 「しまのみんな会議」カードゲーム(別リポジトリ)を持たない新規テナントでも、
// 意見収集そのものはこの仕組みで最低限まかなえるようにする。
// ------------------------------------------------------------------

export type OpinionInput = {
  stance: "賛成" | "反対" | "条件付き賛成" | "保留";
  content: string;
};

/**
 * 分室ページの意見投稿フォームから届いた内容を、そのテナントのPositionRecordに
 * 匿名の1件として記録する。Stakeholderへの関係者登録は行わない(誰でも投稿できる導線のため)。
 */
export async function submitOpinion(
  issuePageId: string,
  positionRecordDataSourceId: string,
  input: OpinionInput
): Promise<void> {
  const notion = getClient();
  const title = `分室ページからの意見投稿(${new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })})`;

  await notion.pages.create({
    parent: { data_source_id: positionRecordDataSourceId, type: "data_source_id" },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Stance: { select: { name: input.stance } },
      Channel: { select: { name: "非同期投稿" } },
      取材元: { select: { name: "RunWith直接入力" } },
      内容: { rich_text: [{ text: { content: input.content.slice(0, 2000) } }] },
      Issue: { relation: [{ id: issuePageId }] },
    },
  });
}

// ------------------------------------------------------------------
// 高専サイト「先生ページ 編集モード」用のセル上書きストア。
// CR「オープンデータで作成した各先生ページを、先生本人が編集できるようにしたい」(2026-09-09)。
// public/kosen/case-*.html には data-cell-id を付けた要素があり、public/js/kosen-cell-editor.js が
// 読み込み時にこのDBの内容で上書き表示する。保存先はSupabaseの「セル単位手修正」と同じ考え方だが、
// 高専サイトはCLAUDE.mdの方針(成果物はNotionに集約)に合わせてNotion DB側に保存する。
// ------------------------------------------------------------------

const KOSEN_CELL_OVERRIDE_DATA_SOURCE_ID = "9e92db47-f022-4b11-a551-6b6f3ca49049";

export type KosenCellOverride = {
  slug: string;
  cellId: string;
  content: string;
  editorName: string;
  updatedAt: string;
};

/** 指定した先生ページ(slug)の、手修正済みセルを全件取得する(ログイン不要・表示用) */
export async function getKosenCellOverrides(slug: string): Promise<KosenCellOverride[]> {
  const notion = getClient();
  const res = await notion.dataSources.query({
    data_source_id: KOSEN_CELL_OVERRIDE_DATA_SOURCE_ID,
    filter: {
      property: "ページSlug",
      select: { equals: slug },
    },
  });

  return res.results.filter(isFullPage).map((page) => ({
    slug,
    cellId: plainTextFromProperty(page.properties["セルID"]),
    content: plainTextFromProperty(page.properties["内容"]),
    editorName: plainTextFromProperty(page.properties["編集者名"]),
    updatedAt: plainTextFromProperty(page.properties["更新日時"]),
  }));
}

/** 1セル分の手修正を保存する(既存の(slug, cellId)行があれば上書き=upsert、なければ新規作成) */
export async function upsertKosenCellOverride(params: {
  slug: string;
  cellId: string;
  content: string;
  editorName: string;
}): Promise<void> {
  const notion = getClient();
  const nowIso = new Date().toISOString();

  const existing = await notion.dataSources.query({
    data_source_id: KOSEN_CELL_OVERRIDE_DATA_SOURCE_ID,
    filter: {
      and: [
        { property: "ページSlug", select: { equals: params.slug } },
        { property: "セルID", rich_text: { equals: params.cellId } },
      ],
    },
    page_size: 1,
  });

  const properties = {
    Name: { title: [{ text: { content: `${params.slug}::${params.cellId}` } }] },
    ページSlug: { select: { name: params.slug } },
    セルID: { rich_text: [{ text: { content: params.cellId.slice(0, 200) } }] },
    内容: { rich_text: [{ text: { content: params.content.slice(0, 2000) } }] },
    編集者名: { rich_text: [{ text: { content: params.editorName.slice(0, 200) } }] },
    更新日時: { date: { start: nowIso } },
  };

  const found = existing.results.find(isFullPage);
  if (found) {
    await notion.pages.update({ page_id: found.id, properties });
  } else {
    await notion.pages.create({
      parent: { data_source_id: KOSEN_CELL_OVERRIDE_DATA_SOURCE_ID, type: "data_source_id" },
      properties,
    });
  }
}

/** 補助金・交付金マッチングDB(全団体共通)を、「対象自治体」タグで絞り込んで取得する */
export async function getFundingMatches(
  fundingDataSourceId: string,
  targetAreaTag: string
): Promise<FundingMatch[]> {
  const notion = getClient();
  const res = await notion.dataSources.query({
    data_source_id: fundingDataSourceId,
    filter: {
      property: "対象自治体",
      multi_select: { contains: targetAreaTag },
    },
  });

  return res.results.filter(isFullPage).map((page) => ({
    name: plainTextFromProperty(page.properties["制度名"]),
    agency: plainTextFromProperty(page.properties["所管機関"]),
    summary: plainTextFromProperty(page.properties["概要"]),
    amount: plainTextFromProperty(page.properties["補助率・上限額"]),
    matchReason: plainTextFromProperty(page.properties["マッチ理由"]),
    sourceUrl: urlFromProperty(page.properties["出典URL"]),
  }));
}

// ------------------------------------------------------------------
// 地域創生HDパートナーズ「コンプライアンス・ナレッジ」機能
// CR「コンプライアンス・ナレッジ機能の追加」(林さん提案、2026-09-10対応)。
// 本部から代理店へ、法令・営業ルール・苦情対応事例・FAQを正式に還元する読み取り専用の一覧機能。
// CR「AIの判断と人間の最終判断の切り分け」の運用ルール(覚書①)に合わせて、
// 各ナレッジには ReviewStatus(「AI起草(参考)」/「本部確認済み」) のラベルを必ず付与する。
// 「Status=公開」の行だけを、認証なしで/partners/compliance.htmlに表示する(読み取り専用・編集画面は今回のスコープ外)。
// ------------------------------------------------------------------

const PARTNERS_COMPLIANCE_DATA_SOURCE_ID = "462dfc2d-821d-4398-9e77-18abd0ed4e22";

export type ComplianceKnowledgeItem = {
  title: string;
  category: string; // 法令・規制 / 営業ルール / 苦情対応事例 / FAQ
  body: string;
  reviewStatus: string; // AI起草(参考) / 本部確認済み
  updatedAt: string;
};

/** 「Status=公開」のコンプライアンス・ナレッジを全件取得する(表示用・ログイン不要) */
export async function getPublishedComplianceKnowledge(): Promise<ComplianceKnowledgeItem[]> {
  const notion = getClient();
  const res = await notion.dataSources.query({
    data_source_id: PARTNERS_COMPLIANCE_DATA_SOURCE_ID,
    filter: {
      property: "Status",
      select: { equals: "公開" },
    },
  });

  return res.results.filter(isFullPage).map((page) => ({
    title: plainTextFromProperty(page.properties["Title"]),
    category: plainTextFromProperty(page.properties["Category"]),
    body: plainTextFromProperty(page.properties["Body"]),
    reviewStatus: plainTextFromProperty(page.properties["ReviewStatus"]),
    updatedAt: plainTextFromProperty(page.properties["UpdatedAt"]),
  }));
}
