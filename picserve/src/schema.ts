import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const images = sqliteTable("images", {
	id: text("id").primaryKey().notNull(), 
	url: text("url").notNull(), 
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
