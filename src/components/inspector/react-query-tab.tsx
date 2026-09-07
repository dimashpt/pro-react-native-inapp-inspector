import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import TouchableScale from '../touchable-scale';
import JsonViewer from '../json-viewer';
import {AppColors} from '../../styles/app-colors';
import {AppFonts} from '../../styles/app-fonts';
import {useInspector} from './inspector-context';
import {
  ReactQueryIcon,
  SearchIcon,
  ClearIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  ResetIcon,
  ChevronIcon,
  WifiIcon,
  CircleAlertIcon,
  CircleXIcon,
  ClockIcon,
  LayersIcon,
  WhiteBackNavigation,
} from '../network-icons';
import {
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
  getOnlineManager,
  QueryStatusType,
} from '../../hooks/react-query-inspector';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';

type MainViewMode = 'queries' | 'mutations';

const getStatusTheme = (status: QueryStatusType) => {
  switch (status) {
    case 'fetching':
      return {label: 'FETCHING', color: AppColors.skyBlue, bg: `${AppColors.skyBlue}16`};
    case 'fresh':
      return {label: 'FRESH', color: AppColors.emerald500, bg: `${AppColors.emerald500}16`};
    case 'stale':
      return {label: 'STALE', color: AppColors.warningIconGold, bg: `${AppColors.warningIconGold}16`};
    case 'paused':
      return {label: 'PAUSED', color: AppColors.purple, bg: `${AppColors.purple}16`};
    case 'error':
      return {label: 'ERROR', color: AppColors.errorColor, bg: `${AppColors.errorColor}16`};
    case 'inactive':
    default:
      return {label: 'INACTIVE', color: AppColors.grayTextWeak, bg: `${AppColors.grayTextWeak}16`};
  }
};

const getMutationStatusTheme = (status: string) => {
  switch (status) {
    case 'pending':
      return {label: 'PENDING', color: AppColors.skyBlue, bg: `${AppColors.skyBlue}16`};
    case 'success':
      return {label: 'SUCCESS', color: AppColors.emerald500, bg: `${AppColors.emerald500}16`};
    case 'error':
      return {label: 'ERROR', color: AppColors.errorColor, bg: `${AppColors.errorColor}16`};
    case 'paused':
      return {label: 'PAUSED', color: AppColors.purple, bg: `${AppColors.purple}16`};
    case 'idle':
    default:
      return {label: 'IDLE', color: AppColors.grayTextWeak, bg: `${AppColors.grayTextWeak}16`};
  }
};

// ── Query Card Component ───────────────────────────────────────────────────────

const QueryCard = React.memo(function QueryCard({
  query,
  onSelect,
}: {
  query: any;
  onSelect: (q: any) => void;
}) {
  const status = getQueryStatus(query);
  const statusTheme = useMemo(() => getStatusTheme(status), [status]);
  const formattedKey = useMemo(() => formatQueryKey(query.queryKey), [query.queryKey]);
  const observersCount = typeof query.getObserversCount === 'function' ? query.getObserversCount() : 0;
  const updatedTime = formatRelativeTime(query.state?.dataUpdatedAt);

  return (
    <TouchableScale
      onPress={() => onSelect(query)}
      style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.statusPill,
              {backgroundColor: statusTheme.bg, borderColor: `${statusTheme.color}33`},
            ]}>
            <View style={[styles.statusDot, {backgroundColor: statusTheme.color}]} />
            <Text style={[styles.statusPillText, {color: statusTheme.color}]}>
              {statusTheme.label}
            </Text>
          </View>

          <View style={styles.obsPill}>
            <Text style={styles.obsPillText}>
              {observersCount} {observersCount === 1 ? 'obs' : 'obs'}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardTimeText}>{updatedTime}</Text>
          <ChevronIcon size={12} color={AppColors.grayTextWeak} />
        </View>
      </View>

      {/* Query Key */}
      <Text style={styles.queryKeyText} numberOfLines={2} selectable>
        {formattedKey}
      </Text>
    </TouchableScale>
  );
});

