import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import TouchableScale from '../touchable-scale';
import {AppColors} from '../../styles/app-colors';
import {AppFonts} from '../../styles/app-fonts';
import {useTranslation} from '../../i18n';
import {
  KeyIcon,
  SearchIcon,
  ClearIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  LockIcon,
  UnlockIcon,
  EyeIcon,
  ChevronIcon,
  ResetIcon,
  ExportIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  LayersIcon,
} from '../network-icons';
import {
  fetchEnvEntries,
  setEnvOverride,
  removeEnvOverride,
  clearEnvOverrides,
  getEnvOverridesCount,
  subscribeToEnvChanges,
  exportEnvAsDotEnv,
  exportEnvAsJson,
  maskSecretValue,
} from '../../hooks/env-inspector';
import {EnvEntry} from '../../types';
import {copyToClipboard} from '../../helpers';
import {showToast} from '../../helpers/toast';

type EnvFilterTab = 'all' | 'secrets' | 'overrides' | 'process' | 'config' | 'custom';

const getTypeBadge = (type: EnvEntry['type']) => {
  switch (type) {
    case 'json':
      return {label: 'JSON', color: AppColors.purple, bg: `${AppColors.purple}16`};
    case 'number':
      return {label: 'NUM', color: AppColors.warningIconGold, bg: `${AppColors.warningIconGold}16`};
    case 'boolean':
      return {label: 'BOOL', color: AppColors.emerald500, bg: `${AppColors.emerald500}16`};
    case 'null':
    case 'empty':
      return {label: 'NULL', color: AppColors.grayTextWeak, bg: `${AppColors.grayTextWeak}16`};
    default:
      return {label: 'STR', color: AppColors.blue500, bg: `${AppColors.blue500}16`};
  }
};

const getSourceBadge = (source: EnvEntry['source']) => {
  switch (source) {
    case 'override':
      return {label: 'OVERRIDE', color: AppColors.errorColor, bg: `${AppColors.errorColor}18`};
    case 'process.env':
      return {label: 'PROCESS.ENV', color: AppColors.skyBlue, bg: `${AppColors.skyBlue}16`};
    case 'react-native-config':
      return {label: 'CONFIG', color: AppColors.purple, bg: `${AppColors.purple}16`};
    case 'custom':
      return {label: 'CUSTOM', color: AppColors.offerPurple, bg: `${AppColors.offerPurple}16`};
    default:
      return {label: 'SYSTEM', color: AppColors.grayTextWeak, bg: `${AppColors.grayTextWeak}16`};
  }
};

interface EnvEntryCardProps {
  entry: EnvEntry;
  isExpanded: boolean;
  isRevealed: boolean;
  onToggleExpand: (key: string) => void;
  onToggleReveal: (key: string) => void;
  onCopyValue: (entry: EnvEntry) => void;
  onCopyKey: (key: string) => void;
  onCopyDotEnv: (entry: EnvEntry) => void;
  onEdit: (entry: EnvEntry) => void;
  onDeleteOverride: (key: string) => void;
}

