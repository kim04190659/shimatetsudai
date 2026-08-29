// 管理者画面「議事録取り込みフロー」ステップ1〜3のAPI。
// 対象Issue・対象ミーティングノートのページIDを受け取り、
// (1) Issueの書き込み先4DB(Evidence/Position/Goal/Agreement)を特定し、
// (2) ミーティングノートの本文を取得し、
// (3) AIで4分類に構造化した下書きを返す。
// ここではNotionへの書き込みは一切行わない(プレビューのみ)。
import { NextRequest, NextResponse } from "next/server";
import {
  resolveIssueRelationTargets,
  getPageTextContent,
  structureMeetingNotes,
  extractNotionPageId,
} from "@/lib/adminMeetingImport";
import { assertAdminAccess } from "@/lib/adminAccess";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = assertAdminAccess(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { issuePageId?: string; meetingNotePageId?: string };
    const rawIssuePageId = body.issuePageId?.trim();
    const rawMeetingNotePageId = body.meetingNotePageId?.trim();

    if (!rawIssuePageId || !rawMeetingNotePageId) {
      return NextResponse.json(
        { error: "issuePageId と meetingNotePageId は必須です" },
        { status: 400 }
      );
    }

    // 画面にNotionのURLがそのまま貼られるケースがあるため、ここでページIDだけを抽出する。
    // (以前はURLをそのままNotion APIに渡してしまい「Invalid request URL」になっていた)
    let issuePageId: string;
    let meetingNotePageId: string;
    try {
      issuePageId = extractNotionPageId(rawIssuePageId);
      meetingNotePageId = extractNotionPageId(rawMeetingNotePageId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ページIDの解析に失敗しました";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const [targets, transcript] = await Promise.all([
      resolveIssueRelationTargets(issuePageId),
      getPageTextContent(meetingNotePageId),
    ]);

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "ミーティングノートの本文が空でした。ページIDを確認してください" },
        { status: 400 }
      );
    }

    const structured = await structureMeetingNotes({ issueTitle: targets.issueTitle, transcript });

    return NextResponse.json({
      issueTitle: targets.issueTitle,
      targets,
      transcriptPreview: transcript.slice(0, 4000),
      structured,
    });
  } catch (err) {
    console.error("meeting-import/analyze error:", err);
    const message = err instanceof Error ? err.message : "予期しないエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
