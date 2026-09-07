import React from 'react';
import {ViewStyle} from 'react-native';
import {Animated, PanResponderInstance} from 'react-native';
import type {
  ActiveTab,
  BreadcrumbType,
  CrashType,
  GroupedListItem,
  LocalFilter,
  LogFilter,
  Method,
  SettingsPage,
  SettingsSubTab,
  SortOrder,
  StatusFilter,
} from './index';

export type SearchScope = 'all' | 'url' | 'reqBody' | 'resBody' | 'headers';

export interface ParsedStackFrame {
  method: string;
  file: string;
  lineNumber: number;
  column: number;
  raw?: string;
  isAppCode?: boolean;
}

export interface CrashBreadcrumb {
  type: BreadcrumbType;
  message: string;
  timestamp: number;
  data?: any;
}

export interface CrashRecord {
  id: string;
  error?: Error | any;
  isFatal: boolean;
  type: CrashType;
  message: string;
  name?: string;
  stack?: string;
  parsedStack?: ParsedStackFrame[];
  componentStack?: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  deviceInfo?: {
    platform: string;
    osVersion?: string;
    rnVersion?: string;
    isHermes?: boolean;
    isFabric?: boolean;
    appState?: string;
  };
  memoryInfo?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
  };
  breadcrumbs?: CrashBreadcrumb[];
  logId?: number;
}

export interface ConsoleLog {
  id: number;
  type: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  caller?: string;
  stack?: string;
  errorStack?: string;
  rawArgs?: any[];
  sourceMethod?: 'log' | 'info' | 'warn' | 'error';
  /** #9 — number of consecutive identical logs collapsed into this entry. */
  duplicateCount?: number;
}

// ─── Network ──────────────────────────────────────────────────────────────────

export interface NetworkLog {
  id: number;
  url: string;
  method: string;
  status: number | null;
  duration: number | null;
  startTime: number;
  request?: unknown;
  response?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  /** #9 — number of consecutive identical requests collapsed into this entry. */
  duplicateCount?: number;
  /** Client identifier: axios, fetch, xhr, apollo, etc. */
  client?: 'axios' | 'fetch' | 'xhr' | 'apollo' | 'graphql' | string;
  caller?: string;
  routeInfo?: RouteInfo;
}

export interface RouteInfo {
  path: string;
  params: any;
}

// ─── Settings persistence ─────────────────────────────────────────────────────

export interface InspectorStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem?: (key: string) => void | Promise<void>;
}

export interface PersistedSettings {
  isDark?: boolean;
  modalHeightPercent?: number;
  modalAnimationType?: string;
  tabVisibility?: Record<string, boolean>;
  defaultTab?: string;
  activeTab?: string;
  maxNetworkLogs?: number;
  maxConsoleLogs?: number;
  maxCrashLogs?: number;
  isAutoRamLimitEnabled?: boolean;
  showConsoleLevels?: {info: boolean; warn: boolean; error: boolean};
  showDuplicateLogs?: boolean;
  isApiGroupingEnabled?: boolean;
  telemetryClientId?: string;
  telemetryLastPing?: number;
}

// ─── Inspector component props / context ──────────────────────────────────────

export interface NetworkInspectorProps {
  enabled?: boolean;
  telemetry?: boolean;
  storage?: InspectorStorage;
  envVariables?: Record<string, any>;
  queryClient?: any;
  appIcon?: any;
  appName?: string;
  environment?: 'DEV' | 'UAT' | 'PrePROD' | 'PROD' | 'QA' | 'Staging' | string;
  initialVisible?: boolean;
  visible?: boolean;
}


export interface InspectorContextValue {
  // ─── Modal / launcher ──────────────────────────────────────────────────────
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isReady: boolean;
  enabled: boolean;
  isEnabled: boolean;
  appIcon?: any;
  appName?: string;
  environment?: string;
  envVariables?: Record<string, any>;
  queryClient?: any;
  modalHeightPercent: number;
  setModalHeightPercent: React.Dispatch<React.SetStateAction<number>>;
  modalAnimationType: 'slide' | 'fade' | 'none';
  setModalAnimationType: React.Dispatch<
    React.SetStateAction<'slide' | 'fade' | 'none'>
  >;

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  activeTab: ActiveTab;
  switchActiveTab: (key: ActiveTab) => void;
  tabVisibility: Record<ActiveTab, boolean>;
  toggleTabVisibility: (key: ActiveTab) => void;
  lastReadApisCount: number;
  lastReadLogsCount: number;

