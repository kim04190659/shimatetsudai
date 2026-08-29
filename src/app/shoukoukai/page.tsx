import { redirect } from "next/navigation";

// 商工会支援・観光協会支援は「団体支援(/dantai)」に統合されました。
// 既存URL(/shoukoukai)を直接開いた人も迷わないよう、/dantaiへ転送します。
// 分室一覧(/shoukoukai/branches)・分室個別ページ(/shoukoukai/branches/[slug])は
// このリダイレクトの対象外で、これまで通り動作します。
export default function ShoukoukaiPage() {
  redirect("/dantai");
}
