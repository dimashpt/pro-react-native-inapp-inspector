import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkInspector, {
  ErrorBoundary,
  setupNetworkLogger,
  setupConsoleLogger,
  enableNativeCrashProtection,
  BrandSquareIcon,
} from 'react-native-inapp-inspector';

import { mockStore } from './src/store/mock-store';
import { HomeScreen } from './src/screens/home-screen';
import { DetailsScreen } from './src/screens/details-screen';

// ⚡ Call BEFORE any component renders so axios.create() is already patched
setupNetworkLogger();
setupConsoleLogger();

// ⚡ Enable Native Kotlin (Android) & iOS Signal/Exception Crash Protection
enableNativeCrashProtection();


const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#F8FAFC',
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
      {/* Render inspector globally outside inner component ErrorBoundary */}
      <NetworkInspector
        environment="DEV"
        appIcon={<BrandSquareIcon />}
      />
    </SafeAreaProvider>
  );
}

export default App;
