import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

/**
 * Athlete-facing AI feedback — LLM-generated (Gemini) when GEMINI_API_KEY is
 * configured on the pipeline, rule-based otherwise (see
 * pipeline/src/llm/gemini_client.py generate_feedback() /
 * pipeline/src/pipeline/adapter.py build_feedback()). Either way the shape
 * is identical, so this component doesn't need to know which one produced it.
 * A standalone card, never merged into the metrics grid, so it stays a
 * single clear read rather than competing with the numbers for attention.
 */
export default function AthleteFeedbackCard({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" size={16} color={Colors.cyan} />
        <Text style={styles.title}>AI Feedback</Text>
      </View>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { color: Colors.t2, fontSize: 13, lineHeight: 20 },
});
