// Universal In-App Environment Variables Inspector Adapter
// Supports process.env, react-native-config, Expo Constants, custom registrations, and in-session overrides.

import {NativeModules} from 'react-native';
import {EnvEntry} from '../types';

// In-memory registered custom environment variables
let customEnvVariables: Record<string, any> | null = null;

// In-memory active session overrides (key -> value)
const sessionOverrides = new Map<string, string>();

// Listeners for env mutations
const changeListeners = new Set<() => void>();

const notifyChange = () => {
  changeListeners.forEach(listener => {
    try {
      listener();
    } catch {}
  });
};

/**
 * Register custom environment variables (e.g. from @env, react-native-dotenv, or custom config).
 */
export const connectEnvVariables = (env: Record<string, any> | null) => {
  if (env && typeof env === 'object') {
    customEnvVariables = {...(customEnvVariables || {}), ...env};
    notifyChange();
  }
};

/**
 * Replace custom environment variables.
 */
export const setCustomEnvVariables = (env: Record<string, any> | null) => {
  customEnvVariables = env;
  notifyChange();
};

/**
 * Patterns used to detect sensitive keys that should be masked by default.
 */
const SENSITIVE_KEY_PATTERNS = [
  'KEY',
  'SECRET',
  'TOKEN',
  'PASSWORD',
  'PASSWD',
  'PASS',
  'AUTH',
  'PRIVATE',
  'CREDENTIAL',
  'SIGNING',
  'CERT',
  'APIKEY',
  'API_KEY',
  'ACCESS_KEY',
  'SESSION',
  'PIN',
  'WEBHOOK',
];

export const isSecretKey = (key: string): boolean => {
  const upper = key.toUpperCase();
  return SENSITIVE_KEY_PATTERNS.some(pat => upper.includes(pat));
};

export const maskSecretValue = (val: string): string => {
  if (!val || val.length === 0) return '••••••••';
  if (val.length <= 6) return '••••••••';
  // Keep first 2 and last 2 characters visible for orientation if reasonable
  const prefix = val.slice(0, 2);
  const suffix = val.slice(-2);
  return `${prefix}••••••••${suffix}`;
};

/**
 * Detect value type
 */
const detectType = (
  rawVal: any,
  strVal: string,
): EnvEntry['type'] => {
  if (rawVal === null || rawVal === undefined) return 'null';
  if (typeof rawVal === 'boolean' || strVal === 'true' || strVal === 'false') {
    return 'boolean';
  }
  if (
    typeof rawVal === 'number' ||
    (!isNaN(Number(strVal)) && strVal.trim() !== '' && !strVal.startsWith('0x'))
  ) {
    return 'number';
  }
  if (strVal.trim() === '') return 'empty';

  if (typeof rawVal === 'object') return 'json';
  if (
    (strVal.startsWith('{') && strVal.endsWith('}')) ||
    (strVal.startsWith('[') && strVal.endsWith(']'))
  ) {
    try {
      JSON.parse(strVal);
      return 'json';
    } catch {}
  }

  return 'string';
};

/**
 * Resolve process.env safely without throwing in any engine
 */
const getProcessEnv = (): Record<string, any> => {
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env;
    }
  } catch {}
  return {};
};

/**
 * Resolve react-native-config native module if installed
 */
const getReactNativeConfig = (): Record<string, any> => {
  try {
    const config =
      NativeModules.RNCConfig ||
      NativeModules.Config ||
      NativeModules.RNConfig;
    if (config && typeof config === 'object') {
      return config;
    }
  } catch {}
  return {};
};

/**
 * Resolve Expo Constants if available
 */
const getExpoConstants = (): Record<string, any> => {
  try {
    const expo =
      NativeModules.ExpoConstants ||
      NativeModules.ExponentConstants;
    const extra =
      expo?.manifest?.extra ||
      expo?.expoConfig?.extra ||
      expo?.manifest2?.extra?.expoClient?.extra;
    if (extra && typeof extra === 'object') {
      return extra;
    }
  } catch {}
  return {};
};

/**
 * Fetch and aggregate all environment variables across all sources.
 */
