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
//     "fundingAreaTag": "(任意)補助金DBを絞り込む対象自治体タグ(例: 屋久島町)"
//   }
// ]
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
