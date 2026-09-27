// 高専サイト「先生自身によるカリキュラム修正」API。
// 2026-09-27 角田直輝先生(米子高専)からの依頼への対応:
// 「資料投入エリアから、先生自らがカリキュラムの修正が出来るようにしたい。カリキュラムの内容について、
//  ここをこう変更したいという入力を入れられるようにして、この内容をカリキュラムに反映するというボタンを
//  押下すると、カリキュラムに反映され、教育充実度指標の診断値が変更されるようにしたい。修正した結果を
//  カリキュラム支援エージェントにも反映させて欲しい」
//
// 認証は既存の「先生ページ編集モード」の合言葉ログイン(kosen-edit/login)をそのまま流用する。
// 処理の流れ:
//   1) LLM(Claude)に、現在のダッシュボード内容(JSON)+先生の変更依頼を渡し、構造化JSONで更新案を作らせる
//   2) 更新対象セル(cur-conclusion / cur-unassigned / ns-tldr / ns-discuss)と、
//      情報充足度診断のスコア・弱点メモ(ns-radar-scores / ns-weaknotes、JSON文字列として保存する予約セルID)を
//      既存のセル上書きDB(upsertKosenCellOverride)に保存する → 次回アクセス時・今回のレスポンスで即座に画面へ反映される
//   3) Notionの15コマ提案ページ本体にも、依頼内容と反映結果を追記する(カリキュラム支援エージェントへの申し送り)
//
// 15コマ表(cur-schedule)自体はHTML構造が壊れるリスクがあるため、このAPIでは直接書き換えない。
// 表に関わる変更依頼は、LLMがunassignedTextの中に「先生からの修正依頼への対応」として明記する設計(prompt.ts参照)。

import { NextRequest, NextResponse } from "next/server";
import { verifyKosenEditSessionToken, KOSEN_EDIT_SESSION_COOKIE_NAME } from "@/lib/kosenEditAuth";
import { summarizeIssueWithFallback } from "@/lib/llm";
import { upsertKosenCellOverride, appendCurriculumRevisionRecord } from "@/lib/notion";

export const runtime = "nodejs";

// 2026-09-27(第2版): 15コマ表(cur-schedule)を「行データのJSON配列」として安全に更新できるようにした。
// (経緯: 当初は表を直接書き換えないルールだったが、それとは別口で、先生ページの手修正モードが
//  TABLE要素をcontenteditableにしてしまい、表がテキストとして潰れて壊れる事故が実際に発生した。
//  そこで表は常に「構造化データ→DOM組み立て」を経由させ、プレーンテキストのtextContent代入を
//  一切経由しないようにした。これにより、AIによる表の更新も安全に行えるようになった)
type ScheduleRow = {
  no: number;
  category: string; // "先生" | "企業"
  theme: string;
  goal: string;
  activity: string;
  methodNote: string;
};

type CurrentDashboardContent = {
  conclusionText: string;
  unassignedText: string;
  northstarTldrText: string;
  discussText: string;
  radarScores: Record<string, number>;
  weakNotes: Record<string, string>;
  scheduleRows?: ScheduleRow[];
};

type CurriculumRevisionResult = {
  summary: string;
  conclusionText: string;
  unassignedText: string;
  northstarTldrText: string;
  discussText: string;
  radarScores: Record<string, number>;
  weakNotes: Record<string, string>;
  scheduleRows?: ScheduleRow[];
};

function isValidScheduleRows(value: unknown): value is ScheduleRow[] {
  if (!Array.isArray(value) || value.length !== 15) return false;
  return value.every((row, i) => {
    if (!row || typeof row !== "object") return false;
    const r = row as Record<string, unknown>;
    return (
      typeof r.no === "number" &&
      r.no === i + 1 &&
      typeof r.category === "string" &&
      typeof r.theme === "string" &&
      typeof r.goal === "string" &&
      typeof r.activity === "string" &&
      typeof r.methodNote === "string"
    );
  });
}

// Claudeへは「コードフェンスなしでJSONのみ返す」よう指示しているが(prompt.ts参照)、
// 実際には ```json ... ``` で囲んで返してくることがある(2026-09-27 実運用で確認)。
// 素の JSON.parse だとこの場合に構文エラーで落ちてしまうため、コードフェンスを剥がしてから
// パースする。フェンスが無い場合はそのまま解析する。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLlmJson(raw: string): any {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function isCurrentDashboardContent(value: unknown): value is CurrentDashboardContent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.conclusionText === "string" &&
    typeof v.unassignedText === "string" &&
    typeof v.northstarTldrText === "string" &&
    typeof v.discussText === "string" &&
    typeof v.radarScores === "object" &&
    typeof v.weakNotes === "object"
  );
}