// ── Mutation Card Component ───────────────────────────────────────────────────

const MutationCard = React.memo(function MutationCard({
  mutation,
  onSelect,
}: {
  mutation: any;
  onSelect: (m: any) => void;
}) {
  const status = mutation.state?.status || 'idle';
  const statusTheme = useMemo(() => getMutationStatusTheme(status), [status]);
  const keyOrId = useMemo(() => {
    if (mutation.options?.mutationKey) {
      return formatQueryKey(mutation.options.mutationKey);
    }
    return `Mutation #${mutation.mutationId ?? ''}`;
  }, [mutation.options?.mutationKey, mutation.mutationId]);

  const submittedTime = formatRelativeTime(mutation.state?.submittedAt);

  return (
    <TouchableScale
      onPress={() => onSelect(mutation)}
      style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.statusPill,
              {backgroundColor: statusTheme.bg, borderColor: `${statusTheme.color}33`},
            ]}>
            <View style={[styles.statusDot, {backgroundColor: statusTheme.color}]} />
            <Text style={[styles.statusPillText, {color: statusTheme.color}]}>
              {statusTheme.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <Text style={styles.cardTimeText}>{submittedTime}</Text>
          <ChevronIcon size={12} color={AppColors.grayTextWeak} />
        </View>
      </View>

      <Text style={styles.queryKeyText} numberOfLines={2} selectable>
        {keyOrId}
      </Text>
    </TouchableScale>
  );
});

// ── Query Detail Screen ───────────────────────────────────────────────────────

