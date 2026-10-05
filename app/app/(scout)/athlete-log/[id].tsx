/**
 * /(scout)/athlete-log/[id].tsx
 * Scout's private notes/log for a specific athlete they're tracking.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/auth.store';
import { logService } from '../../../services/log.service';
import { AthleteLogEntry, LogEntryTag } from '../../../types';

const TAG_COLORS: Record<LogEntryTag, string> = {
  strength:    Colors.green,
  concern:     Colors.red,
  improvement: Colors.cyan,
  observation: Colors.blue,
  milestone:   Colors.yellow,
};

const TAG_ICONS: Record<LogEntryTag, any> = {
  strength:    'trending-up',
  concern:     'warning',
  improvement: 'arrow-up-circle',
  observation: 'eye',
  milestone:   'trophy',
};

const ALL_TAGS: LogEntryTag[] = ['strength', 'concern', 'improvement', 'observation', 'milestone'];

function TagChip({ tag, active, onPress }: { tag: LogEntryTag; active: boolean; onPress?: () => void }) {
  const color = TAG_COLORS[tag];
  return (
    <TouchableOpacity
      style={[styles.tagChip, active && { borderColor: color, backgroundColor: color + '18' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={TAG_ICONS[tag]} size={11} color={active ? color : Colors.t3} />
      <Text style={[styles.tagChipText, active && { color }]}>{tag}</Text>
    </TouchableOpacity>
  );
}

function LogCard({ entry, onDelete }: { entry: AthleteLogEntry; onDelete: () => void }) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logDate}>{entry.date}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={14} color={Colors.t3} />
        </TouchableOpacity>
      </View>
      <Text style={styles.logNote}>{entry.note}</Text>
      {entry.tags.length > 0 && (
        <View style={styles.logTags}>
          {entry.tags.map(t => <TagChip key={t} tag={t} active />)}
        </View>
      )}
    </View>
  );
}

export default function ScoutAthleteLog() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);

  const [entries,    setEntries]    = useState<AthleteLogEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [note,       setNote]       = useState('');
  const [tags,       setTags]       = useState<LogEntryTag[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [athleteName, setAthleteName] = useState<string>('');

  const load = useCallback(async () => {
    if (!userId || !id) return;
    const logs = await logService.getEntries(userId, id);
    setEntries(logs);
    setLoading(false);
  }, [userId, id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!note.trim() || !userId || !id) return;
    setSaving(true);
    await logService.addEntry(userId, 'scout', id, note.trim(), tags);
    setSaving(false);
    setShowModal(false);
    setNote('');
    setTags([]);
    load();
  }

  async function handleDelete(entryId: string) {
    if (!userId || !id) return;
    await logService.deleteEntry(entryId, userId, id);
    load();
  }

  function toggleTag(t: LogEntryTag) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  return (
    <Screen>
      <Topbar
        title="Athlete Log"
        onBack={() => router.back()}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={18} color={Colors.purple} />
            <Text style={styles.addBtnText}>Add Note</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.infoRow}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.t3} />
          <Text style={styles.infoText}>Your private scouting notes — visible only to you</Text>
        </View>

        {loading && <View style={styles.center}><ActivityIndicator color={Colors.purple} /></View>}

        {!loading && entries.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={44} color={Colors.t3} />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySub}>Add your first scouting note for this athlete</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyBtnText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && entries.map(e => (
          <LogCard key={e.id} entry={e} onDelete={() => handleDelete(e.id)} />
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Scouting Note</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={Colors.t2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Note</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Write your observation about this athlete..."
              placeholderTextColor={Colors.t3}
              multiline
            />

            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsRow}>
              {ALL_TAGS.map(t => (
                <TagChip key={t} tag={t} active={tags.includes(t)} onPress={() => toggleTag(t)} />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!note.trim() || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!note.trim() || saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save Note</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoText: { color: Colors.t3, fontSize: 11 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.purple, fontSize: 13, fontWeight: '700' },

  logCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { color: Colors.t3, fontSize: 11 },
  logNote: { color: Colors.t1, fontSize: 13, lineHeight: 20 },
  logTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },

  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card2 },
  tagChipText: { color: Colors.t3, fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  center: { alignItems: 'center', paddingVertical: 60 },
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginTop: 6 },
  emptySub:   { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn:   { backgroundColor: Colors.purple, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  label: { color: Colors.t2, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: '#fff', fontSize: 13, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },

  saveBtn: { backgroundColor: Colors.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
