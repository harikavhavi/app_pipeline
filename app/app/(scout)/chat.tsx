import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { chatService } from '../../services/chat.service';
import { ChatMessage } from '../../types';

const POLL_MS = 3000;

export default function ScoutChat() {
  const router = useRouter();
  const { athleteId, athleteName } = useLocalSearchParams<{ athleteId: string; athleteName?: string }>();
  const userId = useAuthStore(s => s.userId); // this scout's id (the "counterpart" in the thread)

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft,    setDraft]    = useState('');
  const [sending,  setSending]  = useState(false);
  const listRef = useRef<FlatList>(null);

  const refresh = useCallback(async () => {
    if (!userId || !athleteId) return;
    const thread = await chatService.getThread('scout', athleteId, userId);
    setMessages(thread);
  }, [userId, athleteId]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, POLL_MS);
    return () => clearInterval(iv);
  }, [refresh]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !userId || !athleteId || sending) return;
    setSending(true);
    setDraft('');
    const sent = await chatService.sendMessage('scout', athleteId, userId, userId, body);
    if (sent) setMessages(m => [...m, sent]);
    setSending(false);
  }

  return (
    <Screen hasOrbs={false}>
      <Topbar title={athleteName ?? 'Chat'} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet — say hello!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={styles.bubbleText}>{item.body}</Text>
                  <Text style={styles.bubbleTime}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={Colors.t3}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!draft.trim() || sending}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: Colors.t3, fontSize: 13 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleTheirs: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderTopLeftRadius: 4 },
  bubbleMine: { backgroundColor: Colors.purple + '25', borderWidth: 1, borderColor: Colors.purple + '50', borderTopRightRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  bubbleTime: { color: Colors.t3, fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.card2, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    color: '#fff', fontSize: 13, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100,
  },
  sendBtn: { backgroundColor: Colors.purple, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
