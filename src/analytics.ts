/**
 * Sub-module entry point: react-native-inapp-inspector/analytics
 * Clean tree-shaking & isolated Firebase/custom Analytics logger.
 */
export {
  setupAnalyticsLogger,
  autoSetupAnalyticsLogger,
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
  clearAnalyticsEvents,
  getAnalyticsEvents,
  isAnalyticsConnected,
  isFirebaseAnalyticsPatched,
  setAnalyticsModuleEnabled,
  getAnalyticsModuleEnabled,
  getCurrentUserProperties,
  getCurrentUserId,
  getDefaultEventParameters,
  getCollectionEnabled,
  setMaxAnalyticsLogsLimit,
  getMaxAnalyticsLogsLimit,
  pruneAnalyticsLogs,
} from './hooks/analytics-logger';

export {
  getEventCategory,
  registerGAPlugin,
  type GAPlugin,
} from './helpers/ga-analytics-registry';

export type {
  AnalyticsEvent,
  AnalyticsEventSource,
  GAEventCategory,
} from './types';
