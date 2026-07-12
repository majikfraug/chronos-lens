import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ALL_TYPES,
  FEATURE_TYPES,
  poolForScale,
  SIMULATED_PUBLIC_COUNTS,
  type TypeName,
} from '../config/taxonomy';
import { listScansOfType, type ScanRecord } from '../persistence/scanRepository';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type SortMode = 'TAXONOMY' | 'RECENT' | 'HELD';

/**
 * M3 Reliquary: per-type slots lit by the player's actual dithered captures.
 * Slots open into per-relic management: rename, reclassify, expunge.
 * "Recorded by others" counts are SIMULATED locally (authored constants in
 * taxonomy.ts) — v1 has no backend; real aggregation is v2. Brief §2.4.
 */
export function ReliquaryScreen(): React.JSX.Element {
  const reliquary = useGameStore((s) => s.reliquary);
  const customTypes = useGameStore((s) => s.customTypes);
  const [sort, setSort] = useState<SortMode>('TAXONOMY');
  const [openType, setOpenType] = useState<TypeName | null>(null);

  const allTypes: TypeName[] = [...ALL_TYPES, ...customTypes.map((c) => c.name)];
  const lit = allTypes.filter((t) => reliquary[t]).length;
  const held = allTypes.reduce((sum, t) => sum + (reliquary[t]?.count ?? 0), 0);

  const sorted = [...allTypes].sort((a, b) => {
    if (sort === 'RECENT') return (reliquary[b]?.lastTs ?? 0) - (reliquary[a]?.lastTs ?? 0);
    if (sort === 'HELD') return (reliquary[b]?.count ?? 0) - (reliquary[a]?.count ?? 0);
    return 0; // TAXONOMY: authored order, customs after
  });

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <View style={styles.regionBar}>
        <Text style={styles.regionName}>SURVEY REGION</Text>
        <Text style={styles.completion}>
          <Text style={styles.completionCount}>{lit}</Text>/{allTypes.length} TYPES ATTESTED ·{' '}
          {held} HELD
        </Text>
      </View>
      <View style={styles.compTrack}>
        <View style={[styles.compFill, { width: `${(lit / allTypes.length) * 100}%` }]} />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.secLabel}>TYPE ARCHIVE</Text>
        <View style={styles.sortBtns}>
          {(['TAXONOMY', 'RECENT', 'HELD'] as const).map((m) => (
            <Pressable key={m} onPress={() => setSort(m)}>
              <Text style={[styles.sortText, sort === m && styles.sortActive]}>{m}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {held === 0 && (
        <Text style={styles.emptyNote}>
          No forms attested. Raise the Lens where density gathers, hold scan, and identify what
          surfaces — each filing lights its slot here, with your capture as the record.
        </Text>
      )}

      <View style={styles.grid}>
        {sorted.map((t) => (
          <Slot
            key={t}
            type={t}
            onOpen={() =>
              (reliquary[t] || customTypes.some((c) => c.name === t)) && setOpenType(t)
            }
          />
        ))}
      </View>

      {openType && <SlotDetail type={openType} onClose={() => setOpenType(null)} />}
    </ScrollView>
  );
}

function Slot({ type, onOpen }: { type: TypeName; onOpen: () => void }): React.JSX.Element {
  const slot = useGameStore((s) => s.reliquary[type]);
  const isFeature = (FEATURE_TYPES as readonly string[]).includes(type);
  const isCustom = !ALL_TYPES.includes(type);
  const pub = SIMULATED_PUBLIC_COUNTS[type];

  return (
    <Pressable
      style={[styles.slot, slot && styles.slotLit]}
      onPress={onOpen}
      disabled={!slot && !isCustom}
    >
      {slot && slot.count > 1 && <Text style={styles.stack}>×{slot.count}</Text>}
      <View style={styles.thumb}>
        {slot?.thumbUri ? (
          <Image source={{ uri: slot.thumbUri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbEmpty}>? ?</Text>
        )}
      </View>
      <Text style={[styles.typeName, slot && styles.typeNameLit]}>
        {type}
        {isFeature ? ' ·F' : ''}
      </Text>
      {slot?.taughtFirst && <Text style={styles.taught}>FIRST TAUGHT BY YOU</Text>}
      <Text style={styles.pub}>
        {pub != null
          ? `${pub} recorded by others${pub <= 5 ? ' · rare' : ''}`
          : isCustom
            ? 'unrecorded elsewhere · yours'
            : ''}
      </Text>
    </Pressable>
  );
}

/** Per-relic management: rename, reclassify (moves model weight), expunge. */
function SlotDetail({ type, onClose }: { type: TypeName; onClose: () => void }): React.JSX.Element {
  const customTypes = useGameStore((s) => s.customTypes);
  const renameRelic = useGameStore((s) => s.renameRelic);
  const reclassifyRelic = useGameStore((s) => s.reclassifyRelic);
  const expungeRelic = useGameStore((s) => s.expungeRelic);
  const reviseCustomType = useGameStore((s) => s.reviseCustomType);
  const removeCustomType = useGameStore((s) => s.removeCustomType);
  const isCustom = customTypes.some((c) => c.name === type);

  const [items, setItems] = useState<ScanRecord[]>([]);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');
  const [reclassifyingId, setReclassifyingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [revisingCategory, setRevisingCategory] = useState(false);
  const [categoryText, setCategoryText] = useState('');

  const reload = async (t: TypeName) => setItems(await listScansOfType(t));
  useEffect(() => {
    void reload(type);
  }, [type]);

  const startRename = (item: ScanRecord) => {
    setRenamingId(item.id);
    setRenameText(item.name ?? '');
    setReclassifyingId(null);
    setConfirmDeleteId(null);
  };

  const commitRename = async (id: number) => {
    await renameRelic(id, renameText.trim() || null);
    setRenamingId(null);
    await reload(type);
  };

  const commitReclassify = async (id: number, newType: TypeName) => {
    await reclassifyRelic(id, newType);
    setReclassifyingId(null);
    await reload(type);
  };

  const commitExpunge = async (id: number) => {
    await expungeRelic(id);
    setConfirmDeleteId(null);
    const remaining = items.filter((i) => i.id !== id);
    setItems(remaining);
    if (remaining.length === 0) onClose();
  };

  const item = (it: ScanRecord) => {
    const scanItemPool = poolForScale(it.scale, customTypes).filter((t) => t !== type);
    return (
      <View key={it.id} style={styles.item}>
        <View style={styles.itemRow}>
          {it.thumbUri ? (
            <Image source={{ uri: it.thumbUri }} style={styles.itemThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.itemThumb, styles.itemThumbEmpty]} />
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.itemName}>
              {it.name ?? `${type} · unnamed`}
            </Text>
            <Text style={styles.itemSub}>
              {new Date(it.ts).toLocaleDateString()} ·{' '}
              {it.taught ? 'TAUGHT' : it.corrected ? 'CORRECTED' : 'CONFIRMED'}
            </Text>
            <View style={styles.itemActions}>
              <Pressable onPress={() => startRename(it)}>
                <Text style={styles.itemAction}>RENAME</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setReclassifyingId(reclassifyingId === it.id ? null : it.id);
                  setRenamingId(null);
                  setConfirmDeleteId(null);
                }}
              >
                <Text style={styles.itemAction}>RECLASSIFY</Text>
              </Pressable>
              {confirmDeleteId === it.id ? (
                <Pressable onPress={() => void commitExpunge(it.id)}>
                  <Text style={[styles.itemAction, styles.itemDanger]}>CONFIRM EXPUNGE?</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setConfirmDeleteId(it.id);
                    setRenamingId(null);
                    setReclassifyingId(null);
                  }}
                >
                  <Text style={[styles.itemAction, styles.itemDanger]}>EXPUNGE</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {renamingId === it.id && (
          <View style={styles.renameRow}>
            <TextInput
              style={styles.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="give this one a name"
              placeholderTextColor={colors.phosphorFaint}
              autoFocus
              maxLength={40}
              onSubmitEditing={() => void commitRename(it.id)}
            />
            <Pressable style={styles.renameBtn} onPress={() => void commitRename(it.id)}>
              <Text style={styles.itemAction}>KEEP</Text>
            </Pressable>
          </View>
        )}

        {reclassifyingId === it.id && (
          <View style={styles.reclassRow}>
            {scanItemPool.map((t) => (
              <Pressable key={t} style={styles.reclassChip} onPress={() => void commitReclassify(it.id, t)}>
                <Text style={styles.reclassChipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalScrim}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{type}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          {isCustom && (
            <View style={styles.categoryMgmt}>
              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => {
                    setRevisingCategory((v) => !v);
                    setCategoryText(type);
                  }}
                >
                  <Text style={styles.itemAction}>REVISE NAME</Text>
                </Pressable>
                {items.length === 0 ? (
                  <Pressable
                    onPress={async () => {
                      await removeCustomType(type);
                      onClose();
                    }}
                  >
                    <Text style={[styles.itemAction, styles.itemDanger]}>REMOVE CATEGORY</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.categoryHint}>
                    holds {items.length} record{items.length === 1 ? '' : 's'} · reclassify or
                    expunge them to remove
                  </Text>
                )}
              </View>
              {revisingCategory && (
                <View style={styles.renameRow}>
                  <TextInput
                    style={styles.renameInput}
                    value={categoryText}
                    onChangeText={setCategoryText}
                    autoCapitalize="characters"
                    autoFocus
                    maxLength={24}
                    onSubmitEditing={async () => {
                      await reviseCustomType(type, categoryText);
                      onClose();
                    }}
                  />
                  <Pressable
                    style={styles.renameBtn}
                    onPress={async () => {
                      await reviseCustomType(type, categoryText);
                      onClose();
                    }}
                  >
                    <Text style={styles.itemAction}>KEEP</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <ScrollView style={styles.modalScroll}>
            {items.length === 0 && (
              <Text style={styles.emptyDetail}>No records filed under this designation yet.</Text>
            )}
            {items.map(item)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { paddingHorizontal: 12, paddingVertical: 10 },
  regionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  regionName: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.phosphor,
  },
  completion: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.phosphorDim,
  },
  completionCount: { color: colors.neon, fontFamily: fonts.bodyMedium },
  compTrack: {
    height: 4,
    backgroundColor: colors.panel2,
    marginTop: 5,
    marginBottom: 12,
  },
  compFill: { height: '100%', backgroundColor: colors.phosphorDim },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 7,
  },
  secLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 2.5,
    color: colors.phosphorDim,
  },
  sortBtns: { flexDirection: 'row', gap: 10 },
  sortText: {
    fontFamily: fonts.body,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.phosphorFaint,
  },
  sortActive: { color: colors.neon },
  emptyNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    color: colors.phosphorFaint,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: '31%',
    flexGrow: 1,
    minWidth: 104,
    maxWidth: 160,
    minHeight: 118,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 7,
    gap: 3,
  },
  slotLit: { borderColor: 'rgba(113,232,201,0.35)' },
  stack: {
    position: 'absolute',
    top: 4,
    right: 6,
    zIndex: 1,
    fontFamily: fonts.body,
    fontSize: 8.5,
    color: colors.phosphorDim,
  },
  thumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.phosphorFaint,
  },
  typeName: {
    fontFamily: fonts.body,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.phosphorDim,
  },
  typeNameLit: { color: colors.neon },
  taught: {
    fontFamily: fonts.body,
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: colors.interestAmber,
  },
  pub: {
    marginTop: 'auto',
    fontFamily: fonts.body,
    fontSize: 8,
    color: colors.phosphorFaint,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(7,9,7,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalPanel: {
    alignSelf: 'stretch',
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    letterSpacing: 2,
    color: colors.phosphor,
  },
  modalClose: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.phosphorDim,
  },
  modalScroll: { paddingHorizontal: 12 },
  categoryMgmt: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.panel2,
    gap: 6,
  },
  categoryHint: {
    fontFamily: fonts.body,
    fontSize: 8.5,
    color: colors.phosphorFaint,
    alignSelf: 'center',
  },
  emptyDetail: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.phosphorFaint,
    paddingVertical: 14,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.panel2,
    gap: 7,
  },
  itemRow: { flexDirection: 'row', gap: 9 },
  itemThumb: { width: 72, height: 54, backgroundColor: colors.panel2 },
  itemThumbEmpty: { borderWidth: 1, borderColor: colors.line },
  itemMeta: { flex: 1, gap: 2 },
  itemName: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.bright,
  },
  itemSub: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.phosphorFaint,
  },
  itemActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  itemAction: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.neon,
    paddingVertical: 4,
  },
  itemDanger: { color: colors.warn },
  renameRow: { flexDirection: 'row', gap: 6 },
  renameInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bright,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  renameBtn: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
  },
  reclassRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  reclassChip: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  reclassChipText: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    color: colors.phosphorDim,
  },
});
