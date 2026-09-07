import React from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useInspector} from './inspector-context';
import styles from '../../styles';
import {AppColors} from '../../styles/app-colors';
import TouchableScale from '../touchable-scale';
import {
  SignalIcon,
  TerminalIcon,
  PackageIcon,
  PerformanceIcon,
  CrashIcon,
  SmartphoneIcon,
  DatabaseIcon,
  QrCodeIcon,
  KeyIcon,
  ReactQueryIcon,
} from '../network-icons';

import {triggerNativeHaptic} from '../../native/native-inspector';
import {isLocalDebugEnvironment} from '../../helpers';

const TabBar = React.memo(() => {
  const {
    activeTab,
    switchActiveTab,
    tabVisibility,
    logs,
    consoleLogs,
    crashRecords,
    lastReadApisCount,
    lastReadLogsCount,
    lastReadCrashesCount,
    unreadPulseAnim,
  } = useInspector();

  return (
    <View style={styles.tabBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}>
        {(
          [
            {
              key: 'apis',
              label: 'APIs',
              count: logs.length,
              icon: 'apis',
            },
            {
              key: 'logs',
              label: 'Logs',
              count: consoleLogs.length,
              icon: 'logs',
            },
            {
              key: 'storage',
              label: 'Storage',
              count: 0,
              icon: 'storage',
            },
            {
              key: 'env',
              label: 'ENV Variables',
              count: 0,
              icon: 'env',
            },
            {
              key: 'reactQuery',
              label: 'React Query',
              count: 0,
              icon: 'reactQuery',
            },
            {
              key: 'bundle',
              label: 'Bundle',
              count: 0,
              icon: 'bundle',
            },
            {
              key: 'performance',
              label: 'Performance',
              count: 0,
              icon: 'performance',
            },
            {
              key: 'crash',
              label: 'Crash',
              count: crashRecords?.length || 0,
              icon: 'crash',
            },
            {
              key: 'device',
              label: 'Device',
              count: 0,
              icon: 'device',
            },
            {
              key: 'debugging',
              label: 'Debugging',
              count: 0,
              icon: 'debugging',
            },
          ] as const
        )
          .filter(tab => {
            if (tab.key === 'debugging') {
              return (
                Platform.OS === 'android' &&
                isLocalDebugEnvironment() &&
                Boolean(tabVisibility?.debugging)
              );
            }
            if (!tabVisibility?.[tab.key]) return false;
            return true;
          })
          .map(tab => {
            const isActive = activeTab === tab.key;
            const iconColor = isActive
              ? AppColors.white
              : tab.key === 'crash' && tab.count > 0
              ? AppColors.errorColor
              : AppColors.grayText;
            const countLabel =
              tab.count > 9 ? '9+' : String(tab.count);
            const hasUnreadApis =
              activeTab !== 'apis' &&
              logs.length > lastReadApisCount;
            const hasUnreadLogs =
              activeTab !== 'logs' &&
              consoleLogs.length > lastReadLogsCount;
            const hasUnreadCrashes =
              activeTab !== 'crash' &&
              (crashRecords?.length || 0) > (lastReadCrashesCount || 0);
            return (
              <TouchableScale
                key={tab.key}
                onPress={() => {
                  switchActiveTab(tab.key);
                }}
                style={[
                  styles.contentTabButton,
                  isActive && styles.contentTabButtonActive,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  {tab.icon === 'apis' && (
                    <SignalIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'logs' && (
                    <TerminalIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'bundle' && (
                    <PackageIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'performance' && (
                    <PerformanceIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'crash' && (
                    <CrashIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'device' && (
                    <SmartphoneIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'storage' && (
                    <DatabaseIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'env' && (
                    <KeyIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'reactQuery' && (
                    <ReactQueryIcon color={iconColor} size={14} />
                  )}
                  {tab.icon === 'debugging' && (
                    <QrCodeIcon color={iconColor} size={14} />
                  )}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.contentTabButtonText,
                      isActive &&
                        styles.contentTabButtonTextActive,
                    ]}>
                    {tab.label}{' '}
                    {tab.count > 0 ? `(${countLabel})` : ''}
                  </Text>
                  {((tab.key === 'apis' && hasUnreadApis) ||
                    (tab.key === 'logs' && hasUnreadLogs) ||
                    (tab.key === 'crash' && hasUnreadCrashes)) && (
                    <Animated.View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: AppColors.errorColor,
                        marginLeft: 4,
                        alignSelf: 'center',
                        transform: [{scale: unreadPulseAnim}],
                      }}
                    />
                  )}
                </View>
              </TouchableScale>
            );
          })}
      </ScrollView>
    </View>
  );
});

export default TabBar;
