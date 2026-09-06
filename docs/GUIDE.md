# React Native In-App Inspector Documentation

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg">
    <img alt="React Native In-App Inspector Banner" src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/v/react-native-inapp-inspector?color=6366f1&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/dm/react-native-inapp-inspector?color=3b82f6&label=downloads" alt="npm downloads" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Expo-blue" alt="platform" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/badge/TypeScript-Ready-3178c6" alt="TypeScript" /></a>
</p>

The **zero-config, all-in-one in-app debugging overlay for React Native & Expo**. Inspect network traffic (fetch/Axios), console logs with Metro symbolicated stack traces, AsyncStorage & MMKV storage, Environment Variables, React Query / TanStack Query cache, Firebase Analytics events, and native device telemetry directly on your device or simulator with zero native setup.

> 🚀 **The modern, lightweight alternative to Flipper and Chucker** — works standalone on device, in test builds, and across standalone APKs/IPAs without desktop companion apps, cables, or open debugger ports.

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
- [Installation](#-installation)
  - [Bare React Native](#bare-react-native)
  - [Expo Projects](#expo-projects)
  - [Peer Dependencies](#peer-dependencies)
- [Quick Start](#-quick-start)
  - [Basic Setup](#basic-setup)
  - [Early Startup Logging](#early-startup-logging)
- [Core Modules & Capabilities](#-core-modules--capabilities)
  - [🌐 Network Logger & Waterfall](#-network-logger--waterfall)
  - [🪵 Console Logger & Stack Traces](#-console-logger--stack-traces)
  - [🗄️ Storage Inspector (AsyncStorage & MMKV)](#️-storage-inspector-asyncstorage--mmkv)
  - [🔐 Environment Variables Inspector](#-environment-variables-inspector)
  - [🔄 React Query Debugger](#-react-query-debugger)
  - [📊 Analytics Event Tracker](#-analytics-event-tracker)
  - [⚡ Native Hardware & Memory Telemetry](#-native-hardware--memory-telemetry)
  - [🕸️ WebView Inspector](#️-webview-inspector)
  - [🛡️ Crash Protection & Error Boundary](#️-crash-protection--error-boundary)
  - [📦 Bundle Visualizer](#-bundle-visualizer)
- [Component Props Reference](#-component-props-reference)
- [Submodule Imports](#-submodule-imports)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Contributing & License](#-contributing--license)

---

## ✨ Features Overview

| Feature | Description |
| :--- | :--- |
| 🌐 **Network Logger** | Intercepts `fetch` and `Axios` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). View status codes, latency, request/response headers, body JSON, query parameters, timing waterfall bars, and copy requests as Axios fetch or cURL snippets. |
| 🪵 **Console Logger** | Captures `console.log`, `info`, `warn`, and `error`. Metro symbolication maps logs back to exact TSX/JSX source files and line numbers. Call stack frame navigation, duplicate collapsing (`×N`), and JSON tree inspect. |
| 🗄️ **Storage Inspector** | Direct inspection and live manipulation of key-value stores (`@react-native-async-storage/async-storage`, `react-native-mmkv`, or custom storage adapters). Edit values, delete keys, search, and refresh in real time. |
| 🔐 **ENV Variables** | Live environment variable viewer. Displays variables from `process.env`, Expo Config, or custom environment maps. Sensitive key masking with reveal toggles, search filtering, and clipboard export. |
| 🔄 **React Query Debugger** | Integrated TanStack Query / React Query inspector. Real-time query cache telemetry (fresh, fetching, stale, inactive, paused), query data preview, query invalidation, refetching, and cache reset controls. |
| 📊 **Analytics Event Tracker** | Live monitoring of application analytics. Auto-patches `@react-native-firebase/analytics` (`logEvent`, `logScreenView`, `setUserProperties`, `setUserId`) and supports manual custom logging. |
| ⚡ **Hardware Telemetry** | Low-level native Kotlin (`Android`) and Objective-C (`iOS`) telemetry: total RAM, available RAM, native heap, storage free space, battery percentage, charging state, and CPU architecture. |
| 🕸️ **WebView Inspector** | Audit scripts, styles, resources, navigation history, and console messages running inside embedded WebViews. |
| 🛡️ **Crash Catcher & ErrorBoundary** | Native exception and signal catcher coupled with a React Error Boundary to capture runtime exceptions with rich device diagnostics. |
| 📦 **Bundle Visualizer** | In-app JavaScript bundle size breakdown, Hermes bytecode metrics, package treemap, and integrated bundle analysis CLI. |

---

## 📦 Installation

### Bare React Native

Install the package and Axios using npm or yarn:

```bash
npm install --save-dev react-native-inapp-inspector axios
# or
yarn add -D react-native-inapp-inspector axios
```

For iOS, install CocoaPods dependencies:

```bash
cd ios && pod install
```

### Expo Projects

Install using Expo CLI:

```bash
npx expo install react-native-inapp-inspector react-native-svg
```

### Peer Dependencies

- React `>=18.0.0`
- React Native `>=0.60.0`
- `react-native-svg` `>=12.0.0`
- *(Optional)* `@react-native-clipboard/clipboard` for emulator-to-host clipboard synchronization.
- *(Optional)* `@react-native-async-storage/async-storage` or `react-native-mmkv` for storage inspection.
- *(Optional)* `@tanstack/react-query` for React Query debugging.

---

## 🚀 Quick Start

### Basic Setup

Mount `<NetworkInspector />` near the root of your application (such as `App.tsx` or `index.js`):

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import NetworkInspector from 'react-native-inapp-inspector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Main Application Components */}

      {/* In-App Inspector Overlay */}
      <NetworkInspector
        storage={AsyncStorage}
        queryClient={queryClient}
        envVariables={process.env}
        environment="development"
      />
    </SafeAreaView>
  );
}
```

A floating bubble will appear over your application. Tap the bubble to open the full-screen inspector modal.

### Early Startup Logging

If your application triggers network requests or console logs before React components finish mounting, initialize logging early in your entry file (`index.js` or `App.tsx`):

```typescript
import {
  setupNetworkLogger,
  setupConsoleLogger,
} from 'react-native-inapp-inspector';

// Initialize before React renders
setupNetworkLogger();
setupConsoleLogger();
```

---

## 🔍 Core Modules & Capabilities

### 🌐 Network Logger & Waterfall

The Network module hooks into the global `fetch` API and intercepts Axios instances automatically:

- **Telemetry Strip**: Displays real-time **Success Rate %**, **Avg Latency (ms)**, and **P95 Latency (ms)**.
- **Latency Waterfall**: Visual latency progress bars with color benchmarks:
  - 🟢 Fast: `< 200ms`
  - 🟡 Moderate: `200ms - 800ms`
  - 🔴 Slow: `> 800ms`
- **Request Details**: Status codes, full URL, request headers, payload JSON, response headers, response body, and error messages.
- **Code Snippet Export**: Copy any request as a `cURL` command or `fetch` code snippet with one tap.
- **Live Stream Controls**: Pause incoming traffic streams to inspect payloads without list jumping, or search by endpoint/query string.

```typescript
import { setupNetworkLogger, addAxiosInterceptors } from 'react-native-inapp-inspector';

setupNetworkLogger();

// Attach to custom Axios instances if needed
const api = axios.create({ baseURL: 'https://api.example.com' });
addAxiosInterceptors(api);
```

---

### 🪵 Console Logger & Stack Traces

Inspect runtime output without needing desktop developer tools:

- **Metro Source Map Symbolication**: Automatically resolves bundle locations to your source code files (`HomeScreen.tsx:42:15`).
- **Log Categorization**: Visual category tags for `[API]`, `[REDUX]`, `[AUTH]`, `[WARN]`, `[ERROR]`, and `[TEST]`.
- **Duplicate Message Collapsing**: Consecutive duplicate logs are grouped into a single entry with an incremental counter pill (`×3`).
- **Interactive Inspector**:
  - **Output**: Formatted log text with JSON viewing modes (Pretty, Raw, Table).
  - **Args**: Inspect multi-argument `console.log(a, b, c)` individually with type identification.
  - **Stack**: Structured frame-by-frame call stack.
  - **Error Stack**: Deep error trace breakdown when Error instances are logged.

---

### 🗄️ Storage Inspector (AsyncStorage & MMKV)

Inspect, search, edit, and delete persisted key-value storage directly from your phone screen:

#### Connecting AsyncStorage

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkInspector from 'react-native-inapp-inspector';

<NetworkInspector storage={AsyncStorage} />
```

Or programmatically via the submodule:

```typescript
import { connectAsyncStorage } from 'react-native-inapp-inspector/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

connectAsyncStorage(AsyncStorage);
```

#### Connecting MMKV

```typescript
import { connectMMKV } from 'react-native-inapp-inspector/storage';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
connectMMKV(storage);
```

**Features**:
- Search keys and values with instant filtering.
- View formatted JSON values.
- In-place key and value editing.
- Single key deletion and complete storage clearing.

---

### 🔐 Environment Variables Inspector

Inspect active runtime configuration and environment flags:

```tsx
import NetworkInspector from 'react-native-inapp-inspector';

// Pass process.env or a custom configuration object
<NetworkInspector
  envVariables={{
    ...process.env,
    API_URL: 'https://api.staging.example.com',
    APP_ENV: 'staging',
    SECRET_KEY: 'sk_test_51Mz...',
  }}
/>
```

Or connect programmatically:

```typescript
import { connectEnvVariables } from 'react-native-inapp-inspector/env';

connectEnvVariables({
  API_URL: 'https://api.example.com',
  BUILD_NUMBER: '42',
  FEATURE_NEW_CHECKOUT: true,
});
```

**Features**:
- **Automatic Sensitive Key Masking**: Automatically masks values for keys containing `KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `AUTH`, `PRIVATE`, `CREDENTIAL`, or `API_KEY` (with a tap-to-reveal toggle).
- **Type Badges**: Visual indicators for `string`, `number`, `boolean`, and `object`.
- **Search & Filter**: Search by variable name or value.
- **Copy**: Quick one-tap copying of environment variable values.

---

### 🔄 React Query Debugger

Ported directly to match this inspector's native theme and UX, giving you on-device TanStack Query insights:

```tsx
import { QueryClient } from '@tanstack/react-query';
import NetworkInspector from 'react-native-inapp-inspector';

const queryClient = new QueryClient();

<NetworkInspector queryClient={queryClient} />
```

Or register globally:

```typescript
import { connectQueryClient } from 'react-native-inapp-inspector/react-query';

connectQueryClient(queryClient);
```

**Features**:
- **Query Cache Telemetry**: Live counter badges for **Total**, **Fresh**, **Fetching**, **Stale**, **Inactive**, and **Paused** queries.
- **Query Detail Inspector**: Inspect query keys, status, fetch status, data update timestamps, error states, and cached data payloads.
- **Query Actions**:
  - 🔄 **Refetch Query**: Force a background network refetch.
  - ⚠️ **Invalidate Query**: Mark query data as stale to trigger subscriber updates.
  - 🗑️ **Reset / Remove Query**: Purge or reset the query cache for specific keys.
  - 🧹 **Clear All**: Reset or clear the entire QueryClient cache.

---

### 📊 Analytics Event Tracker

Monitor user journeys, marketing events, and funnel conversions in real time:

- **Firebase Auto-Patching**: Automatically captures calls to `@react-native-firebase/analytics` (`logEvent`, `logScreenView`, `setUserProperties`, `setUserId`).
- **Custom Event Logging**:

```typescript
import { logAnalyticsEvent } from 'react-native-inapp-inspector';

logAnalyticsEvent('checkout_completed', {
  order_id: 'ord_98765',
  total: 49.99,
  currency: 'USD',
});
```

---

### ⚡ Native Hardware & Memory Telemetry

Access device performance metrics via the native Kotlin / Objective-C bridge:

```typescript
import { getNativeDeviceMetrics } from 'react-native-inapp-inspector';

const metrics = await getNativeDeviceMetrics();

if (metrics) {
  console.log('Device Model:', metrics.deviceModel);
  console.log('OS Version:', metrics.osVersion);
  console.log('Total RAM:', (metrics.totalRAM / (1024 * 1024)).toFixed(0), 'MB');
  console.log('Available RAM:', (metrics.freeRAM / (1024 * 1024)).toFixed(0), 'MB');
  console.log('Native Heap:', (metrics.nativeHeapAllocated / (1024 * 1024)).toFixed(1), 'MB');
  console.log('Free Storage:', (metrics.freeStorage / (1024 * 1024 * 1024)).toFixed(2), 'GB');
  console.log('Battery:', `${metrics.batteryPercent}% (Charging: ${metrics.isCharging})`);
}
```

---

### 🕸️ WebView Inspector

Debug embedded WebViews inside your React Native application:

- Monitor DOM console logs (`console.log`, `warn`, `error`).
- Inspect navigation state changes and URL redirects.
- Track resource load failures and JavaScript evaluation errors.

---

### 🛡️ Crash Protection & Error Boundary

Prevent unexpected JavaScript exceptions and native crashes from killing your development builds:

```tsx
import { ErrorBoundary, enableNativeCrashProtection, subscribeNativeCrashes } from 'react-native-inapp-inspector';

// Enable native crash handler
enableNativeCrashProtection();

// Subscribe to native crash events
subscribeNativeCrashes((crash) => {
  console.warn('Caught Native Crash:', crash.error, crash.stack);
});

// Wrap component hierarchy with ErrorBoundary
function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
```

---

### 📦 Bundle Visualizer

Analyze JavaScript bundle composition to detect accidental bloat:

- Run via CLI:
  ```bash
  npx react-native-inapp-inspector
  # or
  npm run bundle-visualizer
  ```
- Inspect Hermes bytecode metrics and package treemaps on-device.

---

## ⚙️ Component Props Reference

`<NetworkInspector />` accepts the following configuration props:

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `__DEV__` | Enables or disables the inspector overlay entirely. |
| `storage` | `StorageAdapter` | `undefined` | Key-value storage instance (`AsyncStorage`, `MMKV`, or custom adapter). |
| `envVariables` | `Record<string, any> \| (() => Record<string, any>)` | `undefined` | Map or getter function returning environment variables to inspect. |
| `queryClient` | `QueryClient` | `undefined` | TanStack / React Query client instance to inspect and manipulate. |
| `appIcon` | `ImageSourcePropType \| string` | Default icon | Custom icon displayed inside the floating bubble and header. |
| `environment` | `string` | `'development'` | Environment label shown in the inspector header (e.g. `'staging'`, `'production'`). |
| `initialVisible` | `boolean` | `false` | Whether the inspector modal opens automatically upon app launch. |
| `theme` | `'auto' \| 'dark' \| 'light'` | `'auto'` | Theme mode for the inspector interface. |
| `maxNetworkLogs` | `number` | `200` | Maximum number of network requests retained in the ring buffer. |
| `maxConsoleLogs` | `number` | `500` | Maximum number of console logs retained in the ring buffer. |
| `position` | `{ x: number, y: number }` | Bottom-right | Initial screen coordinate for the floating overlay button. |

---

## 📦 Submodule Imports

`react-native-inapp-inspector` provides modular entry points for minimal bundle footprint:

| Import Path | Description |
| :--- | :--- |
| `react-native-inapp-inspector` | Main entry point containing `<NetworkInspector />`, setup hooks, and all utilities. |
| `react-native-inapp-inspector/network` | Network interceptor, `setupNetworkLogger`, `clearNetworkLogs`, `subscribeNetworkLogs`. |
| `react-native-inapp-inspector/console` | Console interceptor, `setupConsoleLogger`, `clearConsoleLogs`, `subscribeConsoleLogs`. |
| `react-native-inapp-inspector/storage` | Storage utilities, `connectAsyncStorage`, `connectMMKV`, `getStorageAdapter`. |
| `react-native-inapp-inspector/env` | Environment variable registry, `connectEnvVariables`, `getEnvVariables`. |
| `react-native-inapp-inspector/react-query` | React Query bridge, `connectQueryClient`, `getQueryClient`. |
| `react-native-inapp-inspector/analytics` | Analytics interceptor, `setupAnalyticsLogger`, `logAnalyticsEvent`. |
| `react-native-inapp-inspector/crash` | Crash catcher, `enableNativeCrashProtection`, `subscribeNativeCrashes`, `ErrorBoundary`. |
| `react-native-inapp-inspector/performance` | Hardware metrics bridge, `getNativeDeviceMetrics`. |
| `react-native-inapp-inspector/bundle` | JS bundle and Hermes analyzer utilities. |

---

## ❓ Troubleshooting & FAQ

### Network requests are not appearing
1. Ensure `setupNetworkLogger()` is called early in your application lifecycle before making requests.
2. If using custom Axios instances, make sure you attach interceptors with `addAxiosInterceptors(instance)`.

### Storage tab says "No Storage Adapter Connected"
Pass your storage instance to `<NetworkInspector storage={AsyncStorage} />` or call `connectAsyncStorage(AsyncStorage)`.

### React Query tab is empty
Pass your QueryClient to `<NetworkInspector queryClient={queryClient} />` or call `connectQueryClient(queryClient)`.

### Can I use this in production?
Yes, but it is typically recommended to enable only for internal or QA builds by configuring the `enabled` prop:
```tsx
<NetworkInspector enabled={__DEV__ || isInternalTesterBuild()} />
```

---

## 🤝 Contributing & License

Contributions, bug reports, and feature requests are welcome! Feel free to open an issue or pull request on [GitHub](https://github.com/vengatmacuser/react-native-inapp-inspector).

Licensed under the [MIT License](https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE).