export const fetchEnvEntries = (): EnvEntry[] => {
  const merged = new Map<string, EnvEntry>();

  // 1. Process.env
  const processEnv = getProcessEnv();
  Object.keys(processEnv).forEach(k => {
    if (k.startsWith('npm_') || k.startsWith('TERM_')) return; // skip noisy terminal envs
    const rawVal = processEnv[k];
    const strVal =
      typeof rawVal === 'object' && rawVal !== null
        ? JSON.stringify(rawVal)
        : String(rawVal ?? '');
    merged.set(k, {
      key: k,
      value: strVal,
      rawValue: rawVal,
      type: detectType(rawVal, strVal),
      source: 'process.env',
      isSecret: isSecretKey(k),
    });
  });

  // 2. React Native Config (NativeModules.RNCConfig)
  const rnc = getReactNativeConfig();
  Object.keys(rnc).forEach(k => {
    const rawVal = rnc[k];
    const strVal =
      typeof rawVal === 'object' && rawVal !== null
        ? JSON.stringify(rawVal)
        : String(rawVal ?? '');
    merged.set(k, {
      key: k,
      value: strVal,
      rawValue: rawVal,
      type: detectType(rawVal, strVal),
      source: 'react-native-config',
      isSecret: isSecretKey(k),
    });
  });

  // 3. Expo Constants Extra
  const expoExtra = getExpoConstants();
  Object.keys(expoExtra).forEach(k => {
    const rawVal = expoExtra[k];
    const strVal =
      typeof rawVal === 'object' && rawVal !== null
        ? JSON.stringify(rawVal)
        : String(rawVal ?? '');
    merged.set(k, {
      key: k,
      value: strVal,
      rawValue: rawVal,
      type: detectType(rawVal, strVal),
      source: 'custom',
      isSecret: isSecretKey(k),
    });
  });

  // 4. Custom Environment Variables (passed via props or connectEnvVariables)
  if (customEnvVariables && typeof customEnvVariables === 'object') {
    Object.keys(customEnvVariables).forEach(k => {
      const rawVal = customEnvVariables![k];
      const strVal =
        typeof rawVal === 'object' && rawVal !== null
          ? JSON.stringify(rawVal)
          : String(rawVal ?? '');
      merged.set(k, {
        key: k,
        value: strVal,
        rawValue: rawVal,
        type: detectType(rawVal, strVal),
        source: 'custom',
        isSecret: isSecretKey(k),
      });
    });
  }

  // 5. In-session overrides (highest priority)
  sessionOverrides.forEach((val, k) => {
    merged.set(k, {
      key: k,
      value: val,
      rawValue: val,
      type: detectType(val, val),
      source: 'override',
      isSecret: isSecretKey(k),
      isOverridden: true,
    });
  });

  return Array.from(merged.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
};

/**
 * Add or modify an in-session override
 */
export const setEnvOverride = (key: string, value: string) => {
  const trimmed = key.trim();
  if (trimmed) {
    sessionOverrides.set(trimmed, value);
    notifyChange();
  }
};

/**
 * Remove an in-session override
 */
export const removeEnvOverride = (key: string) => {
  if (sessionOverrides.has(key)) {
    sessionOverrides.delete(key);
    notifyChange();
  }
};

/**
 * Clear all in-session overrides
 */
export const clearEnvOverrides = () => {
  if (sessionOverrides.size > 0) {
    sessionOverrides.clear();
    notifyChange();
  }
};

export const getEnvOverridesCount = (): number => {
  return sessionOverrides.size;
};

/**
 * Subscribe to environment variable changes
 */
export const subscribeToEnvChanges = (listener: () => void): (() => void) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};

/**
 * Format entries as a .env string
 */
export const exportEnvAsDotEnv = (entries: EnvEntry[]): string => {
  return entries
    .map(e => {
      const val = e.value.includes('\n') || e.value.includes(' ')
        ? `"${e.value.replace(/"/g, '\\"')}"`
        : e.value;
      return `${e.key}=${val}`;
    })
    .join('\n');
};

/**
 * Format entries as JSON string
 */
export const exportEnvAsJson = (entries: EnvEntry[]): string => {
  const obj: Record<string, any> = {};
  entries.forEach(e => {
    obj[e.key] = e.rawValue ?? e.value;
  });
  return JSON.stringify(obj, null, 2);
};

