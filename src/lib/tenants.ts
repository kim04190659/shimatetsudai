// 複数団体対応(マルチテナント化)フェーズ1: 環境変数でテナント設定を持つ簡易版。
//
// TENANTS_CONFIG という環境変数に、以下の形のJSON配列を1本の文字列として設定する。
// 団体が増えるたびに、この配列に1件追加してデプロイし直す運用(フェーズ1の割り切り)。
//
// [
//   {
//     "slug": "site-01",
//     "label": "社内管理用メモ(画面には出さない)",
//     "issuePageId": "NotionのIssueページID",
//     "positionRecordDataSourceId": "NotionのPositionRecordデータソースID",
//     "passwordHash": "bcryptでハッシュ化したパスワード",
//     "status": "active",
//     "evidenceDataSourceId": "(任意)その団体のEvidenceRecord DBのID",
//     "fundingAreaTag": "(任意)補助金DBを絞り込む対象自治体タグ(例: 屋久島町)",
//     "publicName": "(任意)分室一覧・分室ページに出す正式名称。設定した団体だけ/branches/[slug]が自動生成される",
//     "publicTagline": "(任意)分室ページの一行紹介",
//     "publicDescription": "(任意)分室ページの説明文",
//     "issueTitle": "(任意)分室ページに出す論点タイトル",
//     "issueSummary": "(任意)分室ページに出す論点の説明文",
//     "issueStatus": "(任意)議論中|合意形成中|合意済み|提起|保留。省略時は議論中"
//   }
// ]
//
// publicName を設定した団体だけ、/branches/[slug] 分室ページが自動生成される
// (コード変更・再デプロイ不要)。省略した場合は、これまで通り試用中の非公開扱いのまま。
//
// passwordHashの作り方(ローカルのNode.jsで実行):
//   node -e "require('bcryptjs').hash(process.argv[1], 10).then(h => console.log(h))" '実際のパスワード'

export type TenantStatus = "active" | "pending" | "disabled";

export type TenantConfig = {
  slug: string;
  label?: string;
  issuePageId: string;
  positionRecordDataSourceId: string;
  passwordHash: string;
  status: TenantStatus;
  /** その団体のEvidenceRecord(根拠データ)DBのID。8DBを持たない試用テナントは省略可 */
  evidenceDataSourceId?: string;
  /** 補助金・交付金マッチングDB(全団体共通)を絞り込むための「対象自治体」タグ名。省略可 */
  fundingAreaTag?: string;
  /** 分室ページ(/branches/[slug])に公開してよい場合のみ設定する正式名称。未設定なら分室ページは自動生成されない */
  publicName?: string;
  /** 分室ページの一行紹介。publicName未設定なら無視される */
  publicTagline?: string;
  /** 分室ページの説明文。publicName未設定なら無視される */
  publicDescription?: string;
  /** 分室ページに出す論点タイトル。省略時はissuePageIdのタイトルの代わりに汎用文言を使う */
  issueTitle?: string;
  /** 分室ページに出す論点の説明文 */
  issueSummary?: string;
  /** 分室ページに出す論点のステータス。省略時は"議論中" */
  issueStatus?: "議論中" | "合意形成中" | "合意済み" | "提起" | "保留";
  /**
   * publicNameで自動生成される分室が、どの意思決定機関(自治体/商工会/観光協会)の
   * トップページ配下に出るか。省略時は"jichitai"(自治体、/branches)扱い。
   * 既存の島に商工会・観光協会をあとから重ねる場合は、branches.ts/shoukoukai.ts/
   * kankoukyoukai.tsの該当する島のissuesに直接追記する方が自然(このフィールドは
   * それらの分室にまだ登場していない「まったく新しい団体」向け)。
   */
  publicKind?: "jichitai" | "shoukoukai" | "kankoukyoukai";
  /**
   * 設定すると、分室ページ自体(/branches/[slug], /shoukoukai/branches/[slug],
   * /kankoukyoukai/branches/[slug] のうち、このslugに一致するもの)がパスワード保護される。
   * ダッシュボードとは別に、公開ページそのものを守りたい試用テナント向け。
   * 同じ島の複数テナントに同じ値を設定すれば、1回の入力で3ページとも入れる。
   */
  gatesBranchSlug?: string;
};

let cachedTenants: TenantConfig[] | null = null;

function parseTenants(): TenantConfig[] {
  const raw = process.env.TENANTS_CONFIG;
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("TENANTS_CONFIG のJSONパースに失敗しました:", err);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("TENANTS_CONFIG は配列である必要があります");
    return [];
  }

  return parsed.filter((t): t is TenantConfig => {
    return (
      typeof t === "object" &&
      t !== null &&
      typeof (t as TenantConfig).slug === "string" &&
      typeof (t as TenantConfig).issuePageId === "string" &&
      typeof (t as TenantConfig).positionRecordDataSourceId === "string" &&
      typeof (t as TenantConfig).passwordHash === "string"
    );
  });
}

function getAllTenants(): TenantConfig[] {
  if (!cachedTenants) {
    cachedTenants = parseTenants();
  }
  return cachedTenants;
}

/** slugに一致する、かつ status が "active" のテナント設定を返す。見つからなければnull */
export function getTenantConfig(slug: string): TenantConfig | null {
  const tenant = getAllTenants().find((t) => t.slug === slug);
  if (!tenant) return null;
  if (tenant.status && tenant.status !== "active") return null;
  return tenant;
}

/** status が "active" のテナント設定を全件返す。分室ページの一覧合成などに使う */
export function getActiveTenants(): TenantConfig[] {
  return getAllTenants().filter((t) => !t.status || t.status === "active");
}

/**
 * 分室ページ(branchSlug)を保護しているテナントのpasswordHashを返す。
 * 保護されていなければnull(=誰でも見られる、これまで通りの公開ページ)。
 */
export function getBranchPasswordHash(branchSlug: string): string | null {
  const tenant = getActiveTenants().find((t) => t.gatesBranchSlug === branchSlug);
  return tenant?.passwordHash ?? null;
}
