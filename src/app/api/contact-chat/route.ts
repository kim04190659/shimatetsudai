// お問い合わせチャットAPI
// 生成AIが会社・サービスについての質問にその場で回答する。
// AIが「回答できない」と判断したときだけ、Notionに会話ログを記録して担当者への連絡フローにつなげる。
import { NextRequest, NextResponse } from "next/server";
import { tools } from "@/lib/tools";
import { PARTNER_NAME } from "@/lib/partner";
import { logContactInquiry } from "@/lib/notion";

export const runtime = "nodejs";

// サイトの事業紹介情報を、AIが回答時に参照できる知識としてテキスト化しておく
function buildKnowledgeBase(): string {
  const toolDescriptions = tools
    .map((tool) => {
      return `- ${tool.name}(${tool.target})\n  概要: ${tool.description}\n  特徴: ${tool.points.join(" / ")}`;
    })
    .join("\n");

  return `${PARTNER_NAME} しまてつだい分室は、離島や地方の暮らしと社会に寄り添うツールを開発している会社です。
20〜40代の女性が中心となって活動する分室です。

# 提供している事業
${toolDescriptions}

# その他
- 取材・プレス関連のお問い合わせは、内容を丁寧にヒアリングしたうえで担当者に引き継ぐ
- 拠点スタッフとしての参加に関する問い合わせも、担当者に引き継ぐ想定
- 料金や契約条件など、サイト上に明記されていない詳細は「担当者に確認して折り返す」旨を案内し、回答できない扱いにする`;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

type StructuredReply = {
  reply: string;
  canAnswer: boolean;
  inquiryType: "スタッフについて" | "サービスについて" | "取材・プレス" | "その他";
  escalationReason?: string;
  assigneeHint?: string;
  titleSummary: string;
};

const RESPONSE_TOOL = {
  name: "contact_chat_response",
  description: "お問い合わせチャットへの応答を、構造化した形で返す",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description: "利用者への返答文。丁寧語で、専門用語を避けて書く。",
      },
      canAnswer: {
        type: "boolean",
        description: "サイトの情報だけで自信を持って回答できた場合はtrue。料金・契約・個別事情など不明な点があればfalse。",
      },
      inquiryType: {
        type: "string",
        enum: ["スタッフについて", "サービスについて", "取材・プレス", "その他"],
      },
      escalationReason: {
        type: "string",
        description: "canAnswerがfalseのときのみ。担当者向けに、何が分からず引き継ぐのかを一言で。",
      },
      assigneeHint: {
        type: "string",
        description: "canAnswerがfalseのときのみ。どんな担当者(例: サービス担当/広報担当)につなぐのが適切かの一言メモ。",
      },
      titleSummary: {
        type: "string",
        description: "この会話を一目で分かるようにした10〜20文字程度のタイトル。",
      },
    },
    required: ["reply", "canAnswer", "inquiryType", "titleSummary"],
  },
};

const SYSTEM_PROMPT = `あなたは${PARTNER_NAME} しまてつだい分室の公式サイトに設置された、お問い合わせ対応チャットです。
以下の知識をもとに、訪問者からの質問にその場で丁寧に回答してください。

${buildKnowledgeBase()}

# 振る舞いのルール
- 知識に基づいて自信を持って回答できる内容は、その場で分かりやすく回答する(canAnswer: true)
- 料金・契約・個別の自治体案件の進捗など、サイトに明記されていない・担当者の判断が必要な内容は、
  「担当者に確認して折り返します」という趣旨で丁寧に案内し、canAnswer: false とする
- canAnswer: false のときは、返信の中で「担当者からご連絡します」ことを伝え、
  可能であれば返信用の連絡先(メールアドレスなど)を尋ねる
- 常に日本語・敬語で、専門用語を避けて話す
- 必ずcontact_chat_responseツールを使って構造化された形式で応答すること`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: ChatMessage[]; contactEmail?: string };
    const { messages, contactEmail } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages は必須です" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 500 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        tools: [RESPONSE_TOOL],
        tool_choice: { type: "tool", name: "contact_chat_response" },
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json({ error: "AI応答の取得に失敗しました" }, { status: 502 });
    }

    const data = await anthropicRes.json();
    const toolUse = data.content?.find(
      (block: { type: string }) => block.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json({ error: "AI応答の解析に失敗しました" }, { status: 502 });
    }

    const structured = toolUse.input as StructuredReply;

    // 回答できなかった場合のみ、Notionに会話ログを記録する
    if (!structured.canAnswer) {
      const conversationText = [...messages, { role: "assistant" as const, content: structured.reply }]
        .map((m) => `${m.role === "user" ? "訪問者" : "AI"}: ${m.content}`)
        .join("\n");

      await logContactInquiry({
        title: structured.titleSummary,
        inquiryType: structured.inquiryType,
        summary: conversationText,
        canAnswer: false,
        escalationReason: structured.escalationReason,
        assigneeHint: structured.assigneeHint,
        contactEmail,
      }).catch((err) => {
        // Notion保存の失敗はチャット応答自体をブロックしない
        console.error("Notionへの記録に失敗しました:", err);
      });
    }

    return NextResponse.json({
      reply: structured.reply,
      canAnswer: structured.canAnswer,
    });
  } catch (err) {
    console.error("contact-chat error:", err);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }
}