  // ─── Selection / header state ──────────────────────────────────────────────
  selected: NetworkLog | null;
  setSelected: React.Dispatch<React.SetStateAction<NetworkLog | null>>;
  selectedLog: ConsoleLog | null;
  setSelectedLog: React.Dispatch<React.SetStateAction<ConsoleLog | null>>;
  showHeaderInfo: boolean;
  setShowHeaderInfo: React.Dispatch<React.SetStateAction<boolean>>;
  settingsPage: SettingsPage;
  setSettingsPage: React.Dispatch<React.SetStateAction<SettingsPage>>;
  clearAnim: Animated.Value;
  unreadPulseAnim: Animated.Value;
  runClearAllWithAnimation: () => void;

  // ─── FAB / launcher ────────────────────────────────────────────────────────
  useNativeFab: boolean;
  fabPan: Animated.ValueXY;
  fabPanResponder: PanResponderInstance;
  fabDraggedRef: React.MutableRefObject<boolean>;
  pulseAnim: Animated.Value;
  fabShineAnim: Animated.Value;

  // ─── Network (APIs) ────────────────────────────────────────────────────────
  logs: NetworkLog[];
  filteredLogs: NetworkLog[];
  groupedData: GroupedListItem[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  searchScope: SearchScope;
  setSearchScope: React.Dispatch<React.SetStateAction<SearchScope>>;
  isRegexSearch: boolean;
  setIsRegexSearch: React.Dispatch<React.SetStateAction<boolean>>;
  isCaseSensitive: boolean;
  setIsCaseSensitive: React.Dispatch<React.SetStateAction<boolean>>;
  quickFilter: string;
  setQuickFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilters: Set<StatusFilter>;
  setStatusFilters: React.Dispatch<React.SetStateAction<Set<StatusFilter>>>;
  methodFilters: Set<Method>;
  setMethodFilters: React.Dispatch<React.SetStateAction<Set<Method>>>;
  availableMethods: Method[];
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  selectedLogs: Set<number>;
  toggleSelect: (id: number) => void;
  minStart: number;
  totalRange: number;
  newLogIds: Set<number>;
  toggleSectionFilter: (pageName: string, filter: LocalFilter) => void;
  toggleSectionCollapse: (pageName: string) => void;
  handleDelete: () => void;
  isNetworkPaused: boolean;
  setIsNetworkPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isApiGroupingEnabled: boolean;
  setIsApiGroupingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleApiGrouping: () => void;

  // ─── Network detail ────────────────────────────────────────────────────────
  detailTitle: string;
  detailDisplayUrl: string;
  apiDetailActiveTab: 'metadata' | 'headers' | 'request' | 'response';
  setApiDetailActiveTab: React.Dispatch<
    React.SetStateAction<'metadata' | 'headers' | 'request' | 'response'>
  >;
  detailSearch: string;
  setDetailSearch: React.Dispatch<React.SetStateAction<string>>;
  reqExpanded: boolean | undefined;
  setReqExpanded: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  resExpanded: boolean | undefined;
  setResExpanded: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  showReqDiff: boolean;
  setShowReqDiff: React.Dispatch<React.SetStateAction<boolean>>;
  showResDiff: boolean;
  setShowResDiff: React.Dispatch<React.SetStateAction<boolean>>;
  prevRequestData: unknown;
  prevResponseData: unknown;
  logRouteMapRef: React.MutableRefObject<Map<number, RouteInfo>>;

  // ─── Console (Logs) ────────────────────────────────────────────────────────
  consoleLogs: ConsoleLog[];
  visibleConsoleLogs: ConsoleLog[];
  filteredConsoleLogs: ConsoleLog[];
  logSearch: string;
  setLogSearch: React.Dispatch<React.SetStateAction<string>>;
  logFilters: Set<LogFilter>;
  setLogFilters: React.Dispatch<React.SetStateAction<Set<LogFilter>>>;
  logCounts: Record<string, string>;
  logSortOrder: SortOrder;
  setLogSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  isConsolePaused: boolean;
  setIsConsolePaused: React.Dispatch<React.SetStateAction<boolean>>;

  // ─── Crash ─────────────────────────────────────────────────────────────────
  crashRecords: CrashRecord[];
  setCrashRecords: React.Dispatch<React.SetStateAction<CrashRecord[]>>;
  selectedCrash: CrashRecord | null;
  setSelectedCrash: React.Dispatch<React.SetStateAction<CrashRecord | null>>;
  lastReadCrashesCount: number;
  maxCrashLogs: number;
  setMaxCrashLogs: React.Dispatch<React.SetStateAction<number>>;
  clearAllCrashes: () => void;

  // ─── Settings ──────────────────────────────────────────────────────────────
  settingsActiveSubTab: SettingsSubTab;
  setSettingsActiveSubTab: React.Dispatch<React.SetStateAction<SettingsSubTab>>;
  defaultTab: ActiveTab;
  setDefaultTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  showDuplicateLogs: boolean;
  setShowDuplicateLogs: React.Dispatch<React.SetStateAction<boolean>>;
  showConsoleLevels: {info: boolean; warn: boolean; error: boolean};
  setShowConsoleLevels: React.Dispatch<
    React.SetStateAction<{info: boolean; warn: boolean; error: boolean}>
  >;
  resetToDefaults: () => Promise<void>;
  storage: InspectorStorage | undefined;
  maxNetworkLogs: number;
  setMaxNetworkLogs: React.Dispatch<React.SetStateAction<number>>;
  maxConsoleLogs: number;
  setMaxConsoleLogs: React.Dispatch<React.SetStateAction<number>>;
  isAutoRamLimitEnabled: boolean;
  setIsAutoRamLimitEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  deviceFreeRamMb: number;
}

// ─── Shared component props ───────────────────────────────────────────────────

export interface CopyButtonProps {
  value: unknown | (() => unknown);
  label: string;
  iconType?: 'copy' | 'terminal' | 'fetch';
}

export interface SectionHeaderProps {
  title: string;
  value: unknown;
  expanded: boolean | undefined;
  onToggleExpand: () => void;
  showDiff?: boolean;
  isDiffing?: boolean;
  onToggleDiff?: () => void;
  showSearch?: boolean;
  isSearching?: boolean;
  onToggleSearch?: () => void;
}

export interface TreeNodeProps {
  data: unknown;
  name?: string | number;
  level?: number;
  search?: string;
  forceOpen?: boolean;
  defaultExpandDepth?: number;
}

export interface LogCardProps {
  item: NetworkLog;
  onPress: () => void;
  timelineMinStart: number;
  timelineTotalRange: number;
  isNew?: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  searchStr?: string;
}

export interface MetaAccordionProps {
  status: number | null | undefined;
  statusColor: string;
  duration: number | null | undefined;
  size: string;
  triggeredAt: string;
  method: string;
  contentType?: string;
  url: string;
}

export interface HeadersSectionProps {
  title: string;
  headers: Record<string, string> | undefined;
  search?: string;
  resetKey?: string | number;
}

export interface SourcePageCardProps {
  routeInfo: RouteInfo;
}

export interface SectionCardProps {
  title?: string;
  count?: number;
  accentColor?: string;
  children?: React.ReactNode;
}


export interface CodeSnippetProps {
  code: string;
  language: 'html' | 'css' | 'javascript';
  search?: string;
}

export interface AnimatedEntranceProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}

export interface ConsoleLogCardProps {
  item: ConsoleLog;
  searchStr?: string;
}

export interface JsonContent {
  header: string;
  data: any;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
  onReset?: () => void;
  fallbackType?: 'modal' | 'inline';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface EnvEntry {
  key: string;
  value: string;
  rawValue: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'null' | 'empty';
  source: 'process.env' | 'react-native-config' | 'custom' | 'override' | 'system';
  isSecret: boolean;
  isOverridden?: boolean;
}
