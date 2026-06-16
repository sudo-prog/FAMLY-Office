import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const researchReportsTable = pgTable("research_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  query: text("query").notNull(),
  depth: text("depth").notNull().default("standard"),
  report: text("report").notNull(),
  summary: text("summary"),
  sources: text("sources"),
  assetClass: text("asset_class"),
  tags: text("tags"),
  portfolioIncluded: boolean("portfolio_included").notNull().default(false),
  webSearched: boolean("web_searched").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generatedComponentsTable = pgTable("generated_components", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  framework: text("framework").notNull().default("react-shadcn"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
