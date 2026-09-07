/**
 * Sub-module entry point: react-native-inapp-debugger/crash
 * Clean tree-shaking & isolated global crash handler and reporting.
 */
export {
  setupGlobalCrashHandler,
  subscribeCrashEvents,
  emitCrashEvent,
  getCrashRecords,
  clearCrashRecords,
  simulateTestCrash,
  exportCrashReport,
  parseCrashStackTrace,
  setMaxCrashLogsLimit,
  getMaxCrashLogsLimit,
  pruneCrashRecords,
  setCrashModuleEnabled,
  getCrashModuleEnabled,
} from './hooks/crash-handler';

export type {
  CrashRecord,
  CrashBreadcrumb,
} from './types';

export {
  CrashType,
  CrashExportFormat,
  CrashDetailSubTab,
  CrashFilterType,
  BreadcrumbType,
} from './types';
