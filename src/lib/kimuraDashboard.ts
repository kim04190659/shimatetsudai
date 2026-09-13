// ============================================================
// 木村さん個人の「意思決定支援ダッシュボード」データ取得
// ============================================================
// このファイルは、既存の src/lib/notion.ts と同じやり方(@notionhq/client)で
// Notionからデータを取得します。ただし木村さん個人用のデータは、他の団体向け
// ダッシュボード(tenantDashboard.ts)が使っている「論点(Issue)＋立場表明(PositionRecord)」
// という形とは別物(依頼の一覧＋立場ごとの時間配分バランス)なので、
// 専用のファイルとして分けています。
//
// 参照しているNotionデータベース(このセッションで作成したもの):
//   ①「役割別 依頼・気づき管理」データソース
//      → 6つの立場ごとの依頼・気づきを1件ずつ記録するDB
//   ②「立場マスタ（時間配分バランス）」データソース
//      → 6つの立場ごとの週次の目標時間・使用中時間・残り時間・状態(🟢🟡🔴)を持つDB
//
// Notionの「フォーミュラ(formula)」「ロールアップ(rollup)」「ステータス(status)」
// プロパティは、既存の plainTextFromProperty (notion.ts内、titleやselect等のみ対応)
// では読み取れないため、この専用ファイルの中で読み取り方を追加しています。

import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// 「役割別 依頼・気づき管理」データソースID
const REQUEST_DATA_SOURCE_ID = "cc214b03-9477-42a6-8026-29aa0fbb0e24";
// 「立場マスタ（時間配分バランス）」データソースID
const BALANCE_DATA_SOURCE_ID = "3692fa4a-6a00-4e6b-9f91-832718e5904e";

let client: Client | null = null;

// Notion API クライアントを1回だけ作って再利用する(notion.tsと同じやり方)
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

type NotionProperty = PageObjectResponse["properties"][string];

// プロパティから「文字として表示したい値」を取り出す。
// title・rich_text・select・status・date・number・formula・rollup に対応。
// (notion.ts の plainTextFromProperty を、formula/rollup/status にも対応するよう拡張したもの)
function propText(prop: NotionProperty | undefined): string {
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "select":
      return prop.select?.name ?? "";
    case "status":
      return prop.status?.name ?? "";
    case "date":
      return prop.date?.start ?? "";
    case "number":
      return prop.number != null ? String(prop.number) : "";
    case "formula":
      // フォーミュラの結果は string / number / boolean / date のいずれか
      if (prop.formula.type === "string") return prop.formula.string ?? "";
      if (prop.formula.type === "number")
        return prop.formula.number != null ? String(prop.formula.number) : "";
      if (prop.formula.type === "boolean") return prop.formula.boolean ? "true" : "false";
      return "";
    case "rollup":
      // 今回使っているロールアップは「合計(sum)」なので number 型
      if (prop.rollup.type === "number")
        return prop.rollup.number != null ? String(prop.rollup.number) : "";
      return "";
    default:
      return "";
  }
}

// プロパティから数値を取り出す(number / formula(number) / rollup(number) 用)。
// 値が無い場合は 0 を返す(「使用中時間0h」のように、未着手の立場でも表として崩れないようにするため)。
function propNumber(prop: NotionProperty | undefined): number {
  const text = propText(prop);
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------------------------------------------
// ①「役割別 依頼・気づき管理」から、依頼を1件ずつ取り出す
// ------------------------------------------------------------------

export type KimuraRequestItem = {
  title: string; // 依頼内容
  stance: string; // 立場(NEC/同窓会/学会/高専教育DX/離島経済新聞社/しまてつだい)
  priority: string; // 優先度(高/中/低)
  status: string; // 状態(未着手/進行中/完了)
  dueDate: string; // 締切(YYYY-MM-DD、未設定なら空文字)
  requestedBy: string; // 依頼元
  hours: number; // 想定所要時間(h)
  urgencyScore: number; // 緊急度スコア(Notion側のフォーミュラで自動計算。高いほど優先)
};

async function getKimuraRequests(): Promise<KimuraRequestItem[]> {
  const notion = getClient();

  // 「状態」が「完了」以外の依頼だけを、緊急度スコアが高い順に取得する。
  // これがそのまま「今週どれをやるべきか」の答えになる。
  const res = await notion.dataSources.query({
    data_source_id: REQUEST_DATA_SOURCE_ID,
    filter: {
      property: "状態",
      status: { does_not_equal: "完了" },
    },
    sorts: [{ property: "緊急度スコア", direction: "descending" }],
  });

  return res.results.filter(isFullPage).map((page) => ({
    title: propText(page.properties["依頼内容"]),
    stance: propText(page.properties["立場"]),
    priority: propText(page.properties["優先度"]),
    status: propText(page.properties["状態"]),
    dueDate: propText(page.properties["締切"]),
    requestedBy: propText(page.properties["依頼元"]),
    hours: propNumber(page.properties["想定所要時間(h)"]),
    urgencyScore: propNumber(page.properties["緊急度スコア"]),
  }));
}

// ------------------------------------------------------------------
// ②「立場マスタ（時間配分バランス）」から、立場ごとの時間配分バランスを取り出す
// ------------------------------------------------------------------

export type KimuraBalanceItem = {
  stance: string; // 立場名
  targetHours: number; // 目標時間(h/週)
  usedHours: number; // 使用中時間(h) = 未完了の依頼の想定所要時間の合計(自動集計)
  remainingHours: number; // 残り時間(h) = 目標 - 使用中
  status: string; // 状態(🟢余裕あり/🟡余裕少/🔴上限超過)
};

async function getKimuraBalances(): Promise<KimuraBalanceItem[]> {
  const notion = getClient();

  const res = await notion.dataSources.query({
    data_source_id: BALANCE_DATA_SOURCE_ID,
  });

  return res.results.filter(isFullPage).map((page) => ({
    stance: propText(page.properties["立場"]),
    targetHours: propNumber(page.properties["目標時間(h/週)"]),
    usedHours: propNumber(page.properties["使用中時間(h)"]),
    remainingHours: propNumber(page.properties["残り時間(h)"]),
    status: propText(page.properties["状態"]),
  }));
}

// ------------------------------------------------------------------
// ダッシュボード全体のデータをまとめて取得する
// ------------------------------------------------------------------

export type KimuraDashboardData = {
  requests: KimuraRequestItem[];
  balances: KimuraBalanceItem[];
  generatedAt: string; // このデータをいつ取得したか(ISO文字列)
};

// ページを開くたびにNotionへライブ取得する(件数が少なく、LLM要約も使わないため
// キャッシュを設けず常に最新を表示する。他団体向けダッシュボードのように
// 「更新ボタン」を用意する必要が今のところ無い)。
export async function getKimuraDashboardData(): Promise<KimuraDashboardData> {
  const [requests, balances] = await Promise.all([getKimuraRequests(), getKimuraBalances()]);
  return { requests, balances, generatedAt: new Date().toISOString() };
}
