import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 屋久島「入域料の使途限定問題」ダッシュボードは、荒木会長からの依頼(2026-09-15)で
  // パスワード保護化した。旧URL(.html)の見た目は変えず、内部でRoute Handlerに転送する。
  async rewrites() {
    return [
      {
        source: "/case-studies/yakushima-nyuikiryo-earmarking-dss.html",
        destination: "/case-studies/yakushima-nyuikiryo-earmarking-dss-protected",
      },
    ];
  },
};

export default nextConfig;
