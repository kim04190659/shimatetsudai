// 左メニューに入力した議事録・資料の本文の履歴(Supabase: dashboard_input_history)。
// 「何を入力したか忘れないように、あとから文字データとして見返せるようにしたい」(2026-10-04)への対応。
// 本文は非公開の議事録を含み得るため、読み書きとも編集モードのログイン必須(APIルート側で検証)。
// Notionの議事メモDBは本文が2,000字で切れ、かつ「未反映」キューとして別用途のため、使わない。

export const INPUT_HISTORY_MAX_BODY = 30_000;

export type InputHistoryItem = {
  id: number;
  kind: "minutes" | "material";
  title: string;
  provider: string | null;
  editorName: string | null;
  appliedCount: number;
  charCount: number;
  createdAt: string;
};

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

export async function listInputHistory(slug: string, limit = 30): Promise<InputHistoryItem[]> {
  const { url, headers } = cfg();
  // 文字数を表示するため、一覧でも本文を取得して長さだけ計算する(最大30件・各30,000字以内なので十分軽い)。
  const res = await fetch(
    `${url}/rest/v1/dashboard_input_history?dashboard_slug=eq.${encodeURIComponent(slug)}` +
      `&select=id,kind,title,provider,editor_name,applied_count,created_at,body&order=created_at.desc&limit=${limit}`,
    { headers, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`履歴の取得に失敗しました(status=${res.status})`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: r.id as number,
    kind: r.kind as "minutes" | "material",
    title: String(r.title ?? ""),
    provider: (r.provider as string | null) ?? null,
    editorName: (r.editor_name as string | null) ?? null,
    appliedCount: Number(r.applied_count ?? 0),
    charCount: String(r.body ?? "").length,
    createdAt: String(r.created_at),
  }));
}

export async function getInputHistoryBody(slug: string, id: number): Promise<string | null> {
  const { url, headers } = cfg();
  const res = await fetch(
    `${url}/rest/v1/dashboard_input_history?id=eq.${id}&dashboard_slug=eq.${encodeURIComponent(slug)}&select=body`,
    { headers, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`履歴の取得に失敗しました(status=${res.status})`);
  const rows = (await res.json()) as Array<{ body: string }>;
  return rows[0]?.body ?? null;
}

export async function createInputHistory(p: {
  slug: string;
  kind: "minutes" | "material";
  title: string;
  body: string;
  provider: string | null;
  editorName: string | null;
}): Promise<number> {
  const { url, headers } = cfg();
  const res = await fetch(`${url}/rest/v1/dashboard_input_history`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify([
      {
        dashboard_slug: p.slug,
        kind: p.kind,
        title: p.title.slice(0, 200),
        body: p.body,
        provider: p.provider,
        editor_name: p.editorName,
      },
    ]),
  });
  if (!res.ok) throw new Error(`履歴の保存に失敗しました(status=${res.status})`);
  const rows = (await res.json()) as Array<{ id: number }>;
  return rows[0].id;
}

export async function markInputHistoryApplied(slug: string, id: number, appliedCount: number): Promise<void> {
  const { url, headers } = cfg();
  const res = await fetch(
    `${url}/rest/v1/dashboard_input_history?id=eq.${id}&dashboard_slug=eq.${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ applied_count: appliedCount }),
    }
  );
  if (!res.ok) throw new Error(`履歴の更新に失敗しました(status=${res.status})`);
}