const EnvEntryCard = React.memo(function EnvEntryCard({
  entry,
  isExpanded,
  isRevealed,
  onToggleExpand,
  onToggleReveal,
  onCopyValue,
  onCopyKey,
  onCopyDotEnv,
  onEdit,
  onDeleteOverride,
}: EnvEntryCardProps) {
  const typeBadge = useMemo(() => getTypeBadge(entry.type), [entry.type]);
  const sourceBadge = useMemo(() => getSourceBadge(entry.source), [entry.source]);

  const shouldMask = entry.isSecret && !isRevealed;

  const displayValue = useMemo(() => {
    if (shouldMask) {
      return maskSecretValue(entry.value);
    }
    if (!isExpanded && entry.value.length > 200) {
      return entry.value.slice(0, 200) + '...';
    }
    if (isExpanded && entry.type === 'json') {
      try {
        const parsed = JSON.parse(entry.value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return entry.value;
      }
    }
    return entry.value;
  }, [shouldMask, isExpanded, entry.value, entry.type]);

  const isMultiline = entry.value.includes('\n') || entry.value.length > 120 || entry.type === 'json';

  return (
    <View style={styles.entryCard}>
      {/* Header: Key name, Badges, Actions */}
      <View style={styles.entryHeader}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
            <Text style={styles.entryKey} numberOfLines={1} selectable>
              {entry.key}
            </Text>

            {/* Type Badge */}
            <View
              style={[
                styles.badge,
                {backgroundColor: typeBadge.bg, borderColor: `${typeBadge.color}33`},
              ]}>
              <Text style={[styles.badgeText, {color: typeBadge.color}]}>
                {typeBadge.label}
              </Text>
            </View>

            {/* Source Badge */}
            <View
              style={[
                styles.badge,
                {backgroundColor: sourceBadge.bg, borderColor: `${sourceBadge.color}33`},
              ]}>
              <Text style={[styles.badgeText, {color: sourceBadge.color}]}>
                {sourceBadge.label}
              </Text>
            </View>

            {/* Secret Lock Icon */}
            {entry.isSecret && (
              <View
                style={[
                  styles.secretPill,
                  {
                    backgroundColor: isRevealed
                      ? `${AppColors.warningIconGold}20`
                      : `${AppColors.errorColor}18`,
                    borderColor: isRevealed
                      ? `${AppColors.warningIconGold}44`
                      : `${AppColors.errorColor}33`,
                  },
                ]}>
                {isRevealed ? (
                  <UnlockIcon size={10} color={AppColors.warningIconGold} />
                ) : (
                  <LockIcon size={10} color={AppColors.errorColor} />
                )}
                <Text
                  style={[
                    styles.secretPillText,
                    {
                      color: isRevealed
                        ? AppColors.warningIconGold
                        : AppColors.errorColor,
                    },
                  ]}>
                  {isRevealed ? 'REVEALED' : 'SECRET'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action icons */}
        <View style={styles.actionsRow}>
          {/* Toggle reveal for secret */}
          {entry.isSecret && (
            <TouchableScale
              onPress={() => onToggleReveal(entry.key)}
              hitSlop={8}
              style={styles.iconBtn}>
              <EyeIcon
                size={14}
                color={isRevealed ? AppColors.purple : AppColors.grayTextWeak}
              />
            </TouchableScale>
          )}

          {/* Copy menu / quick copy */}
          <TouchableScale
            onPress={() => onCopyValue(entry)}
            onLongPress={() => onCopyDotEnv(entry)}
            hitSlop={8}
            style={styles.iconBtn}>
            <CopyIcon size={14} color={AppColors.grayTextWeak} />
          </TouchableScale>

          {/* Edit override */}
          <TouchableScale
            onPress={() => onEdit(entry)}
            hitSlop={8}
            style={styles.iconBtn}>
            <PencilIcon size={13} color={AppColors.grayTextWeak} />
          </TouchableScale>

          {/* Delete override if present */}
          {entry.isOverridden && (
            <TouchableScale
              onPress={() => onDeleteOverride(entry.key)}
              hitSlop={8}
              style={styles.iconBtn}>
              <TrashIcon size={13} color={AppColors.errorColor} />
            </TouchableScale>
          )}
        </View>
      </View>

      {/* Value Display Box */}
      <View style={styles.valueContainer}>
        <Text
          style={[
            styles.entryValue,
            entry.type === 'boolean' && {
              color: entry.value === 'true' ? AppColors.emerald500 : AppColors.errorColor,
            },
            entry.type === 'number' && {
              color: AppColors.warningIconGold,
            },
            entry.type === 'null' && {
              color: AppColors.grayTextWeak,
              fontStyle: 'italic',
            },
            shouldMask && styles.maskedValue,
          ]}
          selectable={!shouldMask}
          numberOfLines={isExpanded ? undefined : 3}>
          {displayValue || '""'}
        </Text>
      </View>

      {/* Footer: Expand toggle & Copy actions bar */}
      <View style={styles.entryFooter}>
        <View style={styles.footerLeft}>
          {isMultiline && !shouldMask && (
            <TouchableScale
              onPress={() => onToggleExpand(entry.key)}
              style={styles.expandBtn}>
              <Text style={styles.expandBtnText}>
                {isExpanded ? 'Collapse' : 'Expand'}
              </Text>
              <ChevronIcon
                size={10}
                direction={isExpanded ? 'up' : 'down'}
                color={AppColors.purple}
              />
            </TouchableScale>
          )}
        </View>

        <View style={styles.footerRight}>
          <TouchableScale
            onPress={() => onCopyKey(entry.key)}
            style={styles.chipBtn}>
            <Text style={styles.chipBtnText}>Copy Key</Text>
          </TouchableScale>

          <TouchableScale
            onPress={() => onCopyDotEnv(entry)}
            style={styles.chipBtn}>
            <Text style={styles.chipBtnText}>Copy .env</Text>
          </TouchableScale>
        </View>
      </View>
    </View>
  );
});

export const EnvVariablesTab = React.memo(() => {
  const [entries, setEntries] = useState<EnvEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<EnvFilterTab>('all');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [revealAllSecrets, setRevealAllSecrets] = useState<boolean>(false);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Modal state for Add/Edit Override
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalKey, setModalKey] = useState<string>('');
  const [modalValue, setModalValue] = useState<string>('');
  const [keyError, setKeyError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const data = fetchEnvEntries();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToEnvChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  // Expand / Collapse JSON
  const handleToggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  }, []);

  // Reveal / Mask single secret
  const handleToggleReveal = useCallback((key: string) => {
    setRevealedKeys(prev => ({...prev, [key]: !prev[key]}));
  }, []);

  // Toggle Reveal All Secrets
  const handleToggleRevealAll = useCallback(() => {
    setRevealAllSecrets(prev => {
      const next = !prev;
      showToast(next ? 'All secrets revealed' : 'All secrets masked');
      return next;
    });
  }, []);

  // Copy handlers
  const handleCopyValue = useCallback((entry: EnvEntry) => {
    copyToClipboard(entry.value, entry.key);
    showToast(`Copied value of "${entry.key}"`);
  }, []);

  const handleCopyKey = useCallback((key: string) => {
    copyToClipboard(key, 'Key');
    showToast(`Copied "${key}"`);
  }, []);

  const handleCopyDotEnv = useCallback((entry: EnvEntry) => {
    const val = entry.value.includes('\n') || entry.value.includes(' ')
      ? `"${entry.value.replace(/"/g, '\\"')}"`
      : entry.value;
    copyToClipboard(`${entry.key}=${val}`, entry.key);
    showToast(`Copied ${entry.key}=...`);
  }, []);

  // Copy All as .env
  const handleExportDotEnv = useCallback(() => {
    if (entries.length === 0) {
      showToast('No variables to export');
      return;
    }
    const content = exportEnvAsDotEnv(entries);
    copyToClipboard(content, 'All ENV Variables (.env)');
    showToast(`Exported ${entries.length} variables as .env`);
  }, [entries]);

  // Copy All as JSON
  const handleExportJson = useCallback(() => {
    if (entries.length === 0) {
      showToast('No variables to export');
      return;
    }
    const content = exportEnvAsJson(entries);
    copyToClipboard(content, 'All ENV Variables (JSON)');
    showToast(`Exported ${entries.length} variables as JSON`);
  }, [entries]);

  // Open modal to add
  const handleOpenAdd = useCallback(() => {
    setModalMode('add');
    setModalKey('');
    setModalValue('');
    setKeyError(null);
    setIsModalOpen(true);
  }, []);

  // Open modal to edit
  const handleOpenEdit = useCallback((entry: EnvEntry) => {
    setModalMode('edit');
    setModalKey(entry.key);
    setModalValue(entry.value);
    setKeyError(null);
    setIsModalOpen(true);
  }, []);

  // Delete single override
  const handleDeleteOverride = useCallback((key: string) => {
    Alert.alert(
      'Remove Override',
      `Revert override for "${key}" to original value?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeEnvOverride(key);
            showToast(`Removed override for "${key}"`);
          },
        },
      ],
    );
  }, []);

  // Clear all overrides
  const handleClearAllOverrides = useCallback(() => {
    const count = getEnvOverridesCount();
    if (count === 0) return;
    Alert.alert(
      'Clear All Overrides',
      `Revert all ${count} active session variable overrides?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearEnvOverrides();
            showToast('All variable overrides cleared');
          },
        },
      ],
    );
  }, []);

  // Save Modal
  const handleSaveModal = () => {
    const trimmedKey = modalKey.trim();
    if (!trimmedKey) {
      setKeyError('Variable key cannot be empty');
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedKey)) {
      setKeyError('Key should contain only letters, numbers, and underscores');
      return;
    }
    setEnvOverride(trimmedKey, modalValue);
    showToast(modalMode === 'add' ? `Added "${trimmedKey}"` : `Updated "${trimmedKey}"`);
    setIsModalOpen(false);
  };

  // Counts for tabs
  const counts = useMemo(() => {
    let secrets = 0;
    let overrides = 0;
    let processCount = 0;
    let configCount = 0;
    let customCount = 0;

    entries.forEach(e => {
      if (e.isSecret) secrets++;
      if (e.isOverridden) overrides++;
      if (e.source === 'process.env') processCount++;
      else if (e.source === 'react-native-config') configCount++;
      else if (e.source === 'custom') customCount++;
    });

    return {
      all: entries.length,
      secrets,
      overrides,
      process: processCount,
      config: configCount,
      custom: customCount,
    };
  }, [entries]);

  // Filter and search
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Subtab filter
      if (activeFilter === 'secrets' && !e.isSecret) return false;
      if (activeFilter === 'overrides' && !e.isOverridden) return false;
      if (activeFilter === 'process' && e.source !== 'process.env') return false;
      if (activeFilter === 'config' && e.source !== 'react-native-config') return false;
      if (activeFilter === 'custom' && e.source !== 'custom') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesKey = e.key.toLowerCase().includes(q);
        const matchesVal = e.value.toLowerCase().includes(q);
        return matchesKey || matchesVal;
      }
      return true;
    });
  }, [entries, activeFilter, search]);

  const renderItem = useCallback(
    ({item}: {item: EnvEntry}) => (
      <EnvEntryCard
        entry={item}
        isExpanded={Boolean(expandedKeys[item.key])}
        isRevealed={revealAllSecrets || Boolean(revealedKeys[item.key])}
        onToggleExpand={handleToggleExpand}
        onToggleReveal={handleToggleReveal}
        onCopyValue={handleCopyValue}
        onCopyKey={handleCopyKey}
        onCopyDotEnv={handleCopyDotEnv}
        onEdit={handleOpenEdit}
        onDeleteOverride={handleDeleteOverride}
      />
    ),
    [
      expandedKeys,
      revealAllSecrets,
      revealedKeys,
      handleToggleExpand,
      handleToggleReveal,
      handleCopyValue,
      handleCopyKey,
      handleCopyDotEnv,
      handleOpenEdit,
      handleDeleteOverride,
    ],
  );

  return (
    <View style={styles.container}>
      {/* ── Subtabs Filter Strip ── */}
      <View style={styles.filterStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStripContainer}>
          <TouchableScale
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterPill,
              activeFilter === 'all' && styles.filterPillActive,
            ]}>
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}>
              All ({counts.all})
            </Text>
          </TouchableScale>

          {counts.secrets > 0 && (
            <TouchableScale
              onPress={() => setActiveFilter('secrets')}
              style={[
                styles.filterPill,
                activeFilter === 'secrets' && styles.filterPillActive,
              ]}>
              <LockIcon
                size={11}
                color={activeFilter === 'secrets' ? AppColors.white : AppColors.errorColor}
              />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'secrets' && styles.filterPillTextActive,
                ]}>
                Secrets ({counts.secrets})
              </Text>
            </TouchableScale>
          )}

          {counts.overrides > 0 && (
            <TouchableScale
              onPress={() => setActiveFilter('overrides')}
              style={[
                styles.filterPill,
                activeFilter === 'overrides' && styles.filterPillActive,
              ]}>
              <PencilIcon
                size={11}
                color={activeFilter === 'overrides' ? AppColors.white : AppColors.warningIconGold}
              />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'overrides' && styles.filterPillTextActive,
                ]}>
                Overrides ({counts.overrides})
              </Text>
            </TouchableScale>
          )}

          {counts.process > 0 && (
            <TouchableScale
              onPress={() => setActiveFilter('process')}
              style={[
                styles.filterPill,
                activeFilter === 'process' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'process' && styles.filterPillTextActive,
                ]}>
                process.env ({counts.process})
              </Text>
            </TouchableScale>
          )}

          {counts.config > 0 && (
            <TouchableScale
              onPress={() => setActiveFilter('config')}
              style={[
                styles.filterPill,
                activeFilter === 'config' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'config' && styles.filterPillTextActive,
                ]}>
                Config ({counts.config})
              </Text>
            </TouchableScale>
          )}

          {counts.custom > 0 && (
            <TouchableScale
              onPress={() => setActiveFilter('custom')}
              style={[
                styles.filterPill,
                activeFilter === 'custom' && styles.filterPillActive,
              ]}>
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'custom' && styles.filterPillTextActive,
                ]}>
                Custom ({counts.custom})
              </Text>
            </TouchableScale>
          )}
        </ScrollView>
      </View>

      {/* ── Search & Controls Bar ── */}
      <View style={styles.controlsBar}>
        <View style={styles.searchWrap}>
          <SearchIcon size={14} color={AppColors.grayTextWeak} />
          <TextInput
            placeholder="Search by key or value..."
            placeholderTextColor={AppColors.grayTextWeak}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableScale
              onPress={() => setSearch('')}
              hitSlop={8}
              style={styles.clearSearchBtn}>
              <ClearIcon size={12} color={AppColors.grayTextWeak} />
            </TouchableScale>
          )}
        </View>

        {/* Global Toolbar Buttons */}
        <View style={styles.toolbarBtns}>
          {/* Reveal All Secrets Toggle */}
          {counts.secrets > 0 && (
            <TouchableScale
              onPress={handleToggleRevealAll}
              style={[
                styles.toolBtn,
                revealAllSecrets && styles.toolBtnActive,
              ]}>
              <EyeIcon
                size={13}
                color={revealAllSecrets ? AppColors.white : AppColors.grayText}
              />
            </TouchableScale>
          )}

          {/* Export / Copy All as .env */}
          <TouchableScale
            onPress={handleExportDotEnv}
            onLongPress={handleExportJson}
            style={styles.toolBtn}>
            <ExportIcon size={13} color={AppColors.grayText} />
          </TouchableScale>

          {/* Clear Overrides Button */}
          {counts.overrides > 0 && (
            <TouchableScale
              onPress={handleClearAllOverrides}
              style={styles.toolBtn}>
              <ResetIcon size={13} color={AppColors.errorColor} />
            </TouchableScale>
          )}

          {/* Add Override Button */}
          <TouchableScale
            onPress={handleOpenAdd}
            style={[styles.toolBtn, styles.addBtn]}>
            <PlusIcon size={13} color={AppColors.white} />
          </TouchableScale>
        </View>
      </View>

      {/* ── List Content ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColors.purple} />
          <Text style={styles.loadingText}>Reading environment variables...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <KeyIcon size={28} color={AppColors.purple} />
          </View>
          <Text style={styles.emptyTitle}>
            {search.trim()
              ? 'No matching environment variables'
              : 'No Environment Variables Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? `No variables match "${search}". Try clearing search.`
              : 'Inject variables via <NetworkInspector envVariables={...} /> or connectEnvVariables().'}
          </Text>

          {/* Quick Connection Guide */}
          {!search.trim() && (
            <View style={styles.connectGuideCard}>
              <Text style={styles.connectGuideTitle}>💡 How to connect your env:</Text>
              <Text style={styles.connectGuideCode}>
                {`// Option 1: Pass to <NetworkInspector />\n<NetworkInspector envVariables={process.env} />\n\n// Option 2: Register globally\nimport { connectEnvVariables } from 'react-native-inapp-inspector';\nconnectEnvVariables(process.env);`}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
        />
      )}

      {/* ── Add / Edit Override Modal ── */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <KeyIcon size={16} color={AppColors.purple} />
                <Text style={styles.modalTitle}>
                  {modalMode === 'add' ? 'Add Environment Override' : 'Edit Override'}
                </Text>
              </View>
              <TouchableScale
                onPress={() => setIsModalOpen(false)}
                hitSlop={8}>
                <ClearIcon size={16} color={AppColors.grayTextWeak} />
              </TouchableScale>
            </View>

            {/* Key Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VARIABLE NAME</Text>
              <TextInput
                placeholder="e.g. API_BASE_URL, FEATURE_FLAG"
                placeholderTextColor={AppColors.grayTextWeak}
                value={modalKey}
                onChangeText={text => {
                  setModalKey(text);
                  setKeyError(null);
                }}
                editable={modalMode === 'add'}
                style={[
                  styles.textInput,
                  modalMode === 'edit' && styles.textInputDisabled,
                ]}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {keyError && <Text style={styles.errorText}>{keyError}</Text>}
            </View>

            {/* Value Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OVERRIDE VALUE</Text>
              <TextInput
                placeholder="Value..."
                placeholderTextColor={AppColors.grayTextWeak}
                value={modalValue}
                onChangeText={setModalValue}
                style={[styles.textInput, styles.textAreaInput]}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Modal Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableScale
                onPress={() => setIsModalOpen(false)}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableScale>

              <TouchableScale
                onPress={handleSaveModal}
                style={styles.saveBtn}>
                <CheckIcon size={14} color={AppColors.white} />
                <Text style={styles.saveBtnText}>
                  {modalMode === 'add' ? 'Set Override' : 'Save'}
                </Text>
              </TouchableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.contentBg,
  },
  filterStripWrapper: {
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
  },
  filterStripContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  filterPillActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  filterPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.grayText,
  },
  filterPillTextActive: {
    color: AppColors.white,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    paddingHorizontal: 8,
    height: 34,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  toolbarBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  addBtn: {
    backgroundColor: AppColors.purple,
    borderColor: AppColors.purple,
  },
  listContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 40,
  },
  entryCard: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 10,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryKey: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.primaryBlack,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: AppFonts.interBold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  secretPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  secretPillText: {
    fontFamily: AppFonts.interBold,
    fontSize: 8.5,
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  valueContainer: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  entryValue: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: AppColors.slate700,
    lineHeight: 16,
  },
  maskedValue: {
    letterSpacing: 1.5,
    color: AppColors.grayTextWeak,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  expandBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 10,
    color: AppColors.purple,
  },
  chipBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
  },
  chipBtnText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 9.5,
    color: AppColors.grayText,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  loadingText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.grayText,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: AppFonts.interRegular,
    fontSize: 11.5,
    color: AppColors.grayText,
    textAlign: 'center',
    maxWidth: 290,
  },
  connectGuideCard: {
    marginTop: 18,
    width: '100%',
    backgroundColor: AppColors.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    padding: 12,
    gap: 6,
  },
  connectGuideTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 11,
    color: AppColors.purple,
  },
  connectGuideCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: AppColors.grayText,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: AppColors.primaryLight,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: AppColors.black,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingBottom: 10,
  },
  modalTitle: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.primaryBlack,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: AppFonts.interBold,
    fontSize: 9.5,
    color: AppColors.grayTextWeak,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: AppColors.grayBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: AppFonts.interMedium,
    fontSize: 12,
    color: AppColors.primaryBlack,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  textInputDisabled: {
    backgroundColor: `${AppColors.grayBorderSecondary}40`,
    color: AppColors.grayText,
  },
  textAreaInput: {
    minHeight: 80,
    maxHeight: 140,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  errorText: {
    fontFamily: AppFonts.interMedium,
    fontSize: 10,
    color: AppColors.errorColor,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.grayBackground,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
  },
  cancelBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.grayText,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.purple,
  },
  saveBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 12,
    color: AppColors.white,
  },
});

export default EnvVariablesTab;

