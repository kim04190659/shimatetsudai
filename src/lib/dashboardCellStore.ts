// 意思決定支援ダッシュボードの「セル単位の手修正」を保存・取得するための薄いクライアント。
//
// 背景(ChangeRequest「意思決定支援ダッシュボードの各セルを分室職員が…直接編集できる仕組み化」):
// これまでダッシュボード(public/case-studies/*.html)は静的HTMLで、内容を直すにはコードを
// 直接編集してcommitする必要があり、分室スタッフ本人が気付いた間違いをその場で直せなかった。
// この仕組みは、ホームページ(ダッシュボード)を見ながらセルをクリックして直接修正できるように
// するためのもの。保存先はNotionではなくSupabase(このためだけの新規プロジェクト)。
// 理由：セル単位の大量の行と「AI再生成で上書きしない」というロック管理は、Notionのページ/DBより
// 構造化テーブルの方が素直に表現できるため(CLAUDE.mdの「Notionで表現できない場合はSupabase等」に該当)。
//
// npm依存を増やさないため、@supabase/supabase-jsは使わずSupabaseのREST API(PostgREST)を
// そのままfetchで叩く、最小限の実装にしている。

export type DashboardCellOverride = {
  dashboardSlug: string;
  cellId: string;
  content: string;
  editorName: string | null;
  lockedFromAiRegen: boolean;
  updatedAt: string;
};

function getSupabaseConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません(セル編集機能にはVercelの環境変数設定が必要です)"
    );
  }
  return { url, serviceRoleKey };
}

/** 指定したダッシュボード(slug)の、手修正済みセルを全件取得する */
export async function getCellOverrides(dashboardSlug: string): Promise<DashboardCellOverride[]> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/dashboard_cell_overrides?dashboard_slug=eq.${encodeURIComponent(dashboardSlug)}&select=cell_id,content,editor_name,locked_from_ai_regen,updated_at`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    // セル編集は準リアルタイム性が欲しいのでキャッシュしない
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`セル上書きデータの取得に失敗しました(status=${res.status})`);
  }

  const rows = (await res.json()) as Array<{
    cell_id: string;
    content: string;
    editor_name: string | null;
    locked_from_ai_regen: boolean;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    dashboardSlug,
    cellId: row.cell_id,
    content: row.content,
    editorName: row.editor_name,
    lockedFromAiRegen: row.locked_from_ai_regen,
    updatedAt: row.updated_at,
  }));
}

/** 1セル分の手修正を保存する(既存があれば上書き=upsert) */
export async function upsertCellOverride(params: {
  dashboardSlug: string;
  cellId: string;
  content: string;
  editorName: string | null;
}): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/dashboard_cell_overrides?on_conflict=dashboard_slug,cell_id`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      // 既存行があればマージ更新(upsert)。重複時にエラーにしない。
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        dashboard_slug: params.dashboardSlug,
        cell_id: params.cellId,
        content: params.content,
        editor_name: params.editorName,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`セル上書きの保存に失敗しました(status=${res.status}) ${text}`);
  }
}
