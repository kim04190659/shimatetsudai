import type { Metadata } from "next";
import Link from "next/link";
import { PARTNER_NAME } from "@/lib/partner";

export const metadata: Metadata = {
  title: `私たちの考え方 | ${PARTNER_NAME} しまてつだい分室`,
  description:
    "自治体・商工会・観光協会など、それぞれの利害で意思決定する複数の機関を、生成AIが横断的に支え、地域全体の最適に近づける仕組みについて。",
};

/**
 * 「疎結合な複数の意思決定機関を、生成AIが横断的に支え、全体最適に近づける」
 * という考え方を1枚で示す図。
 *
 * 上段: 地域全体で共有する北極星指標(屋久島町の公式戦略の数字を実例として使用)
 * 中段: 生成AIが「論点→指標への影響」を横断的に可視化する層
 * 下段: 自治体・商工会・観光協会。それぞれ独立した利害・専門性で意思決定を続ける(ここは変えない)
 */
function ConceptDiagram() {
  return (
    <svg viewBox="0 0 960 660" className="h-auto w-full" role="img" aria-label="生成AIが複数の意思決定機関を横断的に支え、地域全体の指標に近づける仕組みの図">
      <defs>
        <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="1" orient="auto">
          <path d="M0,8 L4,0 L8,8 Z" fill="#7a9a7e" />
        </marker>
      </defs>

      {/* 背景 */}
      <rect x="0" y="0" width="960" height="660" fill="#fdf8f2" />

      {/* 上段: 北極星指標 */}
      <rect x="50" y="24" width="860" height="120" rx="18" fill="#f7e0cf" stroke="#c96f42" strokeWidth="2" />
      <text x="480" y="52" textAnchor="middle" fontSize="17" fontWeight="800" fill="#4a3f35">
        🧭 地域全体で共有する「北極星指標」
      </text>
      <text x="480" y="72" textAnchor="middle" fontSize="12" fill="#7d6a58">
        特定の機関・論点のための数字ではなく、誰もが認める公式データを採用する(実例: 屋久島町 第三期総合戦略)
      </text>
      {[
        { x: 80, label: "社会増減" },
        { x: 285, label: "合計特殊出生率" },
        { x: 500, label: "事業所数" },
        { x: 715, label: "町内総生産額" },
      ].map((chip) => (
        <g key={chip.label}>
          <rect x={chip.x} y="88" width="170" height="42" rx="10" fill="#ffffff" stroke="#c96f42" strokeWidth="1.5" />
          <text x={chip.x + 85} y="114" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#4a3f35">
            {chip.label}
          </text>
        </g>
      ))}

      {/* 中段: 生成AI */}
      <rect x="50" y="188" width="860" height="86" rx="18" fill="#e9f0ea" stroke="#7a9a7e" strokeWidth="2" />
      <text x="480" y="220" textAnchor="middle" fontSize="16" fontWeight="800" fill="#4a3f35">
        🤖 生成AI:「この論点は、北極星指標にどう効くか」を横断的に見える化する
      </text>
      <text x="480" y="242" textAnchor="middle" fontSize="12" fill="#5a6b5c">
        各機関の判断そのものは代行しない。判断材料を、機関の壁を越えてつなぐ
      </text>

      {/* 上下をつなぐ矢印 */}
      <line x1="480" y1="188" x2="480" y2="146" stroke="#7a9a7e" strokeWidth="2.5" markerEnd="url(#arrowUp)" />

      {/* 下段: 3機関 */}
      {[
        {
          x: 50,
          icon: "🏛️",
          name: "自治体",
          issues: ["空港滑走路延伸", "航路の持続可能性"],
        },
        {
          x: 355,
          icon: "🏢",
          name: "商工会",
          issues: ["自然災害へのBCP(事業継続計画)強化"],
        },
        {
          x: 660,
          icon: "🏝️",
          name: "観光協会",
          issues: ["外資・新規事業者の参入への対応力強化"],
        },
      ].map((org) => (
        <g key={org.name}>
          <rect x={org.x} y="330" width="250" height="290" rx="18" fill="#ffffff" stroke="#c9c2b8" strokeWidth="1.5" />
          <text x={org.x + 125} y="368" textAnchor="middle" fontSize="20">
            {org.icon}
          </text>
          <text x={org.x + 125} y="396" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4a3f35">
            {org.name}
          </text>
          <text x={org.x + 125} y="416" textAnchor="middle" fontSize="11" fill="#7d6a58">
            自分たちの利害・専門性で意思決定する
          </text>
          {org.issues.map((issue, i) => (
            <g key={issue}>
              <rect
                x={org.x + 18}
                y={444 + i * 56}
                width="214"
                height="44"
                rx="10"
                fill="#fdf8f2"
                stroke="#e0d6c8"
              />
              <foreignObject x={org.x + 18} y={444 + i * 56} width="214" height="44">
                <div
                  style={{
                    fontSize: "11.5px",
                    lineHeight: 1.35,
                    color: "#4a3f35",
                    padding: "5px 8px",
                    fontWeight: 700,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  {issue}
                </div>
              </foreignObject>
            </g>
          ))}
          <line
            x1={org.x + 125}
            y1="330"
            x2={org.x + 125}
            y2="278"
            stroke="#7a9a7e"
            strokeWidth="2.5"
            markerEnd="url(#arrowUp)"
          />
        </g>
      ))}
    </svg>
  );
}

export default function ApproachPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="text-sm font-semibold text-brand-dark">OUR APPROACH</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">
        それぞれの機関が、それぞれの利害で決める。それでも、地域全体が良くなる。
      </h1>
      <p className="mt-6 leading-relaxed text-foreground/80">
        自治体・商工会・観光協会など、地域には複数の意思決定機関があります。それぞれが独立した目的・利害を持って動くのは、ごく自然なことです。ただ、その「縦割り」のままだと、それぞれの機関にとって最適な判断の積み重ねが、地域全体としての最適にはならないことがあります。私たちは、この課題に生成AIで向き合っています。
      </p>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground">考え方は3つのステップです</h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-brand-soft bg-card p-5">
            <p className="text-sm font-bold text-brand-dark">① 地域全体で目指す姿を、数字で追える「1つの共通目標」にする</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              抽象的なスローガンではなく、誰もが認める公式データ(国勢調査、RESAS、自治体の総合戦略など)から、地域が何十年も追い続けている指標を選びます。特定の機関・論点のために作った数字にはしません。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-5">
            <p className="text-sm font-bold text-brand-dark">② 各機関の意思決定そのものは、これまで通り</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              自治体は自治体の、商工会は商工会の、観光協会は観光協会の専門性と利害で判断を続けます。縦の構造や権限を、生成AIが代わりに決めることはありません。
            </p>
          </div>
          <div className="rounded-2xl border border-brand-soft bg-card p-5">
            <p className="text-sm font-bold text-brand-dark">③ 生成AIが、それぞれの論点が共通目標にどう効くかを横断的に見える化する</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              「この論点は、この指標にとって追い風か、リスクか」を機関の壁を越えて可視化することで、各機関は自分たちの利害だけでなく、地域全体への影響も判断材料に加えられるようになります。
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground">1枚の図にすると、こうなります</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          屋久島町での実例を使って、この構造を示しています。
        </p>
        <div className="mt-5 rounded-2xl border border-brand-soft bg-card p-4 sm:p-6">
          <ConceptDiagram />
        </div>
      </div>

      <div className="mt-12 rounded-2xl border-2 border-accent-green/40 bg-accent-green/5 p-6">
        <h2 className="text-lg font-bold text-foreground">屋久島町分室での実例</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          屋久島町分室では、自治体・商工会・観光協会それぞれが登録した論点(空港滑走路延伸、航路の持続可能性、事業継続力(BCP)強化、外資参入への対応力強化)を、屋久島町「第三期まち・ひと・しごと創生総合戦略」の指標(社会増減・合計特殊出生率・事業所数・町内総生産額)と結びつけて可視化しています。
        </p>
        <Link
          href="/branches/yakushima"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
        >
          屋久島町分室のページで実際の姿を見る →
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground">屋久島に限らない、汎用的な仕組みです</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          複数の意思決定機関が疎結合に存在し、それぞれ縦割りで動いているという状況は、屋久島に限らず、全国どの地域にも、そして地域に限らず企業間の連携にもあります。「論点が増減しても変わらない共通の指標を1つ置き、生成AIが論点と指標の関係を横断的に可視化し続ける」というこの仕組み自体は、対象を入れ替えれば別の地域・別の業界でも同じように機能すると考えています。
        </p>
      </div>

      <div className="mt-12 rounded-2xl border border-accent-green/30 bg-accent-green/5 p-6">
        <p className="text-sm leading-relaxed text-foreground/80">
          この考え方について、詳しくお話ししたい自治体・企業・団体の方は、お気軽にご相談ください。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-green hover:underline"
        >
          相談する →
        </Link>
      </div>
    </div>
  );
}
