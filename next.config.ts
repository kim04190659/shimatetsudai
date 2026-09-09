import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // public/kosen, public/partners配下は「index.htmlを置いたディレクトリ」として作られており、
  // 中のページは全てhref="teachers.html"のような相対パスでリンクしている。
  // 末尾スラッシュなしの /kosen だけでアクセスすると、ブラウザは相対リンクをサイトルート基準
  // (例: /teachers.html)で解決してしまい、タブ移動が軒並み404になる(2026-09-09に発覚)。
  // 末尾スラッシュありでアクセスしなおしてもらうことで、相対リンクが正しく
  // /kosen/teachers.html のように解決されるようにする。
  async redirects() {
    return [
      { source: "/kosen", destination: "/kosen/", permanent: true },
      { source: "/partners", destination: "/partners/", permanent: true },
    ];
  },
};

export default nextConfig;
