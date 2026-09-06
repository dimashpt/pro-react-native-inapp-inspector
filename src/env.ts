/**
 * Sub-module entry point: react-native-inapp-inspector/env
 * Universal In-App Environment Variables inspector with process.env, native config, and session overrides.
 */
export {
  connectEnvVariables,
  setCustomEnvVariables,
  fetchEnvEntries,
  setEnvOverride,
  removeEnvOverride,
  clearEnvOverrides,
  getEnvOverridesCount,
  subscribeToEnvChanges,
  exportEnvAsDotEnv,
  exportEnvAsJson,
  isSecretKey,
  maskSecretValue,
} from './customHooks/envInspector';
export type {EnvEntry} from './types';