export async function POST(req: NextRequest) {
  const session = verifyKosenEditSessionToken(req.cookies.get(KOSEN_EDIT_SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "編集モードにログインしてください" }, { status: 401 });
  }

  let body: {
    slug?: string;
    issuePageId?: string;
    issueTitle?: string;
    changeRequest?: string;
    current?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const { slug, issuePageId, issueTitle, changeRequest, current } = body;
  if (
    typeof slug !== "string" ||
    !slug ||
    typeof issuePageId !== "string" ||
    !issuePageId ||
    typeof changeRequest !== "string" ||
    !changeRequest.trim()
  ) {
    return NextResponse.json(
      { error: "slug / issuePageId / changeRequest は必須です" },
      { status: 400 }
    );
  }
  if (!isCurrentDashboardContent(current)) {
    return NextResponse.json({ error: "current(現在のダッシュボード内容)の形式が不正です" }, { status: 400 });
  }

  let result: CurriculumRevisionResult;
  try {
    const llmResult = await summarizeIssueWithFallback({
      issueTitle: typeof issueTitle === "string" ? issueTitle : "",
      sourceNotes: JSON.stringify(current),
      question: changeRequest,
      mode: "curriculumRevise",
    });
    const parsed = parseLlmJson(llmResult.draft);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.conclusionText !== "string" ||
      typeof parsed.unassignedText !== "string" ||
      typeof parsed.northstarTldrText !== "string" ||
      typeof parsed.discussText !== "string"
    ) {
      throw new Error("AIの応答が想定した形式(JSON)ではありません");
    }
    result = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      conclusionText: parsed.conclusionText,
      unassignedText: parsed.unassignedText,
      northstarTldrText: parsed.northstarTldrText,
      discussText: parsed.discussText,
      radarScores: typeof parsed.radarScores === "object" && parsed.radarScores ? parsed.radarScores : current.radarScores,
      weakNotes: typeof parsed.weakNotes === "object" && parsed.weakNotes ? parsed.weakNotes : current.weakNotes,
    };
    // scheduleRowsは表の変更依頼のときだけAIが返す(出力ルール参照)。
    // 15要素・no=1..15の並びが崩れている場合は、表の破損を防ぐため無視する(他の更新は継続する)。
    if (isValidScheduleRows(parsed.scheduleRows)) {
      result.scheduleRows = parsed.scheduleRows;
    } else if (parsed.scheduleRows !== undefined) {
      console.warn("kosen-curriculum-revise: scheduleRowsの形式が不正なため無視しました", parsed.scheduleRows);
    }
  } catch (err) {
    console.error("kosen-curriculum-revise LLM error:", err);
    return NextResponse.json({ error: "AIによる反映案の生成に失敗しました" }, { status: 502 });
  }

  const editorName = session.editorName;
  try {
    const writes = [
      upsertKosenCellOverride({ slug, cellId: "cur-conclusion", content: result.conclusionText, editorName }),
      upsertKosenCellOverride({ slug, cellId: "cur-unassigned", content: result.unassignedText, editorName }),
      upsertKosenCellOverride({ slug, cellId: "ns-tldr", content: result.northstarTldrText, editorName }),
      upsertKosenCellOverride({ slug, cellId: "ns-discuss", content: result.discussText, editorName }),
      upsertKosenCellOverride({
        slug,
        cellId: "ns-radar-scores",
        content: JSON.stringify(result.radarScores),
        editorName,
      }),
      upsertKosenCellOverride({
        slug,
        cellId: "ns-weaknotes",
        content: JSON.stringify(result.weakNotes),
        editorName,
      }),
    ];
    // 表(15コマ授業計画)の変更依頼だったときだけ、行データを予約セルID(cur-schedule-rows)に保存する。
    // 通常のcur-scheduleセル(TABLE要素本体)には絶対に書き込まない(textContent代入による構造破壊を防ぐため)。
    if (result.scheduleRows) {
      writes.push(
        upsertKosenCellOverride({
          slug,
          cellId: "cur-schedule-rows",
          content: JSON.stringify(result.scheduleRows),
          editorName,
        })
      );
    }
    await Promise.all(writes);
  } catch (err) {
    console.error("kosen-curriculum-revise save error:", err);
    return NextResponse.json({ error: "反映内容の保存に失敗しました" }, { status: 502 });
  }

  // Notion本体(15コマ提案ページ)への追記は、カリキュラム支援エージェントへの申し送り用。
  // これが失敗しても、上のセル上書き保存(=画面表示への反映)は既に完了しているため、ログのみ残して処理は継続する。
  try {
    await appendCurriculumRevisionRecord({
      issuePageId,
      editorName,
      changeRequest,
      summary: result.summary,
    });
  } catch (err) {
    console.error("kosen-curriculum-revise notion append error:", err);
  }

  return NextResponse.json({ ok: true, editorName, result });
}
