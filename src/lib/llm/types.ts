// LLMプロバイダーの共通インターフェース。
// 「意思決定支援」の論点要約(A3シート下書き)を生成する処理を、
// どのLLM(Claude/Tanuki/Sarashina/cotomi等)を使っても同じ形で呼び出せるようにするための型定義。
// これにより、本番で使うモデルを環境変数1つで切り替えられる。

export type SummaryInput = {
  // 論点のタイトル(例: 「空港滑走路延伸」)
  issueTitle: string;
  // ヒアリングメモ・住民の声・公開データなど、要約のもとになるテキスト
  sourceNotes: string;
  // 関連する地域指標名(あれば)。例: ["社会増減(転入-転出)", "町内総生産額"]
  relatedIndicators?: string[];
};

export type SummaryOutput = {
  // A3意思決定支援シートの下書きテキスト(見出し・箇条書きを含むMarkdown想定)
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
