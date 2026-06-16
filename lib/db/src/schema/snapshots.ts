import { pgTable, serial, numeric, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const snapshotsTable = pgTable("wealth_snapshots", {
  id: serial("id").primaryKey(),
  value: numeric("value", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("AUD"),
  assetCount: integer("asset_count").default(0),
  snapshotDate: text("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSnapshotSchema = createInsertSchema(snapshotsTable).omit({ id: true, createdAt: true });
export const selectSnapshotSchema = createSelectSchema(snapshotsTable);
export type Snapshot = typeof snapshotsTable.$inferSelect;
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
