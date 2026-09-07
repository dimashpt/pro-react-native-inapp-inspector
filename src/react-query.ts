/**
 * Sub-module entry point: react-native-inapp-inspector/react-query
 * Universal In-App React Query (TanStack Query) DevTools adapter and utilities.
 */
export {
  connectQueryClient,
  getResolvedQueryClient,
  getOnlineManager,
  useAllQueries,
  useAllMutations,
  getQueryStatus,
  formatQueryKey,
  formatRelativeTime,
  refetchQuery,
  invalidateQuery,
  resetQuery,
  removeQuery,
  triggerQueryLoading,
  triggerQueryError,
  clearQueryCache,
  invalidateAllQueries,
  refetchAllActiveQueries,
  type QueryStatusType,
} from './hooks/react-query-inspector';
export {default as ReactQueryTab} from './components/inspector/react-query-tab';

