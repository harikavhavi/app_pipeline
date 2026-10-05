/**
 * /(athlete)/ai-chat.tsx
 * ParaSync AI assistant — context-aware chatbot for athletes.
 * Understands the athlete's sessions, metrics and provides sport-specific advice.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { AIChatMessage } from '../../types';

// ─── Simple local AI response engine ─────────────────────────────────────────
function generateAIResponse(userMsg: string, context: any): string {
  const msg = userMsg.toLowerCase();
  const sessions: any[] = context.sessions ?? [];
  const lastSession = sessions[0];
  const userName: string = context.userName ?? 'Athlete';

  if (msg.includes('hello') || msg.includes('hi ') || msg === 'hi' || msg.includes('hey')) {
    return `Hi ${userName.split(' ')[0]}! 👋 I'm your ParaSync AI assistant. I can help you understand your performance metrics, injury risks, training recommendations, and more. What would you like to know?`;
  }

  if (msg.includes('score') || msg.includes('performance')) {
    if (!lastSession) return 'I don\'t have any analysed sessions for you yet. Upload a video to get your first performance score!';
    return `Your latest session score is **${lastSession.score ?? lastSession.overallScore ?? '—'}**. ${(lastSession.score ?? 0) >= 70 ? 'That\'s a strong performance — keep up the excellent work! 🏆' : 'There\'s room to improve. Focus on the metrics flagged in your dashboard.'}`;
  }

  if (msg.includes('hrv') || msg.includes('heart rate variability')) {
    return 'HRV (Heart Rate Variability) is one of the most important recovery markers for para athletes. A higher HRV generally means better recovery readiness. Connect your smartwatch to track this in real-time alongside your session data. Aim for consistency rather than single-day peaks.';
  }

  if (msg.includes('spo2') || msg.includes('oxygen') || msg.includes('blood oxygen')) {
    return 'SpO₂ is your blood oxygen saturation. For para athletes, values below 94% during or after training warrant attention. If you consistently see low SpO₂, discuss with your medical support team. Connect your smartwatch under Health Monitor to track this.';
  }

  if (msg.includes('injury') || msg.includes('risk') || msg.includes('rsi')) {
    if (!lastSession) return 'Upload a training video to get your injury risk assessment. We analyse 14+ biomechanical markers to flag potential overuse or technique risks.';
    const riskCard = lastSession.metricCards?.find((c: any) => c.id === 'p12_rsi_risk_level');
    const risk = riskCard?.value ?? 'unknown';
    return `Based on your latest session, your RSI risk level is **${risk}**. ${risk === 'LOW' ? '✅ Good news — your risk markers look healthy! Keep your technique consistent.' : risk === 'MED' ? '⚠️ Moderate risk detected. Consider increasing recovery time and monitoring fatigue signals.' : '🔴 High risk flagged. Please discuss with your coach or physio before your next high-intensity session.'}`;
  }

  if (msg.includes('propulsion') || msg.includes('push') || msg.includes('wheelchair')) {
    return 'For wheelchair athletes, propulsion efficiency is critical. Key metrics we track: push frequency, symmetry between left/right sides, and rim speed. Asymmetric propulsion (>10% difference) is the most common technique issue and can lead to shoulder overuse injuries.';
  }

  if (msg.includes('session') || msg.includes('sessions') || msg.includes('history')) {
    if (sessions.length === 0) return 'You haven\'t analysed any sessions yet. Upload a training video from the Analyse tab to get started!';
    return `You have **${sessions.length}** analysed session${sessions.length > 1 ? 's' : ''} on record. Your most recent was on **${lastSession.date}** (${lastSession.sport?.replace(/_/g, ' ')}). View the full history from the History tab.`;
  }

  if (msg.includes('video') || msg.includes('session request') || msg.includes('coach session') || msg.includes('live')) {
    return 'You can request 1-on-1 live video sessions with your connected coach through the Video Sessions screen. Your coach can accept, share a meet link, and even record the session for later review. Find it under your profile or via the home screen quick actions.';
  }

  if (msg.includes('smartwatch') || msg.includes('watch') || msg.includes('wearable')) {
    return 'Connect your smartwatch via the Health Monitor screen to track HRV, heart rate, SpO₂, stress score, and activity data. This health data is combined with your video analysis for a more complete performance picture — especially important for para athletes where recovery metrics are often under-monitored.';
  }

  if (msg.includes('coach') || msg.includes('connect')) {
    return 'You can connect with coaches and scouts through the Connect tab. Once a coach accepts your request, you can message them directly, request live video sessions, and they\'ll be able to see your full analysis dashboard to give targeted feedback.';
  }

  if (msg.includes('improve') || msg.includes('tips') || msg.includes('advice')) {
    if (!lastSession) return 'Upload a training video first and I\'ll give you personalised improvement tips based on your actual biomechanics data!';
    return `Based on your latest session, here are my top recommendations:\n\n1. **Consistency** — try to analyse sessions at least once a week\n2. **Recovery** — connect your smartwatch to monitor HRV and avoid overtraining\n3. **Technique** — review the coach feedback in your dashboard\n4. **Symmetry** — watch for left-right imbalances in your propulsion metrics\n\nWant more specific advice? Ask me about any particular metric!`;
  }

  if (msg.includes('what can you do') || msg.includes('help') || msg.includes('what do you know')) {
    return `I can help you with:\n\n• 📊 **Performance** — explain your session scores and metrics\n• 🏥 **Health** — interpret HRV, SpO₂, heart rate, stress\n• ⚠️ **Injury Risk** — explain RSI and biomechanical risk signals\n• 🏋️ **Training** — give sport-specific improvement tips\n• 📹 **Sessions** — guide you through video sessions and analysis\n• 🔗 **Connections** — help you connect with coaches & scouts\n\nJust ask me anything!`;
  }

  const fallbacks = [
    'That\'s a great question! For the most accurate answer, I recommend discussing this with your coach through the messaging feature. Is there a specific metric I can explain?',
    'I\'m still learning more about that area. In the meantime, your session dashboard has detailed metric explanations — tap any metric card to expand it. Anything else I can help with?',
    'Great question. Could you be more specific? For example, are you asking about a particular metric, training aspect, or feature of the app?',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What\'s my injury risk?',
  'Explain my latest score',
  'How do I improve propulsion?',
  'What is HRV?',
  'How to request a live session?',
];

export default function AIChat() {
  const router   = useRouter();
  const userId   = useAuthStore(s => s.userId);
  const userName = useAuthStore(s => s.userName);
  const listRef  = useRef<FlatList>(null);
  const dotAnim  = useRef(new Animated.Value(0)).current;

  const [messages,  setMessages]  = useState<AIChatMessage[]>([]);
  const [draft,     setDraft]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const [sessions,  setSessions]  = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      athleteService.getSessions(userId).then(setSessions).catch(() => {});
    }
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi${userName ? ` ${userName.split(' ')[0]}` : ''}! 👋 I'm your ParaSync AI assistant. Ask me anything about your performance, metrics, injury risk, or how to use the app.`,
      timestamp: new Date().toISOString(),
    }]);
  }, [userId, userName]);

  // Animated dots while AI is "thinking"
  useEffect(() => {
    if (!thinking) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [thinking]);

  const sendMessage = useCallback(async (text: string) => {
    const body = text.trim();
    if (!body || thinking) return;
    setDraft('');
    const userMsg: AIChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: body,
      timestamp: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    setThinking(true);

    // Simulate AI "thinking" delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const reply = generateAIResponse(body, { sessions, userName });
    const aiMsg: AIChatMessage = {
      id: `a_${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    };
    setMessages(m => [...m, aiMsg]);
    setThinking(false);
  }, [thinking, sessions, userName]);

  return (
    <Screen hasOrbs={false}>
      <Topbar
        title="ParaSync AI"
        onBack={() => router.back()}
        right={
          <View style={styles.aiBadge}>
            <View style={styles.aiBadgeDot} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        }
      />
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
          ListFooterComponent={
            thinking ? (
              <View style={[styles.bubbleRow]}>
                <View style={[styles.bubble, styles.bubbleAI, styles.thinkingBubble]}>
                  <View style={styles.dots}>
                    {[0, 1, 2].map(i => (
                      <Animated.View
                        key={i}
                        style={[styles.dot, { opacity: dotAnim, transform: [{ translateY: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={12} color={Colors.cyan} />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                  <Text style={styles.bubbleText}>{item.content}</Text>
                  <Text style={styles.bubbleTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* ── Suggestions ── */}
        {messages.length <= 1 && !thinking && (
          <View style={styles.suggestions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => sendMessage(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Input ── */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask ParaSync AI..."
            placeholderTextColor={Colors.t3}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(draft)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || thinking) && { opacity: 0.4 }]}
            onPress={() => sendMessage(draft)}
            disabled={!draft.trim() || thinking}
          >
            <Ionicons name="send" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}




const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 10, flexGrow: 1 },

  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.cyan + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.cyan + '40' },
  aiBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  aiBadgeText: { color: Colors.cyan, fontSize: 11, fontWeight: '800' },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  bubbleRowUser: { justifyContent: 'flex-end' },

  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.cyan + '20', borderWidth: 1, borderColor: Colors.cyan + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },

  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI:   { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.cyan + '20', borderWidth: 1, borderColor: Colors.cyan + '40', borderBottomRightRadius: 4 },

  bubbleText: { color: '#fff', fontSize: 13, lineHeight: 20 },
  bubbleTime: { color: Colors.t3, fontSize: 9, marginTop: 6, alignSelf: 'flex-end' },

  thinkingBubble: { paddingVertical: 14 },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.cyan },

  suggestions: { paddingHorizontal: 16, paddingBottom: 8 },
  suggestionChip: { backgroundColor: Colors.card2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  suggestionText: { color: Colors.t2, fontSize: 12 },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.card2, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, color: '#fff', fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
});
