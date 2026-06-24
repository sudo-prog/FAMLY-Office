import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Asset, AssetCategoryTotal, AssetInput, AssetUpdate, CashFlowPoint, DashboardSummary, Document, DocumentInput, DocumentUpdate, Entity, EntityInput, EntityUpdate, HealthStatus, ListAssetsParams, ListDocumentsParams, ListTransactionsParams, NetWorthPoint, Transaction, TransactionInput, TransactionUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAssetsUrl: (params?: ListAssetsParams) => string;
/**
 * @summary List all assets
 */
export declare const listAssets: (params?: ListAssetsParams, options?: RequestInit) => Promise<Asset[]>;
export declare const getListAssetsQueryKey: (params?: ListAssetsParams) => readonly ["/api/assets", ...ListAssetsParams[]];
export declare const getListAssetsQueryOptions: <TData = Awaited<ReturnType<typeof listAssets>>, TError = ErrorType<unknown>>(params?: ListAssetsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAssetsQueryResult = NonNullable<Awaited<ReturnType<typeof listAssets>>>;
export type ListAssetsQueryError = ErrorType<unknown>;
/**
 * @summary List all assets
 */
export declare function useListAssets<TData = Awaited<ReturnType<typeof listAssets>>, TError = ErrorType<unknown>>(params?: ListAssetsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAssets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAssetUrl: () => string;
/**
 * @summary Create an asset
 */
export declare const createAsset: (assetInput: AssetInput, options?: RequestInit) => Promise<Asset>;
export declare const getCreateAssetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAsset>>, TError, {
        data: BodyType<AssetInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAsset>>, TError, {
    data: BodyType<AssetInput>;
}, TContext>;
export type CreateAssetMutationResult = NonNullable<Awaited<ReturnType<typeof createAsset>>>;
export type CreateAssetMutationBody = BodyType<AssetInput>;
export type CreateAssetMutationError = ErrorType<unknown>;
/**
* @summary Create an asset
*/
export declare const useCreateAsset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAsset>>, TError, {
        data: BodyType<AssetInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAsset>>, TError, {
    data: BodyType<AssetInput>;
}, TContext>;
export declare const getGetAssetUrl: (id: number) => string;
/**
 * @summary Get asset by ID
 */
export declare const getAsset: (id: number, options?: RequestInit) => Promise<Asset>;
export declare const getGetAssetQueryKey: (id: number) => readonly [`/api/assets/${number}`];
export declare const getGetAssetQueryOptions: <TData = Awaited<ReturnType<typeof getAsset>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAssetQueryResult = NonNullable<Awaited<ReturnType<typeof getAsset>>>;
export type GetAssetQueryError = ErrorType<void>;
/**
 * @summary Get asset by ID
 */
export declare function useGetAsset<TData = Awaited<ReturnType<typeof getAsset>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAsset>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAssetUrl: (id: number) => string;
/**
 * @summary Update an asset
 */
export declare const updateAsset: (id: number, assetUpdate: AssetUpdate, options?: RequestInit) => Promise<Asset>;
export declare const getUpdateAssetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAsset>>, TError, {
        id: number;
        data: BodyType<AssetUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAsset>>, TError, {
    id: number;
    data: BodyType<AssetUpdate>;
}, TContext>;
export type UpdateAssetMutationResult = NonNullable<Awaited<ReturnType<typeof updateAsset>>>;
export type UpdateAssetMutationBody = BodyType<AssetUpdate>;
export type UpdateAssetMutationError = ErrorType<unknown>;
/**
* @summary Update an asset
*/
export declare const useUpdateAsset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAsset>>, TError, {
        id: number;
        data: BodyType<AssetUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAsset>>, TError, {
    id: number;
    data: BodyType<AssetUpdate>;
}, TContext>;
export declare const getDeleteAssetUrl: (id: number) => string;
/**
 * @summary Delete an asset
 */
export declare const deleteAsset: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteAssetMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAsset>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAsset>>, TError, {
    id: number;
}, TContext>;
export type DeleteAssetMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAsset>>>;
export type DeleteAssetMutationError = ErrorType<unknown>;
/**
* @summary Delete an asset
*/
export declare const useDeleteAsset: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAsset>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAsset>>, TError, {
    id: number;
}, TContext>;
export declare const getGetAssetsByCategoryUrl: () => string;
/**
 * @summary Get asset totals grouped by category
 */
export declare const getAssetsByCategory: (options?: RequestInit) => Promise<AssetCategoryTotal[]>;
export declare const getGetAssetsByCategoryQueryKey: () => readonly ["/api/assets/by-category"];
export declare const getGetAssetsByCategoryQueryOptions: <TData = Awaited<ReturnType<typeof getAssetsByCategory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssetsByCategory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAssetsByCategory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAssetsByCategoryQueryResult = NonNullable<Awaited<ReturnType<typeof getAssetsByCategory>>>;
export type GetAssetsByCategoryQueryError = ErrorType<unknown>;
/**
 * @summary Get asset totals grouped by category
 */
export declare function useGetAssetsByCategory<TData = Awaited<ReturnType<typeof getAssetsByCategory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssetsByCategory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListTransactionsUrl: (params?: ListTransactionsParams) => string;
/**
 * @summary List transactions
 */
export declare const listTransactions: (params?: ListTransactionsParams, options?: RequestInit) => Promise<Transaction[]>;
export declare const getListTransactionsQueryKey: (params?: ListTransactionsParams) => readonly ["/api/transactions", ...ListTransactionsParams[]];
export declare const getListTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listTransactions>>>;
export type ListTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List transactions
 */
export declare function useListTransactions<TData = Awaited<ReturnType<typeof listTransactions>>, TError = ErrorType<unknown>>(params?: ListTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTransactionUrl: () => string;
/**
 * @summary Create a transaction
 */
export declare const createTransaction: (transactionInput: TransactionInput, options?: RequestInit) => Promise<Transaction>;
export declare const getCreateTransactionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
        data: BodyType<TransactionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
    data: BodyType<TransactionInput>;
}, TContext>;
export type CreateTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof createTransaction>>>;
export type CreateTransactionMutationBody = BodyType<TransactionInput>;
export type CreateTransactionMutationError = ErrorType<unknown>;
/**
* @summary Create a transaction
*/
export declare const useCreateTransaction: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, {
        data: BodyType<TransactionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTransaction>>, TError, {
    data: BodyType<TransactionInput>;
}, TContext>;
export declare const getGetTransactionUrl: (id: number) => string;
/**
 * @summary Get transaction by ID
 */
export declare const getTransaction: (id: number, options?: RequestInit) => Promise<Transaction>;
export declare const getGetTransactionQueryKey: (id: number) => readonly [`/api/transactions/${number}`];
export declare const getGetTransactionQueryOptions: <TData = Awaited<ReturnType<typeof getTransaction>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTransactionQueryResult = NonNullable<Awaited<ReturnType<typeof getTransaction>>>;
export type GetTransactionQueryError = ErrorType<unknown>;
/**
 * @summary Get transaction by ID
 */
export declare function useGetTransaction<TData = Awaited<ReturnType<typeof getTransaction>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTransaction>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTransactionUrl: (id: number) => string;
/**
 * @summary Update a transaction
 */
export declare const updateTransaction: (id: number, transactionUpdate: TransactionUpdate, options?: RequestInit) => Promise<Transaction>;
export declare const getUpdateTransactionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTransaction>>, TError, {
        id: number;
        data: BodyType<TransactionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTransaction>>, TError, {
    id: number;
    data: BodyType<TransactionUpdate>;
}, TContext>;
export type UpdateTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof updateTransaction>>>;
export type UpdateTransactionMutationBody = BodyType<TransactionUpdate>;
export type UpdateTransactionMutationError = ErrorType<unknown>;
/**
* @summary Update a transaction
*/
export declare const useUpdateTransaction: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTransaction>>, TError, {
        id: number;
        data: BodyType<TransactionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTransaction>>, TError, {
    id: number;
    data: BodyType<TransactionUpdate>;
}, TContext>;
export declare const getDeleteTransactionUrl: (id: number) => string;
/**
 * @summary Delete a transaction
 */
export declare const deleteTransaction: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteTransactionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, {
    id: number;
}, TContext>;
export type DeleteTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTransaction>>>;
export type DeleteTransactionMutationError = ErrorType<unknown>;
/**
* @summary Delete a transaction
*/
export declare const useDeleteTransaction: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteTransaction>>, TError, {
    id: number;
}, TContext>;
export declare const getGetRecentTransactionsUrl: () => string;
/**
 * @summary Get recent transactions (last 10)
 */
export declare const getRecentTransactions: (options?: RequestInit) => Promise<Transaction[]>;
export declare const getGetRecentTransactionsQueryKey: () => readonly ["/api/transactions/recent"];
export declare const getGetRecentTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentTransactions>>>;
export type GetRecentTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary Get recent transactions (last 10)
 */
export declare function useGetRecentTransactions<TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListDocumentsUrl: (params?: ListDocumentsParams) => string;
/**
 * @summary List documents in the vault
 */
export declare const listDocuments: (params?: ListDocumentsParams, options?: RequestInit) => Promise<Document[]>;
export declare const getListDocumentsQueryKey: (params?: ListDocumentsParams) => readonly ["/api/documents", ...ListDocumentsParams[]];
export declare const getListDocumentsQueryOptions: <TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDocumentsQueryResult = NonNullable<Awaited<ReturnType<typeof listDocuments>>>;
export type ListDocumentsQueryError = ErrorType<unknown>;
/**
 * @summary List documents in the vault
 */
export declare function useListDocuments<TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDocumentUrl: () => string;
/**
 * @summary Add a document to the vault
 */
export declare const createDocument: (documentInput: DocumentInput, options?: RequestInit) => Promise<Document>;
export declare const getCreateDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
        data: BodyType<DocumentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
    data: BodyType<DocumentInput>;
}, TContext>;
export type CreateDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof createDocument>>>;
export type CreateDocumentMutationBody = BodyType<DocumentInput>;
export type CreateDocumentMutationError = ErrorType<unknown>;
/**
* @summary Add a document to the vault
*/
export declare const useCreateDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
        data: BodyType<DocumentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDocument>>, TError, {
    data: BodyType<DocumentInput>;
}, TContext>;
export declare const getGetDocumentUrl: (id: number) => string;
/**
 * @summary Get document by ID
 */
export declare const getDocument: (id: number, options?: RequestInit) => Promise<Document>;
export declare const getGetDocumentQueryKey: (id: number) => readonly [`/api/documents/${number}`];
export declare const getGetDocumentQueryOptions: <TData = Awaited<ReturnType<typeof getDocument>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDocumentQueryResult = NonNullable<Awaited<ReturnType<typeof getDocument>>>;
export type GetDocumentQueryError = ErrorType<unknown>;
/**
 * @summary Get document by ID
 */
export declare function useGetDocument<TData = Awaited<ReturnType<typeof getDocument>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDocumentUrl: (id: number) => string;
/**
 * @summary Update document metadata
 */
export declare const updateDocument: (id: number, documentUpdate: DocumentUpdate, options?: RequestInit) => Promise<Document>;
export declare const getUpdateDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDocument>>, TError, {
        id: number;
        data: BodyType<DocumentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDocument>>, TError, {
    id: number;
    data: BodyType<DocumentUpdate>;
}, TContext>;
export type UpdateDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof updateDocument>>>;
export type UpdateDocumentMutationBody = BodyType<DocumentUpdate>;
export type UpdateDocumentMutationError = ErrorType<unknown>;
/**
* @summary Update document metadata
*/
export declare const useUpdateDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDocument>>, TError, {
        id: number;
        data: BodyType<DocumentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDocument>>, TError, {
    id: number;
    data: BodyType<DocumentUpdate>;
}, TContext>;
export declare const getDeleteDocumentUrl: (id: number) => string;
/**
 * @summary Delete a document
 */
export declare const deleteDocument: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    id: number;
}, TContext>;
export type DeleteDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDocument>>>;
export type DeleteDocumentMutationError = ErrorType<unknown>;
/**
* @summary Delete a document
*/
export declare const useDeleteDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    id: number;
}, TContext>;
export declare const getGetRecentDocumentsUrl: () => string;
/**
 * @summary Get recently added documents
 */
export declare const getRecentDocuments: (options?: RequestInit) => Promise<Document[]>;
export declare const getGetRecentDocumentsQueryKey: () => readonly ["/api/documents/recent"];
export declare const getGetRecentDocumentsQueryOptions: <TData = Awaited<ReturnType<typeof getRecentDocuments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentDocuments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentDocumentsQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentDocuments>>>;
export type GetRecentDocumentsQueryError = ErrorType<unknown>;
/**
 * @summary Get recently added documents
 */
export declare function useGetRecentDocuments<TData = Awaited<ReturnType<typeof getRecentDocuments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListEntitiesUrl: () => string;
/**
 * @summary List legal entities
 */
export declare const listEntities: (options?: RequestInit) => Promise<Entity[]>;
export declare const getListEntitiesQueryKey: () => readonly ["/api/entities"];
export declare const getListEntitiesQueryOptions: <TData = Awaited<ReturnType<typeof listEntities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEntities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEntitiesQueryResult = NonNullable<Awaited<ReturnType<typeof listEntities>>>;
export type ListEntitiesQueryError = ErrorType<unknown>;
/**
 * @summary List legal entities
 */
export declare function useListEntities<TData = Awaited<ReturnType<typeof listEntities>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateEntityUrl: () => string;
/**
 * @summary Create a legal entity
 */
export declare const createEntity: (entityInput: EntityInput, options?: RequestInit) => Promise<Entity>;
export declare const getCreateEntityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntity>>, TError, {
        data: BodyType<EntityInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEntity>>, TError, {
    data: BodyType<EntityInput>;
}, TContext>;
export type CreateEntityMutationResult = NonNullable<Awaited<ReturnType<typeof createEntity>>>;
export type CreateEntityMutationBody = BodyType<EntityInput>;
export type CreateEntityMutationError = ErrorType<unknown>;
/**
* @summary Create a legal entity
*/
export declare const useCreateEntity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntity>>, TError, {
        data: BodyType<EntityInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEntity>>, TError, {
    data: BodyType<EntityInput>;
}, TContext>;
export declare const getGetEntityUrl: (id: number) => string;
/**
 * @summary Get entity by ID
 */
export declare const getEntity: (id: number, options?: RequestInit) => Promise<Entity>;
export declare const getGetEntityQueryKey: (id: number) => readonly [`/api/entities/${number}`];
export declare const getGetEntityQueryOptions: <TData = Awaited<ReturnType<typeof getEntity>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEntity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEntityQueryResult = NonNullable<Awaited<ReturnType<typeof getEntity>>>;
export type GetEntityQueryError = ErrorType<unknown>;
/**
 * @summary Get entity by ID
 */
export declare function useGetEntity<TData = Awaited<ReturnType<typeof getEntity>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEntity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateEntityUrl: (id: number) => string;
/**
 * @summary Update an entity
 */
export declare const updateEntity: (id: number, entityUpdate: EntityUpdate, options?: RequestInit) => Promise<Entity>;
export declare const getUpdateEntityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntity>>, TError, {
        id: number;
        data: BodyType<EntityUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEntity>>, TError, {
    id: number;
    data: BodyType<EntityUpdate>;
}, TContext>;
export type UpdateEntityMutationResult = NonNullable<Awaited<ReturnType<typeof updateEntity>>>;
export type UpdateEntityMutationBody = BodyType<EntityUpdate>;
export type UpdateEntityMutationError = ErrorType<unknown>;
/**
* @summary Update an entity
*/
export declare const useUpdateEntity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntity>>, TError, {
        id: number;
        data: BodyType<EntityUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEntity>>, TError, {
    id: number;
    data: BodyType<EntityUpdate>;
}, TContext>;
export declare const getDeleteEntityUrl: (id: number) => string;
/**
 * @summary Delete an entity
 */
export declare const deleteEntity: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteEntityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntity>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEntity>>, TError, {
    id: number;
}, TContext>;
export type DeleteEntityMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEntity>>>;
export type DeleteEntityMutationError = ErrorType<unknown>;
/**
* @summary Delete an entity
*/
export declare const useDeleteEntity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntity>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEntity>>, TError, {
    id: number;
}, TContext>;
export declare const getGetDashboardSummaryUrl: () => string;
/**
 * @summary Wealth summary for the dashboard
 */
export declare const getDashboardSummary: (options?: RequestInit) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Wealth summary for the dashboard
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetNetWorthHistoryUrl: () => string;
/**
 * @summary Net worth over time (last 12 months)
 */
export declare const getNetWorthHistory: (options?: RequestInit) => Promise<NetWorthPoint[]>;
export declare const getGetNetWorthHistoryQueryKey: () => readonly ["/api/dashboard/net-worth-history"];
export declare const getGetNetWorthHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getNetWorthHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNetWorthHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNetWorthHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNetWorthHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getNetWorthHistory>>>;
export type GetNetWorthHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Net worth over time (last 12 months)
 */
export declare function useGetNetWorthHistory<TData = Awaited<ReturnType<typeof getNetWorthHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNetWorthHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCashFlowUrl: () => string;
/**
 * @summary Monthly income vs expenses (last 6 months)
 */
export declare const getCashFlow: (options?: RequestInit) => Promise<CashFlowPoint[]>;
export declare const getGetCashFlowQueryKey: () => readonly ["/api/dashboard/cash-flow"];
export declare const getGetCashFlowQueryOptions: <TData = Awaited<ReturnType<typeof getCashFlow>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCashFlow>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCashFlow>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCashFlowQueryResult = NonNullable<Awaited<ReturnType<typeof getCashFlow>>>;
export type GetCashFlowQueryError = ErrorType<unknown>;
/**
 * @summary Monthly income vs expenses (last 6 months)
 */
export declare function useGetCashFlow<TData = Awaited<ReturnType<typeof getCashFlow>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCashFlow>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map