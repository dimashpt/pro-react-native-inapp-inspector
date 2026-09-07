import React, {useMemo} from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useInspector} from './inspector-context';
import TouchableScale from '../touchable-scale';
import AppHeaderLogo from '../app-header-logo';
import styles from '../../styles';
import {AppColors} from '../../styles/app-colors';
import {AppFonts} from '../../styles/app-fonts';
import {METHOD_COLORS} from '../../constants';
import {Method} from '../../types';
import {
  getStatusColor,
  getAppName,
  formatTime,
  getSize,
  getAppVersionAndBuild,
} from '../../helpers';
import {getNativeDeviceMetrics} from '../../native/native-inspector';
import {
  WhiteBackNavigation,
  TrashIcon,
  SettingsIcon,
  CloseWhite,
  ClockIcon,
  SizeIcon,
  AppleIcon,
  AndroidIcon,
  ResetIcon,
} from '../network-icons';

const InspectorHeader = React.memo(() => {
  const {
    modalHeightPercent,
    appIcon,
    appName,
    selected,
    setSelected,
    selectedLog,
    setSelectedLog,
    showHeaderInfo,
    setShowHeaderInfo,
    clearAnim,
    runClearAllWithAnimation,
    settingsPage,
    setSettingsPage,
    resetToDefaults,
    closeModal,
    detailTitle,
    activeTab,
    environment,
    visible,
    selectedCrash,
    setSelectedCrash,
  } = useInspector();

  const {width: windowWidth} = useWindowDimensions();
  const isNarrow = windowWidth < 360;
  const isCompact = windowWidth < 400;
  const isTablet = windowWidth >= 600;

  const [appVersionString, setAppVersionString] = React.useState<string>(() => {
    return getAppVersionAndBuild().formatted;
  });

  React.useEffect(() => {
    getNativeDeviceMetrics()
      .then(metrics => {
        if (metrics?.appVersion) {
          const v = metrics.appVersion;
          const b = metrics.appBuild || '1';
          setAppVersionString(`${v} (${b})`);
        }
      })
      .catch(() => {});
  }, []);

  const envConfig = useMemo(() => {
    const rawEnv = (environment || (__DEV__ ? 'DEV' : 'PROD')).trim();
    const clean = rawEnv.toUpperCase();

    if (clean === 'DEV' || clean.includes('DEV') || clean === 'LOCAL') {
      return {
        label: rawEnv,
        bg: `${AppColors.emerald500}40`,
        border: `${AppColors.emerald400}8C`,
        text: AppColors.mintGreenBorder,
      };
    }
    if (clean === 'UAT' || clean === 'QA' || clean === 'TEST') {
      return {
        label: rawEnv,
        bg: `${AppColors.amber500}47`,
        border: `${AppColors.amber400}99`,
        text: AppColors.amberWarmBorder,
      };
    }
    if (clean === 'PREPROD' || clean === 'STAGE' || clean === 'STAGING') {
      return {
        label: rawEnv,
        bg: `${AppColors.purple500}47`,
        border: `${AppColors.purple400}99`,
        text: AppColors.violetSoftBorder,
      };
    }
    return {
      label: rawEnv,
      bg: `${AppColors.rose500}40`,
      border: `${AppColors.roseBorder}8C`,
      text: AppColors.errorBorder,
    };
  }, [environment]);

  const isDetailView =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'crash' && selectedCrash != null);

  const isSettingsView = settingsPage !== null;
  const isAnySelected = isDetailView || isSettingsView;

  const settingsModuleTitle = useMemo(() => {
    switch (settingsPage) {
      case 'apis':
        return 'APIs (Network)';
      case 'logs':
        return 'Console Logs';
      case 'performance':
        return 'Performance Tracker';
      case 'bundle':
        return 'Bundle Analyzer';
      case 'crash':
        return 'Crash Protection';
      default:
        return 'Settings & Modules';
    }
  }, [settingsPage]);

  const headerTopPadding =
    Platform.OS === 'ios' && modalHeightPercent >= 95 ? 44 : 0;

  const buttonSize = isNarrow ? 28 : isCompact ? 30 : 32;
  const logoSize = isNarrow ? 36 : isCompact ? 40 : 44;

  return (
    <>
      <View style={styles.headerGradient}>
      <View style={{paddingTop: headerTopPadding, width: '100%'}}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: isNarrow ? 8 : 12,
              paddingVertical: isNarrow ? 6 : 8,
              minHeight: isNarrow ? 48 : 52,
            },
          ]}>
          <View
            style={[
              styles.headerLeft,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: isNarrow ? 6 : 8,
                flex: !isDetailView ? 1 : 0,
                minWidth: 0,
              },
            ]}>
            <TouchableScale
              onPress={() => {
                if (isSettingsView) {
                  if (settingsPage === 'main') {
                    setSettingsPage(null);
                  } else {
                    setSettingsPage('main');
                  }
                  return;
                }
                requestAnimationFrame(() => {
                  setSelected(null);
                  setSelectedLog(null);
                  setSelectedCrash(null);
                });
              }}
              hitSlop={15}
              style={[
                {
                  width: isNarrow ? 32 : 36,
                  height: isNarrow ? 32 : 36,
                  borderRadius: isNarrow ? 16 : 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${AppColors.white}2E`,
                  borderWidth: 1,
                  borderColor: `${AppColors.white}4D`,
                },
                !isAnySelected && {display: 'none'},
              ]}>
              <View
                style={{
                  position: 'absolute',
                  width: isNarrow ? 40 : 44,
                  height: isNarrow ? 40 : 44,
                  borderRadius: 22,
                  backgroundColor: `${AppColors.white}1A`,
                }}
              />
              <WhiteBackNavigation />
            </TouchableScale>

            {isSettingsView ? (
              <View style={{gap: 2, flex: 1, minWidth: 0}}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Text
                    style={{
                      fontFamily: AppFonts.interBold,
                      fontSize: isNarrow ? 14 : 16,
                      color: AppColors.white,
                      letterSpacing: -0.2,
                    }}
                    numberOfLines={1}>
                    {settingsModuleTitle}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: AppFonts.interRegular,
                    fontSize: isNarrow ? 9.5 : 10.5,
                    color: `${AppColors.white}CC`,
                  }}
                  numberOfLines={1}>
                  {settingsPage === 'main'
                    ? 'Manage modules and preferences'
                    : 'Configure module parameters'}
                </Text>
              </View>
            ) : !isAnySelected ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: isNarrow ? 6 : 8,
                  flex: 1,
                  minWidth: 0,
                  marginRight: 4,
                }}>
                <AppHeaderLogo size={logoSize} customIcon={appIcon} />
                <View style={{gap: 2, flex: 1, minWidth: 0}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: isNarrow ? 4 : 6,
                      minWidth: 0,
                    }}>
                    <Text
                      style={[
                        styles.headerTitle,
                        {
                          fontSize: isNarrow ? 13.5 : isCompact ? 14.5 : 15.5,
                          flexShrink: 1,
                          paddingBottom: 0,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {appName || getAppName()}
                    </Text>
                    <View
                      style={[
                        styles.envBadge,
                        {
                          backgroundColor: envConfig.bg,
                          borderColor: envConfig.border,
                          flexShrink: 0,
                          paddingHorizontal: isNarrow ? 4.5 : 6,
                          paddingVertical: 1.5,
                          marginBottom: 0,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.envBadgeText,
                          {
                            color: envConfig.text,
                            fontSize: isNarrow ? 8.5 : 9.5,
                          },
                        ]}>
                        {envConfig.label}
                      </Text>
                    </View>
                    </View>

                  {/* OS & NPM Version Representation */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: isNarrow ? 4 : 5,
                      minWidth: 0,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${AppColors.white}1F`,
                        borderRadius: 5,
                        paddingHorizontal: isNarrow ? 4.5 : 6,
                        paddingVertical: 2,
                        gap: 3.5,
                        borderWidth: 1,
                        borderColor: `${AppColors.white}2E`,
                        flexShrink: 1,
                        minWidth: 0,
                      }}>
                      {Platform.OS === 'ios' ? (
                        <AppleIcon color={`${AppColors.white}E6`} size={isNarrow ? 9 : 10} />
                      ) : (
                        <AndroidIcon color={`${AppColors.white}E6`} size={isNarrow ? 9 : 10} />
                      )}
                      <Text
                        style={{
                          fontFamily: AppFonts.interMedium,
                          fontSize: isNarrow ? 8.5 : 9.5,
                          color: `${AppColors.white}EB`,
                          letterSpacing: 0.1,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {appVersionString}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {isDetailView && (
            <View style={[styles.headerCenter, {paddingHorizontal: isNarrow ? 2 : 6}]}>
              {activeTab === 'apis' && selected != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor:
                            METHOD_COLORS[selected.method as Method] ??
                            AppColors.grayText,
                          paddingHorizontal: isNarrow ? 5 : 6,
                          paddingVertical: isNarrow ? 2 : 3,
                        },
                      ]}>
                      <Text style={[styles.headerMethodText, {fontSize: isNarrow ? 9 : 10}]}>
                        {selected.method}
                      </Text>
                    </View>
                    <Text
                      style={[styles.headerDetailTitle, {fontSize: isNarrow ? 13.5 : 15}]}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {detailTitle}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: isNarrow ? 4 : 6,
                      marginTop: 3,
                      paddingVertical: 1,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: isNarrow ? 6 : 8,
                        paddingVertical: 2.5,
                        borderRadius: 20,
                        backgroundColor: `${getStatusColor(selected.status)}26`,
                        borderWidth: 1,
                        borderColor: `${getStatusColor(selected.status)}55`,
                      }}>
                      <View
                        style={[
                          styles.headerStatusDot,
                          {
                            backgroundColor: getStatusColor(selected.status),
                            width: isNarrow ? 6 : 7,
                            height: isNarrow ? 6 : 7,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.headerSubTitle,
                          {fontFamily: AppFonts.interBold, fontSize: isNarrow ? 10 : 11},
                        ]}>
                        {selected.status === 0
                          ? 'Failed'
                          : selected.status ?? 'Pending'}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: isNarrow ? 6 : 8,
                        paddingVertical: 2.5,
                        borderRadius: 20,
                        backgroundColor: `${AppColors.white}29`,
                      }}>
                      <ClockIcon color={AppColors.white} size={isNarrow ? 10 : 11} />
                      <Text style={[styles.headerSubTitle, {fontSize: isNarrow ? 10 : 11}]}>
                        {selected.duration != null
                          ? `${selected.duration}ms`
                          : '—'}
                      </Text>
                    </View>
                    {selected.response != null && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: isNarrow ? 6 : 8,
                          paddingVertical: 2.5,
                          borderRadius: 20,
                          backgroundColor: `${AppColors.white}29`,
                        }}>
                        <SizeIcon color={AppColors.white} size={isNarrow ? 10 : 11} />
                        <Text style={[styles.headerSubTitle, {fontSize: isNarrow ? 10 : 11}]}>
                          {getSize(selected.response)}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              ) : activeTab === 'logs' && selectedLog != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor:
                            selectedLog.type === 'error'
                              ? `${AppColors.errorColor}4D`
                              : selectedLog.type === 'warn'
                              ? `${AppColors.lightOrange}4D`
                              : `${AppColors.purple}4D`,
                          paddingHorizontal: isNarrow ? 5 : 6,
                          paddingVertical: isNarrow ? 2 : 3,
                        },
                      ]}>
                      <Text style={[styles.headerMethodText, {fontSize: isNarrow ? 9 : 10}]}>
                        {selectedLog.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.headerDetailTitle, {fontSize: isNarrow ? 13.5 : 15}]}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      console.
                      {selectedLog.sourceMethod || selectedLog.type || 'log'}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: isNarrow ? 4 : 6,
                      marginTop: 3,
                      paddingVertical: 1,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: isNarrow ? 6 : 8,
                        paddingVertical: 2.5,
                        borderRadius: 20,
                        backgroundColor: `${AppColors.white}29`,
                      }}>
                      <ClockIcon color={AppColors.white} size={isNarrow ? 10 : 11} />
                      <Text style={[styles.headerSubTitle, {fontSize: isNarrow ? 10 : 11}]}>
                        {formatTime(selectedLog.timestamp)}
                      </Text>
                    </View>
                  </ScrollView>
                </View>
              ) : activeTab === 'crash' && selectedCrash != null ? (
                <View style={styles.headerDetailCenter}>
                  <View style={styles.headerDetailRow}>
                    <View
                      style={[
                        styles.headerMethodBadge,
                        {
                          backgroundColor: selectedCrash.isFatal
                            ? AppColors.red600
                            : AppColors.amber600,
                          paddingHorizontal: isNarrow ? 5 : 6,
                          paddingVertical: isNarrow ? 2 : 3,
                        },
                      ]}>
                      <Text style={[styles.headerMethodText, {fontSize: isNarrow ? 9 : 10}]}>
                        {selectedCrash.isFatal
                          ? 'FATAL'
                          : selectedCrash.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.headerDetailTitle, {fontSize: isNarrow ? 13.5 : 15}]}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {selectedCrash.name || selectedCrash.message}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: isNarrow ? 4 : 6,
                      marginTop: 3,
                      paddingVertical: 1,
                    }}>
                    <View
                      style={[
                        styles.headerStatusDot,
                        {
                          backgroundColor: selectedCrash.isFatal
                            ? AppColors.red600
                            : AppColors.amber500,
                          width: isNarrow ? 6 : 7,
                          height: isNarrow ? 6 : 7,
                        },
                      ]}
                    />
                    <Text style={[styles.headerSubTitle, {fontSize: isNarrow ? 10 : 11}]}>
                      {selectedCrash.timeStr ||
                        new Date(selectedCrash.timestamp).toLocaleTimeString()}
                    </Text>
                    {selectedCrash.deviceInfo?.platform && (
                      <>
                        <Text style={[styles.headerSubTitle, {opacity: 0.6, fontSize: isNarrow ? 10 : 11}]}>
                          •
                        </Text>
                        <Text style={[styles.headerSubTitle, {fontSize: isNarrow ? 10 : 11}]}>
                          {selectedCrash.deviceInfo.platform.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          )}

          <View
            style={[
              styles.headerRight,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
                gap: isNarrow ? 5 : 7,
              },
            ]}>
            {isSettingsView && (
              <TouchableScale
                onPress={() => {
                  Alert.alert(
                    'Reset All Settings',
                    'This restores all module visibility and UI preferences to defaults. Continue?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: resetToDefaults,
                      },
                    ],
                  );
                }}
                hitSlop={15}
                style={[
                  styles.closeButtonSquare,
                  {
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: isNarrow ? 6 : 7,
                  },
                ]}>
                <ResetIcon color={AppColors.white} size={isNarrow ? 12 : 14} />
              </TouchableScale>
            )}

            {!isAnySelected && (
              <TouchableScale
                onPress={() => {
                  Alert.alert(
                    'Clear Everything',
                    'This clears all tabs — APIs, Logs, and Crash history. Continue?',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Clear All',
                        onPress: runClearAllWithAnimation,
                        style: 'destructive',
                      },
                    ],
                  );
                }}
                hitSlop={15}
                style={[
                  styles.closeButtonSquare,
                  {
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: isNarrow ? 6 : 7,
                  },
                ]}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: clearAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-25deg'],
                        }),
                      },
                      {
                        scale: clearAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.25, 1],
                        }),
                      },
                    ],
                  }}>
                  <TrashIcon color={AppColors.white} size={isNarrow ? 12 : 14} />
                </Animated.View>
              </TouchableScale>
            )}

            {!isAnySelected && (
              <TouchableScale
                onPress={() => setSettingsPage('main')}
                hitSlop={15}
                style={[
                  styles.closeButtonSquare,
                  {
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: isNarrow ? 6 : 7,
                  },
                ]}>
                <SettingsIcon color={AppColors.white} size={isNarrow ? 12 : 14} />
              </TouchableScale>
            )}

            <TouchableScale
              onPress={closeModal}
              hitSlop={15}
              style={[
                styles.closeButtonSquare,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: isNarrow ? 6 : 7,
                },
              ]}>
              <CloseWhite size={isNarrow ? 12 : 14} />
            </TouchableScale>
          </View>
        </View>
      </View>
      </View>
    </>
  );
});

export default InspectorHeader;
