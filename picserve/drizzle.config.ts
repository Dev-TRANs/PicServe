import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",  // スキーマ定義ファイル
  out: "./drizzle/migrations", // マイグレーションファイルの出力ディレクトリ
  dialect: "sqlite",          // SQLiteを使用
} satisfies Config;
