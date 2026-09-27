// LLMプロバイダーの共通インターフェース。
// 「意思決定支援」の論点要約(A3シート下書き)を生成する処理を、
// どのLLM(Claude/Tanuki/Sarashina/cotomi等)を使っても同じ形で呼び出せるようにするための型定義。
// これにより、本番で使うモデルを環境変数1つで切り替えられる。

export type SummaryInput = {
  // 論点のタイトル(例: 「空港滑走路延伸」)
  issueTitle: string;
  // ヒアリングメモ・住民の声・公開データなど、要約のもとになるテキスト
  // (mode: "dashboardChat" のときは、質問対象となるダッシュボードの本文として使う)
  sourceNotes: string;
  // 関連する地域指標名(あれば)。例: ["社会増減(転入-転出)", "町内総生産額"]
  relatedIndicators?: string[];
  // 生成する下書きの種類。省略時は"a3"(A3意思決定支援シート下書き)。
  // "letterDraft" は、決定事項からritokei.com「読者だより」向けの一人称の記事下書きを作る(有料オプション②用)。
  // "dashboardChat" は、生成済みダッシュボードの内容について、利用者からの質問にAIが答える(質問チャットエリア用)。
  // "curriculumRevise" は、高専の先生が「ここをこう変更したい」と入力した内容をもとに、
  // カリキュラム案・教育充実度指標の該当セルを構造化JSONで更新する(2026-09-27 角田先生の依頼で追加)。
  mode?: "a3" | "letterDraft" | "dashboardChat" | "curriculumRevise";
  // mode: "dashboardChat" のときの利用者からの質問文。
  // mode: "curriculumRevise" のときは、先生からの変更依頼の原文として使う。
  question?: string;
};

export type SummaryOutput = {
  // A3意思決定支援シートの下書きテキスト(見出し・箇条書きを含むMarkdown想定)
  // (mode: "dashboardChat" のときは、質問に対する回答テキストが入る)
  draft: string;
  // どのプロバイダー・モデルが生成したかを記録しておく(比較・評価用)
  provider: string;
  model: string;
};

export interface LlmProvider {
  // プロバイダー名(ログ・比較表示用)
  readonly name: string;
  // 論点の要約(A3シート下書き)を生成する
  summarizeIssue(input: SummaryInput): Promise<SummaryOutput>;
}

// プロバイダー呼び出しが失敗した場合に投げる、共通の識別可能なエラー。
// 呼び出し側(APIルート)でこれを見て「フォールバックすべきか」を判断する。
export class LlmProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[${provider}] ${message}`);
    this.name = "LlmProviderError";
  }
}
