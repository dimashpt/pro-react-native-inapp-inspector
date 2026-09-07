import React, {useState, useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useInspector} from './inspector-context';
import ErrorBoundary from '../error-boundary';
import FabLauncher from './fab-launcher';
import InspectorHeader from './inspector-header';
import TabBar from './tab-bar';
import NetworkTab from './network-tab';
import NetworkDetail from './network-detail';
import LogDetail from './log-detail';
import ConsoleTab from './console-tab';
import BundleTab from './bundle-tab';
import PerformanceTab from './performance-tab';
import CrashTab from './crash-tab';
import CrashDetail from './crash-detail';
import DeviceInfoTab from './device-info-tab';
import StorageTab from './storage-tab';
import EnvVariablesTab from './env-variables-tab';
import ReactQueryTab from './react-query-tab';
import DebuggingTab from './debugging-tab';
import SettingsPanel from './settings-panel';
import NpmUpdateToast from './npm-update-toast';
import Toast from '../toast';
import styles from '../../styles';
import {AppColors} from '../../styles/app-colors';
import {isLocalDebugEnvironment} from '../../helpers';

const MainScreen = () => {
  const {
    visible,
    modalAnimationType,
    closeModal,
    modalHeightPercent,
    selected,
    selectedLog,
    selectedCrash,
    settingsPage,
    activeTab,
    isReady,
    enabled,
    useNativeFab,
  } = useInspector();

  const isDetailActive =
    (activeTab === 'apis' && selected != null) ||
    (activeTab === 'logs' && selectedLog != null) ||
    (activeTab === 'crash' && selectedCrash != null);

  // ─── 60 FPS Transition Animations ──────────────────────────────────────────
  const detailAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isDetailActive) {
      detailAnim.setValue(0);
      Animated.spring(detailAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isDetailActive]);

  const settingsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (settingsPage !== null) {
      settingsAnim.setValue(0);
      Animated.spring(settingsAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [settingsPage !== null]);

  const tabAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <>
      {(Platform.OS === 'ios' || Platform.OS === 'android') &&
        enabled &&
        !visible &&
        !useNativeFab && <FabLauncher />}
      <Modal
        visible={visible}
        animationType={modalAnimationType}
        transparent
        statusBarTranslucent={true}>
      {visible && (
        <ErrorBoundary onClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalBackdropPressable}
              onPress={closeModal}
            />
            <View
              style={[
                styles.modalContentCard,
                {
                  height: `${modalHeightPercent}%`,
                  borderTopLeftRadius: modalHeightPercent >= 100 ? 0 : 20,
                  borderTopRightRadius: modalHeightPercent >= 100 ? 0 : 20,
                },
              ]}>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
              />

              <InspectorHeader />

              <View style={{flex: 1}}>
                {/* ─── Horizontal Scrollable Tab Bar inside Content (Always visible) ─── */}
                {!isDetailActive && <TabBar />}

                {isReady ? (
                  <View style={{flex: 1}}>
                    {/* Persistent List Layer - Never unmounted, preserves 100% native scroll with smooth tab transition */}
                    <Animated.View
                      style={[
                        {
                          flex: 1,
                          opacity: tabAnim,
                          transform: [
                            {
                              translateY: tabAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [6, 0],
                              }),
                            },
                          ],
                        },
                        (isDetailActive || settingsPage !== null) && {
                          pointerEvents: 'none',
                        },
                      ]}>
                      {activeTab === 'apis' && <NetworkTab />}
                      {activeTab === 'logs' && <ConsoleTab />}
                      {activeTab === 'bundle' && <BundleTab />}
                      {activeTab === 'performance' && <PerformanceTab />}
                      {activeTab === 'crash' && <CrashTab />}
                      {activeTab === 'device' && <DeviceInfoTab />}
                      {activeTab === 'storage' && <StorageTab />}
                      {activeTab === 'env' && <EnvVariablesTab />}
                      {activeTab === 'reactQuery' && <ReactQueryTab />}
                      {Platform.OS === 'android' &&
                        isLocalDebugEnvironment() &&
                        activeTab === 'debugging' && <DebuggingTab />}
                    </Animated.View>

                    {/* Detail View Layer - Rendered on top with smooth slide & spring transition */}
                    {isDetailActive && (
                      <Animated.View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: AppColors.contentBg,
                            opacity: detailAnim,
                            transform: [
                              {
                                translateX: detailAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [32, 0],
                                }),
                              },
                            ],
                          },
                        ]}>
                        {activeTab === 'apis' && selected != null && (
                          <NetworkDetail />
                        )}
                        {activeTab === 'logs' && selectedLog != null && (
                          <LogDetail />
                        )}
                        {activeTab === 'crash' && selectedCrash != null && (
                          <CrashDetail />
                        )}
                      </Animated.View>
                    )}
                  </View>
                ) : (
                  <MainScreenSkeleton />
                )}

                {/* Settings Panel Layer - Rendered on top with smooth slide & spring transition */}
                {settingsPage !== null && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: AppColors.grayBackground,
                        opacity: settingsAnim,
                        transform: [
                          {
                            translateY: settingsAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [24, 0],
                            }),
                          },
                        ],
                      },
                    ]}>
                    <SettingsPanel />
                  </Animated.View>
                )}
              </View>

              {/* Bottom floating toast notification */}
              <Toast />

              {/* NPM Version Update Toast with timeout progress bar */}
              <NpmUpdateToast />
            </View>
          </View>
        </ErrorBoundary>
      )}
    </Modal>
    </>
  );
};

