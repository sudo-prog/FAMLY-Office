import { pgTable, serial, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("equity"), // equity, crypto, etf, fx
  exchange: text("exchange"),
  price: numeric("price", { precision: 18, scale: 4 }),
  change: numeric("change", { precision: 18, scale: 4 }),
  changePercent: numeric("change_percent", { precision: 10, scale: 4 }),
  lastPrice: numeric("last_price", { precision: 18, scale: 4 }),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  aiSummary: text("ai_summary"),
  alertHigh: numeric("alert_high", { precision: 18, scale: 4 }),
  alertLow: numeric("alert_low", { precision: 18, scale: 4 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type WatchlistItem = typeof watchlistTable.$inferSelect;
