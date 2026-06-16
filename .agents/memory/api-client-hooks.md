---
name: API Client Hooks
description: Generated React Query hooks for the Family Office API.
---

# Generated API Client Hooks

Located at: `lib/api-client-react/src/generated/api.ts`
Exported via: `lib/api-client-react/src/index.ts`

## Available hooks (complete list)
- `useListAssets`, `useCreateAsset`, `useUpdateAsset`, `useDeleteAsset`, `useGetAsset`
- `useGetAssetsByCategory`
- `useListTransactions`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`, `useGetRecentTransactions`
- `useListDocuments`, `useCreateDocument`, `useUpdateDocument`, `useDeleteDocument`
- `useListEntities`, `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`
- `useGetDashboardSummary`, `useGetNetWorthHistory`, `useGetCashFlow`

## Query key helpers (for invalidation)
- `getListAssetsQueryKey()`, `getListTransactionsQueryKey()`
- `getListDocumentsQueryKey()`, `getListEntitiesQueryKey()`

## Pattern for mutations with cache invalidation
```tsx
const qc = useQueryClient();
await mutation.mutateAsync(payload);
await qc.invalidateQueries({ queryKey: getList*QueryKey() });
```

**Why:** Code-generated — do NOT edit `generated/api.ts` directly. If API changes, re-run codegen.