const MainScreenSkeleton = React.memo(function MainScreenSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={skeletonStyles.container}>
      {/* ─── Search & Scope Toolbar Skeleton ─── */}
      <View style={skeletonStyles.toolbarSkeleton}>
        <Animated.View
          style={[skeletonStyles.searchBarSkeleton, {opacity: shimmerAnim}]}
        />
        <View style={skeletonStyles.actionButtonsRow}>
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
          <Animated.View
            style={[skeletonStyles.iconButtonSkeleton, {opacity: shimmerAnim}]}
          />
        </View>
      </View>

      {/* ─── Quick Filter Chips Skeleton Strip ─── */}
      <View style={skeletonStyles.chipStripSkeleton}>
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 48, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 68, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 76, opacity: shimmerAnim}]}
        />
        <Animated.View
          style={[skeletonStyles.chipSkeleton, {width: 58, opacity: shimmerAnim}]}
        />
      </View>

      {/* ─── List Cards Skeleton ─── */}
      {[0, 1, 2, 3].map(i => (
        <Animated.View
          key={`skeleton_card_${i}`}
          style={[skeletonStyles.cardSkeleton, {opacity: shimmerAnim}]}>
          <View style={skeletonStyles.cardTopRow}>
            <View style={skeletonStyles.badgeGroup}>
              <View style={skeletonStyles.statusBadgeSkeleton} />
              <View style={skeletonStyles.methodBadgeSkeleton} />
            </View>
            <View style={skeletonStyles.timeSkeleton} />
          </View>
          <View style={skeletonStyles.urlLineLong} />
          <View style={skeletonStyles.urlLineShort} />
          <View style={skeletonStyles.cardBottomRow}>
            <View style={skeletonStyles.metaPillSkeleton} />
            <View style={skeletonStyles.metaPillSkeleton} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
});

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  toolbarSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBarSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButtonSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  chipStripSkeleton: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  chipSkeleton: {
    height: 24,
    borderRadius: 6,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardSkeleton: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeSkeleton: {
    width: 38,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  methodBadgeSkeleton: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  timeSkeleton: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
  urlLineLong: {
    height: 13,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
    marginBottom: 5,
    width: '90%',
  },
  urlLineShort: {
    height: 11,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
    marginBottom: 8,
    width: '55%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metaPillSkeleton: {
    width: 52,
    height: 14,
    borderRadius: 4,
    backgroundColor: AppColors.graySurface,
  },
});

export default MainScreen;
