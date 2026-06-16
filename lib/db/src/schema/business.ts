import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const businessClientsTable = pgTable("business_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  abn: text("abn"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessInvoicesTable = pgTable("business_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: integer("client_id"),
  clientName: text("client_name").notNull().default(""),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  status: text("status").notNull().default("draft"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  notes: text("notes"),
  businessName: text("business_name"),
  businessAbn: text("business_abn"),
  subtotal: numeric("subtotal", { precision: 20, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("10"),
  taxAmount: numeric("tax_amount", { precision: 20, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 20, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("AUD"),
  paid: boolean("paid").notNull().default(false),
  paidDate: text("paid_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessInvoiceItemsTable = pgTable("business_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 20, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull().default("0"),
});

export const businessExpensesTable = pgTable("business_expenses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("other"),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("AUD"),
  taxDeductible: boolean("tax_deductible").notNull().default(true),
  gstIncluded: boolean("gst_included").notNull().default(true),
  supplier: text("supplier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeEntriesTable = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  clientId: integer("client_id"),
  clientName: text("client_name"),
  projectName: text("project_name"),
  description: text("description").notNull(),
  hours: numeric("hours", { precision: 10, scale: 2 }).notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  billable: boolean("billable").notNull().default(true),
  invoiced: boolean("invoiced").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
