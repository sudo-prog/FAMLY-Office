import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
