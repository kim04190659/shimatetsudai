import Image from "next/image";
import { getAllBranches } from "@/lib/branches";
import { PARTNER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/partner";
import HomeTabs from "@/components/HomeTabs";

// 2026-09-13 鯨本さん(離島経済新聞社)からの依頼で、ホームページ全体を
// 「意思決定支援」に絞ったシンプルな1画面に作り直した。
// 旧ホームにあった「てつだって」「しまのみんな会議」の紹介、拠点スタッフ募集、
// 私たちの考え方などの節は、/tools・/contact・/about に譲り、ここでは扱わない。
export default function Home() {
  const branches = getAllBranches()
    .slice(0, 4)
    .map((b) => ({ slug: b.slug, name: b.name, tagline: b.tagline }));

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-soft/70 to-background">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <Image
            src="/partners/ritokei-shimbunsha-logo.png"
            alt={PARTNER_NAME}
            width={220}
            height={56}
            className="mx-auto h-10 w-auto"
          />
          <h1 className="mt-6 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            {SITE_NAME}
          </h1>
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-brand-soft/60 px-4 py-1.5 text-sm font-semibold text-brand-dark">
            {SITE_TAGLINE}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/80">
            話し合いの資料を持ち寄れば、AIが論点を整理し、意思決定を後押しします。
            {PARTNER_NAME}が、地域の対話と意思決定を支えます。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-14">
        <HomeTabs branches={branches} />
      </section>
    </div>
  );
}