const QueryDetailView = ({
  query,
  client,
  onBack,
}: {
  query: any;
  client: any;
  onBack: () => void;
}) => {
  const [detailTab, setDetailTab] = useState<'data' | 'error' | 'meta'>('data');
  const status = getQueryStatus(query);
  const statusTheme = useMemo(() => getStatusTheme(status), [status]);
  const formattedKey = useMemo(() => formatQueryKey(query.queryKey), [query.queryKey]);
  const observersCount = typeof query.getObserversCount === 'function' ? query.getObserversCount() : 0;
  const lastUpdated = query.state?.dataUpdatedAt
    ? new Date(query.state.dataUpdatedAt).toLocaleTimeString()
    : 'never';

  const handleRefetch = async () => {
    showToast('Refetching query...');
    await refetchQuery(query);
    showToast('Refetch complete');
  };

  const handleInvalidate = () => {
    invalidateQuery(client, query);
    showToast('Query invalidated');
  };

  const handleReset = () => {
    resetQuery(client, query);
    showToast('Query reset');
  };

  const handleRemove = () => {
    removeQuery(client, query);
    showToast('Query removed from cache');
    onBack();
  };

  const handleTriggerLoading = () => {
    triggerQueryLoading(query);
    showToast('Toggled loading simulation');
  };

  const handleTriggerError = () => {
    triggerQueryError(client, query);
    showToast('Toggled error simulation');
  };

  const metaData = useMemo(() => {
    return {
      queryHash: query.queryHash,
      fetchStatus: query.state?.fetchStatus,
      status: query.state?.status,
      isInvalidated: query.state?.isInvalidated ?? false,
      dataUpdatedAt: query.state?.dataUpdatedAt
        ? new Date(query.state.dataUpdatedAt).toISOString()
        : null,
      errorUpdatedAt: query.state?.errorUpdatedAt
        ? new Date(query.state.errorUpdatedAt).toISOString()
        : null,
      staleTime: query.options?.staleTime ?? '0',
      gcTime: query.options?.gcTime ?? query.options?.cacheTime ?? '300000',
      retry: query.options?.retry ?? 3,
    };
  }, [query]);

  return (
    <View style={styles.detailContainer}>
      {/* Header with Back button */}
      <View style={styles.detailHeader}>
        <TouchableScale
          onPress={onBack}
          style={styles.backBtn}>
          <WhiteBackNavigation size={18} color={AppColors.purple} />
          <Text style={styles.backBtnText}>Back to Queries</Text>
        </TouchableScale>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        {/* Query Key Card */}
        <View style={styles.detailKeyCard}>
          <View style={styles.detailKeyRow}>
            <Text style={styles.detailKeyLabel}>QUERY KEY</Text>
            <TouchableScale
              onPress={() => {
                copyToClipboard(formattedKey, 'Query Key');
                showToast('Copied Query Key');
              }}
              style={styles.copyKeyBtn}>
              <CopyIcon size={12} color={AppColors.purple} />
              <Text style={styles.copyKeyBtnText}>Copy Key</Text>
            </TouchableScale>
          </View>
          <Text style={styles.detailKeyText} selectable>
            {formattedKey}
          </Text>
        </View>

        {/* Stats strip */}
        <View style={styles.detailStatsStrip}>
          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatLabel}>STATUS</Text>
            <View
              style={[
                styles.statusPill,
                {backgroundColor: statusTheme.bg, borderColor: `${statusTheme.color}33`, marginTop: 4},
              ]}>
              <View style={[styles.statusDot, {backgroundColor: statusTheme.color}]} />
              <Text style={[styles.statusPillText, {color: statusTheme.color}]}>
                {statusTheme.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatLabel}>OBSERVERS</Text>
            <Text style={styles.detailStatValue}>{observersCount}</Text>
          </View>

          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatLabel}>UPDATED</Text>
            <Text style={styles.detailStatValue}>{lastUpdated}</Text>
          </View>
        </View>

        {/* Actions toolbar */}
        <View style={styles.detailActionsCard}>
          <Text style={styles.detailSectionTitle}>ACTIONS</Text>
          <View style={styles.actionButtonsGrid}>
            <TouchableScale
              onPress={handleRefetch}
              style={[styles.actionBtn, {borderColor: `${AppColors.skyBlue}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.skyBlue}]}>Refetch</Text>
            </TouchableScale>

            <TouchableScale
              onPress={handleInvalidate}
              style={[styles.actionBtn, {borderColor: `${AppColors.warningIconGold}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.warningIconGold}]}>Invalidate</Text>
            </TouchableScale>

            <TouchableScale
              onPress={handleReset}
              style={[styles.actionBtn, {borderColor: `${AppColors.purple}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.purple}]}>Reset</Text>
            </TouchableScale>

            <TouchableScale
              onPress={handleRemove}
              style={[styles.actionBtn, {borderColor: `${AppColors.errorColor}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.errorColor}]}>Remove</Text>
            </TouchableScale>

            <TouchableScale
              onPress={handleTriggerLoading}
              style={[styles.actionBtn, {borderColor: `${AppColors.offerPurple}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.offerPurple}]}>
                {query.state?.fetchStatus === 'fetching' ? 'Restore Loading' : 'Trigger Loading'}
              </Text>
            </TouchableScale>

            <TouchableScale
              onPress={handleTriggerError}
              style={[styles.actionBtn, {borderColor: `${AppColors.errorColor}44`}]}>
              <Text style={[styles.actionBtnText, {color: AppColors.errorColor}]}>
                {query.state?.status === 'error' ? 'Restore Error' : 'Trigger Error'}
              </Text>
            </TouchableScale>
          </View>
        </View>

        {/* Sub-view Selector */}
        <View style={styles.detailSubTabs}>
          <TouchableScale
            onPress={() => setDetailTab('data')}
            style={[styles.detailSubTabPill, detailTab === 'data' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'data' && styles.detailSubTabTextActive]}>
              Data Explorer
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => setDetailTab('error')}
            style={[styles.detailSubTabPill, detailTab === 'error' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'error' && styles.detailSubTabTextActive]}>
              Error {query.state?.error ? '(!)' : ''}
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => setDetailTab('meta')}
            style={[styles.detailSubTabPill, detailTab === 'meta' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'meta' && styles.detailSubTabTextActive]}>
              Metadata
            </Text>
          </TouchableScale>
        </View>

        {/* Sub-view Content */}
        <View style={styles.viewerWrapper}>
          {detailTab === 'data' && (
            <View style={{paddingBottom: 40}}>
              {query.state?.data !== undefined ? (
                <JsonViewer data={query.state.data} />
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.emptyDetailText}>No data available for this query.</Text>
                </View>
              )}
            </View>
          )}

          {detailTab === 'error' && (
            <View style={{paddingBottom: 40}}>
              {query.state?.error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>
                    {query.state.error.name || 'Error'}: {query.state.error.message || String(query.state.error)}
                  </Text>
                  <JsonViewer data={query.state.error} />
                </View>
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.emptyDetailText}>No error has occurred for this query.</Text>
                </View>
              )}
            </View>
          )}

          {detailTab === 'meta' && (
            <View style={{paddingBottom: 40}}>
              <JsonViewer data={metaData} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Mutation Detail Screen ────────────────────────────────────────────────────

const MutationDetailView = ({
  mutation,
  onBack,
}: {
  mutation: any;
  onBack: () => void;
}) => {
  const [detailTab, setDetailTab] = useState<'variables' | 'data' | 'error'>('variables');
  const status = mutation.state?.status || 'idle';
  const statusTheme = useMemo(() => getMutationStatusTheme(status), [status]);
  const submittedAt = mutation.state?.submittedAt
    ? new Date(mutation.state.submittedAt).toLocaleTimeString()
    : 'never';

  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableScale
          onPress={onBack}
          style={styles.backBtn}>
          <WhiteBackNavigation size={18} color={AppColors.purple} />
          <Text style={styles.backBtnText}>Back to Mutations</Text>
        </TouchableScale>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailKeyCard}>
          <Text style={styles.detailKeyLabel}>MUTATION</Text>
          <Text style={styles.detailKeyText} selectable>
            {mutation.options?.mutationKey
              ? formatQueryKey(mutation.options.mutationKey)
              : `Mutation #${mutation.mutationId ?? ''}`}
          </Text>
        </View>

        <View style={styles.detailStatsStrip}>
          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatLabel}>STATUS</Text>
            <View
              style={[
                styles.statusPill,
                {backgroundColor: statusTheme.bg, borderColor: `${statusTheme.color}33`, marginTop: 4},
              ]}>
              <View style={[styles.statusDot, {backgroundColor: statusTheme.color}]} />
              <Text style={[styles.statusPillText, {color: statusTheme.color}]}>
                {statusTheme.label}
              </Text>
            </View>
          </View>

          <View style={styles.detailStatBox}>
            <Text style={styles.detailStatLabel}>SUBMITTED</Text>
            <Text style={styles.detailStatValue}>{submittedAt}</Text>
          </View>
        </View>

        <View style={styles.detailSubTabs}>
          <TouchableScale
            onPress={() => setDetailTab('variables')}
            style={[styles.detailSubTabPill, detailTab === 'variables' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'variables' && styles.detailSubTabTextActive]}>
              Variables
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => setDetailTab('data')}
            style={[styles.detailSubTabPill, detailTab === 'data' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'data' && styles.detailSubTabTextActive]}>
              Response Data
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => setDetailTab('error')}
            style={[styles.detailSubTabPill, detailTab === 'error' && styles.detailSubTabPillActive]}>
            <Text style={[styles.detailSubTabText, detailTab === 'error' && styles.detailSubTabTextActive]}>
              Error {mutation.state?.error ? '(!)' : ''}
            </Text>
          </TouchableScale>
        </View>

        <View style={styles.viewerWrapper}>
          {detailTab === 'variables' && (
            <View style={{paddingBottom: 40}}>
              {mutation.state?.variables !== undefined ? (
                <JsonViewer data={mutation.state.variables} />
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.emptyDetailText}>No variables passed to mutation.</Text>
                </View>
              )}
            </View>
          )}

          {detailTab === 'data' && (
            <View style={{paddingBottom: 40}}>
              {mutation.state?.data !== undefined ? (
                <JsonViewer data={mutation.state.data} />
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.emptyDetailText}>No response data for this mutation.</Text>
                </View>
              )}
            </View>
          )}

          {detailTab === 'error' && (
            <View style={{paddingBottom: 40}}>
              {mutation.state?.error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>
                    {mutation.state.error.name || 'Error'}: {mutation.state.error.message || String(mutation.state.error)}
                  </Text>
                  <JsonViewer data={mutation.state.error} />
                </View>
              ) : (
                <View style={styles.emptyDetailBox}>
                  <Text style={styles.emptyDetailText}>No error for this mutation.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Main ReactQueryTab Component ──────────────────────────────────────────────

export default function ReactQueryTab() {
  const {queryClient: contextClient} = useInspector();
  const {client, queries, refresh: refreshQueries} = useAllQueries(contextClient);
  const {mutations, refresh: refreshMutations} = useAllMutations(contextClient);

  const [mode, setMode] = useState<MainViewMode>('queries');
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [selectedMutation, setSelectedMutation] = useState<any | null>(null);
  const [search, setSearch] = useState<string>('');
  const [activeQueryFilter, setActiveQueryFilter] = useState<string | null>(null);
  const [activeMutationFilter, setActiveMutationFilter] = useState<string | null>(null);

  // Online / Offline manager state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const mgr = getOnlineManager();
    return mgr && typeof mgr.isOnline === 'function' ? mgr.isOnline() : true;
  });

  const handleToggleWifi = () => {
    const mgr = getOnlineManager();
    if (!mgr || typeof mgr.setOnline !== 'function') {
      showToast('onlineManager not available');
      return;
    }
    const next = !isOnline;
    mgr.setOnline(next);
    setIsOnline(next);
    showToast(next ? 'React Query set to Online' : 'React Query set to Offline');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Query Cache',
      'Are you sure you want to clear all cached queries in QueryClient? This will wipe cached data.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => {
            clearQueryCache(client);
            refreshQueries();
            showToast('Query cache cleared');
          },
        },
      ],
    );
  };

  const handleInvalidateAll = () => {
    invalidateAllQueries(client);
    refreshQueries();
    showToast('All queries invalidated');
  };

  // Status counts for queries
  const queryCounts = useMemo(() => {
    const counts = {
      all: queries.length,
      fetching: 0,
      fresh: 0,
      stale: 0,
      inactive: 0,
      paused: 0,
      error: 0,
    };
    queries.forEach(q => {
      const s = getQueryStatus(q);
      if (s === 'fetching') counts.fetching++;
      else if (s === 'fresh') counts.fresh++;
      else if (s === 'stale') counts.stale++;
      else if (s === 'inactive') counts.inactive++;
      else if (s === 'paused') counts.paused++;
      else if (s === 'error') counts.error++;
    });
    return counts;
  }, [queries]);

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return queries.filter(q => {
      if (activeQueryFilter) {
        const s = getQueryStatus(q);
        if (s !== activeQueryFilter) return false;
      }
      if (search.trim()) {
        const qStr = search.toLowerCase().trim();
        const keyStr = formatQueryKey(q.queryKey).toLowerCase();
        return keyStr.includes(qStr);
      }
      return true;
    });
  }, [queries, activeQueryFilter, search]);

  // Status counts for mutations
  const mutationCounts = useMemo(() => {
    const counts = {
      all: mutations.length,
      pending: 0,
      success: 0,
      error: 0,
      idle: 0,
    };
    mutations.forEach(m => {
      const s = m.state?.status || 'idle';
      if (s === 'pending') counts.pending++;
      else if (s === 'success') counts.success++;
      else if (s === 'error') counts.error++;
      else counts.idle++;
    });
    return counts;
  }, [mutations]);

  // Filtered mutations
  const filteredMutations = useMemo(() => {
    return mutations.filter(m => {
      if (activeMutationFilter) {
        const s = m.state?.status || 'idle';
        if (s !== activeMutationFilter) return false;
      }
      if (search.trim()) {
        const qStr = search.toLowerCase().trim();
        const keyOrId = m.options?.mutationKey
          ? formatQueryKey(m.options.mutationKey).toLowerCase()
          : `mutation #${m.mutationId ?? ''}`.toLowerCase();
        return keyOrId.includes(qStr);
      }
      return true;
    });
  }, [mutations, activeMutationFilter, search]);

  // Render detail views if selected
  if (selectedQuery) {
    return (
      <QueryDetailView
        query={selectedQuery}
        client={client}
        onBack={() => setSelectedQuery(null)}
      />
    );
  }

  if (selectedMutation) {
    return (
      <MutationDetailView
        mutation={selectedMutation}
        onBack={() => setSelectedMutation(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top Nav Switcher: Queries vs Mutations ── */}
      <View style={styles.topNavStrip}>
        <View style={styles.modeTabsWrap}>
          <TouchableScale
            onPress={() => setMode('queries')}
            style={[styles.modeTab, mode === 'queries' && styles.modeTabActive]}>
            <Text style={[styles.modeTabText, mode === 'queries' && styles.modeTabTextActive]}>
              Queries ({queries.length})
            </Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => setMode('mutations')}
            style={[styles.modeTab, mode === 'mutations' && styles.modeTabActive]}>
            <Text style={[styles.modeTabText, mode === 'mutations' && styles.modeTabTextActive]}>
              Mutations ({mutations.length})
            </Text>
          </TouchableScale>
        </View>

        {/* Global Action Tools */}
        <View style={styles.topToolsWrap}>
          {/* WiFi Toggle */}
          <TouchableScale
            onPress={handleToggleWifi}
            hitSlop={8}
            style={[styles.toolBtn, !isOnline && styles.toolBtnOffline]}>
            <WifiIcon size={14} color={isOnline ? AppColors.emerald500 : AppColors.errorColor} />
          </TouchableScale>

          {/* Invalidate All Queries */}
          <TouchableScale
            onPress={handleInvalidateAll}
            hitSlop={8}
            style={styles.toolBtn}>
            <ResetIcon size={14} color={AppColors.purple} />
          </TouchableScale>

          {/* Clear Cache */}
          <TouchableScale
            onPress={handleClearCache}
            hitSlop={8}
            style={styles.toolBtn}>
            <TrashIcon size={14} color={AppColors.errorColor} />
          </TouchableScale>
        </View>
      </View>

      {/* ── Filter Pills Strip ── */}
      <View style={styles.filterStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStripContainer}>
          {mode === 'queries' ? (
            <>
              <TouchableScale
                onPress={() => setActiveQueryFilter(null)}
                style={[styles.filterPill, activeQueryFilter === null && styles.filterPillActive]}>
                <Text style={[styles.filterPillText, activeQueryFilter === null && styles.filterPillTextActive]}>
                  All ({queryCounts.all})
                </Text>
              </TouchableScale>

              {queryCounts.fetching > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'fetching' ? null : 'fetching')}
                  style={[styles.filterPill, activeQueryFilter === 'fetching' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.skyBlue}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'fetching' && styles.filterPillTextActive]}>
                    fetching ({queryCounts.fetching})
                  </Text>
                </TouchableScale>
              )}

              {queryCounts.fresh > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'fresh' ? null : 'fresh')}
                  style={[styles.filterPill, activeQueryFilter === 'fresh' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.emerald500}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'fresh' && styles.filterPillTextActive]}>
                    fresh ({queryCounts.fresh})
                  </Text>
                </TouchableScale>
              )}

              {queryCounts.stale > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'stale' ? null : 'stale')}
                  style={[styles.filterPill, activeQueryFilter === 'stale' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.warningIconGold}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'stale' && styles.filterPillTextActive]}>
                    stale ({queryCounts.stale})
                  </Text>
                </TouchableScale>
              )}

              {queryCounts.inactive > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'inactive' ? null : 'inactive')}
                  style={[styles.filterPill, activeQueryFilter === 'inactive' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.grayTextWeak}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'inactive' && styles.filterPillTextActive]}>
                    inactive ({queryCounts.inactive})
                  </Text>
                </TouchableScale>
              )}

              {queryCounts.paused > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'paused' ? null : 'paused')}
                  style={[styles.filterPill, activeQueryFilter === 'paused' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.purple}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'paused' && styles.filterPillTextActive]}>
                    paused ({queryCounts.paused})
                  </Text>
                </TouchableScale>
              )}

              {queryCounts.error > 0 && (
                <TouchableScale
                  onPress={() => setActiveQueryFilter(activeQueryFilter === 'error' ? null : 'error')}
                  style={[styles.filterPill, activeQueryFilter === 'error' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.errorColor}]} />
                  <Text style={[styles.filterPillText, activeQueryFilter === 'error' && styles.filterPillTextActive]}>
                    error ({queryCounts.error})
                  </Text>
                </TouchableScale>
              )}
            </>
          ) : (
            <>
              <TouchableScale
                onPress={() => setActiveMutationFilter(null)}
                style={[styles.filterPill, activeMutationFilter === null && styles.filterPillActive]}>
                <Text style={[styles.filterPillText, activeMutationFilter === null && styles.filterPillTextActive]}>
                  All ({mutationCounts.all})
                </Text>
              </TouchableScale>

              {mutationCounts.pending > 0 && (
                <TouchableScale
                  onPress={() => setActiveMutationFilter(activeMutationFilter === 'pending' ? null : 'pending')}
                  style={[styles.filterPill, activeMutationFilter === 'pending' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.skyBlue}]} />
                  <Text style={[styles.filterPillText, activeMutationFilter === 'pending' && styles.filterPillTextActive]}>
                    pending ({mutationCounts.pending})
                  </Text>
                </TouchableScale>
              )}

              {mutationCounts.success > 0 && (
                <TouchableScale
                  onPress={() => setActiveMutationFilter(activeMutationFilter === 'success' ? null : 'success')}
                  style={[styles.filterPill, activeMutationFilter === 'success' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.emerald500}]} />
                  <Text style={[styles.filterPillText, activeMutationFilter === 'success' && styles.filterPillTextActive]}>
                    success ({mutationCounts.success})
                  </Text>
                </TouchableScale>
              )}

              {mutationCounts.error > 0 && (
                <TouchableScale
                  onPress={() => setActiveMutationFilter(activeMutationFilter === 'error' ? null : 'error')}
                  style={[styles.filterPill, activeMutationFilter === 'error' && styles.filterPillActive]}>
                  <View style={[styles.statusDot, {backgroundColor: AppColors.errorColor}]} />
                  <Text style={[styles.filterPillText, activeMutationFilter === 'error' && styles.filterPillTextActive]}>
                    error ({mutationCounts.error})
                  </Text>
                </TouchableScale>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <SearchIcon size={14} color={AppColors.grayTextWeak} />
        <TextInput
          placeholder={mode === 'queries' ? 'Search query key...' : 'Search mutations...'}
          placeholderTextColor={AppColors.grayTextWeak}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableScale
            onPress={() => setSearch('')}
            hitSlop={8}
            style={styles.clearSearchBtn}>
            <ClearIcon size={12} color={AppColors.grayTextWeak} />
          </TouchableScale>
        )}
      </View>

      {/* ── Content List / Empty State ── */}
      {!client ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <ReactQueryIcon size={32} color={AppColors.purple} />
          </View>
          <Text style={styles.emptyTitle}>No QueryClient Connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect your TanStack QueryClient to inspect queries, mutations, cache, and test offline states.
          </Text>

          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>💡 How to connect QueryClient:</Text>
            <Text style={styles.guideCode}>
              {`// Option 1: Pass to <NetworkInspector />\n<NetworkInspector queryClient={queryClient} />\n\n// Option 2: Register globally\nimport { connectQueryClient } from 'react-native-inapp-debugger';\nconnectQueryClient(queryClient);`}
            </Text>
          </View>
        </View>
      ) : mode === 'queries' ? (
        filteredQueries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <ReactQueryIcon size={28} color={AppColors.purple} />
            </View>
            <Text style={styles.emptyTitle}>
              {search.trim() ? 'No Matching Queries' : 'No Queries in Cache'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search.trim()
                ? `No queries matched "${search}".`
                : 'As queries are executed by your app, they will appear here in real-time.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredQueries}
            keyExtractor={item => item.queryHash || String(item.queryKey)}
            renderItem={({item}) => (
              <QueryCard query={item} onSelect={setSelectedQuery} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
          />
        )
      ) : filteredMutations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <ReactQueryIcon size={28} color={AppColors.purple} />
          </View>
          <Text style={styles.emptyTitle}>
            {search.trim() ? 'No Matching Mutations' : 'No Mutations Recorded'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? `No mutations matched "${search}".`
              : 'When your app triggers useMutation calls, they will appear here in real-time.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMutations}
          keyExtractor={(item, index) => item.mutationId ? String(item.mutationId) : String(index)}
          renderItem={({item}) => (
            <MutationCard mutation={item} onSelect={setSelectedMutation} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.contentBg,
  },
  topNavStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  modeTabsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: AppColors.purple,
  },
  modeTabText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
  modeTabTextActive: {
    color: AppColors.white,
  },
  topToolsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnOffline: {
    backgroundColor: `${AppColors.errorColor}14`,
    borderColor: `${AppColors.errorColor}33`,
  },
  filterStripWrapper: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  filterStripContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  filterPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  filterPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
  filterPillTextActive: {
    color: AppColors.white,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    backgroundColor: AppColors.grayBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    padding: 12,
    gap: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  obsPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
  },
  obsPillText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTimeText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 10,
    color: AppColors.grayTextWeak,
  },
  queryKeyText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11.5,
    color: AppColors.primaryBlack,
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
    textAlign: 'center',
    maxWidth: 290,
  },
  guideCard: {
    marginTop: 18,
    width: '100%',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    gap: 6,
  },
  guideTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  guideCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: AppColors.grayText,
    lineHeight: 15,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: AppColors.contentBg,
  },
  detailHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.purple,
  },
  detailScroll: {
    flex: 1,
    padding: 12,
  },
  detailKeyCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  detailKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailKeyLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  copyKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${AppColors.purple}14`,
  },
  copyKeyBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.purple,
  },
  detailKeyText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: AppColors.primaryBlack,
    lineHeight: 17,
  },
  detailStatsStrip: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    marginBottom: 10,
  },
  detailStatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.4,
  },
  detailStatValue: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
    marginTop: 4,
  },
  detailActionsCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  detailSectionTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
  },
  detailSubTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    padding: 3,
    gap: 4,
    marginBottom: 10,
  },
  detailSubTabPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 6,
  },
  detailSubTabPillActive: {
    backgroundColor: AppColors.purple,
  },
  detailSubTabText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
  detailSubTabTextActive: {
    color: AppColors.white,
  },
  viewerWrapper: {
    minHeight: 200,
  },
  emptyDetailBox: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  emptyDetailText: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
  },
  errorBox: {
    backgroundColor: `${AppColors.errorColor}0A`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${AppColors.errorColor}33`,
    padding: 12,
    gap: 8,
  },
  errorTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11.5,
    color: AppColors.errorColor,
  },
});

