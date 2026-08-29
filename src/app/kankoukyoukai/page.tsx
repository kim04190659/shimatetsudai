import { redirect } from "next/navigation";

// 商工会支援・観光協会支援は「団体支援(/dantai)」に統合されました。
// 既存URL(/kankoukyoukai)を直接開いた人も迷わないよう、/dantaiへ転送します。
// 分室一覧(/kankoukyoukai/branches)・分室個別ページ(/kankoukyoukai/branches/[slug])は
// このリダイレクトの対象外で、これまで通り動作します。
export default function KankoukyoukaiPage() {
  redirect("/dantai");
}
