-- Database Indexes for FAMLY-Office
-- Performance optimization for frequently queried columns
-- Phase 2: Add indexes for common query patterns

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Common query: filter transactions by date (date range queries, sorting)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

-- Common query: filter by asset_id (join/lookup with assets)
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions (asset_id);

-- Common query: filter by entity_id (entity-related transactions)
CREATE INDEX IF NOT EXISTS idx_transactions_entity_id ON transactions (entity_id);

-- Common query: filter by type (income/expense/transfer)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);

-- Composite index: date + type for filtered date-range reports
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions (date, type);

-- Composite index: date + entity_id for entity-specific date range queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_entity ON transactions (date, entity_id);

-- Common query: filter by tax_deductible for tax reports
CREATE INDEX IF NOT EXISTS idx_transactions_tax_deductible ON transactions (tax_deductible) WHERE tax_deductible = true;

-- ============================================================================
-- ASSETS TABLE INDEXES
-- ============================================================================

-- Common query: filter by category (allocation reports)
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets (category);

-- Common query: filter by entity_id (entity's assets)
CREATE INDEX IF NOT EXISTS idx_assets_entity_id ON assets (entity_id);

-- Composite index: category + value for allocation calculations
CREATE INDEX IF NOT EXISTS idx_assets_category_value ON assets (category, value);

-- Common query: filter by currency
CREATE INDEX IF NOT EXISTS idx_assets_currency ON assets (currency);

-- ============================================================================
-- DOCUMENTS TABLE INDEXES
-- ============================================================================

-- Common query: filter by entity_id
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON documents (entity_id);

-- Common query: filter by file_type
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents (file_type);

-- Common query: filter by year (annual document lookups)
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents (year);

-- Composite index: entity + year for annual entity document lookups
CREATE INDEX IF NOT EXISTS idx_documents_entity_year ON documents (entity_id, year);

-- Common query: filter by folder
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents (folder);

-- ============================================================================
-- ENTITIES TABLE INDEXES
-- ============================================================================

-- Common query: filter by type (trust/company/individual lookups)
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities (type);

-- Common query: filter by office_id (multi-office support)
CREATE INDEX IF NOT EXISTS idx_entities_office_id ON entities (office_id);

-- Common query: lookup by ABN/TFN
CREATE INDEX IF NOT EXISTS idx_entities_abn ON entities (abn) WHERE abn IS NOT NULL AND abn != '';
CREATE INDEX IF NOT EXISTS idx_entities_tfn ON entities (tfn) WHERE tfn IS NOT NULL AND tfn != '';

-- ============================================================================
-- WEALTH SNAPSHOTS INDEXES
-- ============================================================================

-- Common query: order by snapshot_date for historical charts
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date ON snapshots (snapshot_date);

-- Common query: filter by currency
CREATE INDEX IF NOT EXISTS idx_snapshots_currency ON snapshots (currency);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Common query: filter by user_id (user's notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

-- Common query: filter by unread status per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read) WHERE read = false;

-- Common query: order by created_at for recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- ============================================================================
-- AUDIT LOGS INDEXES
-- ============================================================================

-- Common query: filter by user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- Common query: filter by entity_type + entity_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- Common query: order by timestamp for recent activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- Composite index: user + timestamp for user-specific recent activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs (user_id, timestamp DESC);

-- ============================================================================
-- WATCHLIST INDEXES
-- ============================================================================

-- Common query: filter by active status
CREATE INDEX IF NOT EXISTS idx_watchlist_is_active ON watchlist (is_active) WHERE is_active = true;

-- Common query: lookup by symbol
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist (symbol);

-- Common query: filter by type (equity/crypto/etf/fx)
CREATE INDEX IF NOT EXISTS idx_watchlist_type ON watchlist (type);

-- ============================================================================
-- BUSINESS TABLES INDEXES
-- ============================================================================

-- Business invoices: filter by client
CREATE INDEX IF NOT EXISTS idx_business_invoices_client_id ON business_invoices (client_id);

-- Business invoices: filter by status
CREATE INDEX IF NOT EXISTS idx_business_invoices_status ON business_invoices (status);

-- Business invoices: filter by issue_date for date range queries
CREATE INDEX IF NOT EXISTS idx_business_invoices_issue_date ON business_invoices (issue_date);

-- Business invoices: composite for unpaid invoices by due date
CREATE INDEX IF NOT EXISTS idx_business_invoices_paid_due ON business_invoices (paid, due_date) WHERE paid = false;

-- Business invoice items: lookup by invoice
CREATE INDEX IF NOT EXISTS idx_business_invoice_items_invoice_id ON business_invoice_items (invoice_id);

-- Business expenses: filter by date
CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON business_expenses (date);

-- Business expenses: filter by tax_deductible
CREATE INDEX IF NOT EXISTS idx_business_expenses_tax_deductible ON business_expenses (tax_deductible) WHERE tax_deductible = true;

-- Time entries: filter by client
CREATE INDEX IF NOT EXISTS idx_time_entries_client_id ON time_entries (client_id);

-- Time entries: filter by date
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries (date);

-- Time entries: filter by invoiced status
CREATE INDEX IF NOT EXISTS idx_time_entries_invoiced ON time_entries (invoiced) WHERE invoiced = false;

-- ============================================================================
-- RESEARCH REPORTS INDEXES
-- ============================================================================

-- Common query: filter by asset_class
CREATE INDEX IF NOT EXISTS idx_research_reports_asset_class ON research_reports (asset_class);

-- Common query: order by created_at for recent reports
CREATE INDEX IF NOT EXISTS idx_research_reports_created_at ON research_reports (created_at DESC);

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Common query: lookup by office_id
CREATE INDEX IF NOT EXISTS idx_users_office_id ON users (office_id);

-- Common query: filter by role
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
