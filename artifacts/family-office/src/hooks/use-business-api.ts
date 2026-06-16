import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}
const get = (path: string) => apiFetch(path);
const post = (path: string, body: unknown) => apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const patch = (path: string, body: unknown) => apiFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const del = (path: string) => apiFetch(path, { method: "DELETE" });

export type BusinessClient = {
  id: number; name: string; email?: string; phone?: string; company?: string;
  abn?: string; address?: string; notes?: string; outstanding: number; totalBilled: number; invoiceCount: number;
};

export type InvoiceItem = { id?: number; description: string; quantity: number; unitPrice: number; amount: number };

export type BusinessInvoice = {
  id: number; invoiceNumber: string; clientId?: number; clientName: string; clientEmail?: string;
  clientAddress?: string; status: string; issueDate: string; dueDate: string; notes?: string;
  businessName?: string; businessAbn?: string;
  subtotal: number; taxRate: number; taxAmount: number; total: number; currency: string;
  paid: boolean; paidDate?: string; items: InvoiceItem[];
};

export type BusinessExpense = {
  id: number; date: string; description: string; category: string; amount: number; currency: string;
  taxDeductible: boolean; gstIncluded: boolean; supplier?: string; notes?: string;
};

export type TimeEntry = {
  id: number; date: string; clientId?: number; clientName?: string; projectName?: string;
  description: string; hours: number; hourlyRate?: number; billable: boolean; invoiced: boolean;
};

export type BusinessSummary = {
  totalRevenue: number; outstanding: number; totalExpenses: number; netProfit: number;
  clientCount: number; invoiceCount: number; totalBillableHours: number;
  invoicesByStatus: Record<string, number>;
  recentInvoices: BusinessInvoice[];
};

const QK = {
  summary: () => ["business", "summary"],
  clients: () => ["business", "clients"],
  invoices: () => ["business", "invoices"],
  expenses: () => ["business", "expenses"],
  time: () => ["business", "time"],
};

export function useBusinessSummary() {
  return useQuery<BusinessSummary>({ queryKey: QK.summary(), queryFn: () => get("/api/business/summary") });
}

export function useBusinessClients() {
  return useQuery<BusinessClient[]>({ queryKey: QK.clients(), queryFn: () => get("/api/business/clients") });
}

export function useBusinessInvoices() {
  return useQuery<BusinessInvoice[]>({ queryKey: QK.invoices(), queryFn: () => get("/api/business/invoices") });
}

export function useBusinessExpenses() {
  return useQuery<BusinessExpense[]>({ queryKey: QK.expenses(), queryFn: () => get("/api/business/expenses") });
}

export function useTimeEntries() {
  return useQuery<TimeEntry[]>({ queryKey: QK.time(), queryFn: () => get("/api/business/time") });
}

function useInvalidate(...keys: (() => unknown[])[]) {
  const qc = useQueryClient();
  return () => Promise.all(keys.map(k => qc.invalidateQueries({ queryKey: k() })));
}

export function useCreateClient() {
  const invalidate = useInvalidate(QK.clients, QK.summary);
  return useMutation({ mutationFn: (data: Partial<BusinessClient>) => post("/api/business/clients", data), onSuccess: invalidate });
}
export function useUpdateClient() {
  const invalidate = useInvalidate(QK.clients, QK.summary);
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<BusinessClient> }) => patch(`/api/business/clients/${id}`, data), onSuccess: invalidate });
}
export function useDeleteClient() {
  const invalidate = useInvalidate(QK.clients, QK.summary);
  return useMutation({ mutationFn: (id: number) => del(`/api/business/clients/${id}`), onSuccess: invalidate });
}

export function useCreateInvoice() {
  const invalidate = useInvalidate(QK.invoices, QK.summary);
  return useMutation({ mutationFn: (data: Partial<BusinessInvoice> & { items: InvoiceItem[] }) => post("/api/business/invoices", data), onSuccess: invalidate });
}
export function useUpdateInvoice() {
  const invalidate = useInvalidate(QK.invoices, QK.summary, QK.clients);
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<BusinessInvoice> & { items?: InvoiceItem[] } }) => patch(`/api/business/invoices/${id}`, data), onSuccess: invalidate });
}
export function useDeleteInvoice() {
  const invalidate = useInvalidate(QK.invoices, QK.summary);
  return useMutation({ mutationFn: (id: number) => del(`/api/business/invoices/${id}`), onSuccess: invalidate });
}

export function useCreateExpense() {
  const invalidate = useInvalidate(QK.expenses, QK.summary);
  return useMutation({ mutationFn: (data: Partial<BusinessExpense>) => post("/api/business/expenses", data), onSuccess: invalidate });
}
export function useUpdateExpense() {
  const invalidate = useInvalidate(QK.expenses, QK.summary);
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<BusinessExpense> }) => patch(`/api/business/expenses/${id}`, data), onSuccess: invalidate });
}
export function useDeleteExpense() {
  const invalidate = useInvalidate(QK.expenses, QK.summary);
  return useMutation({ mutationFn: (id: number) => del(`/api/business/expenses/${id}`), onSuccess: invalidate });
}

export function useCreateTimeEntry() {
  const invalidate = useInvalidate(QK.time, QK.summary);
  return useMutation({ mutationFn: (data: Partial<TimeEntry>) => post("/api/business/time", data), onSuccess: invalidate });
}
export function useUpdateTimeEntry() {
  const invalidate = useInvalidate(QK.time, QK.summary);
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: Partial<TimeEntry> }) => patch(`/api/business/time/${id}`, data), onSuccess: invalidate });
}
export function useDeleteTimeEntry() {
  const invalidate = useInvalidate(QK.time, QK.summary);
  return useMutation({ mutationFn: (id: number) => del(`/api/business/time/${id}`), onSuccess: invalidate });
}
