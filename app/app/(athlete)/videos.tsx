import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import VideoThumb from '../../components/ui/VideoThumb';
import { Colors } from '../../constants/colors';
import { MOCK_SESSIONS } from '../../data/mock-sessions';

export default function Videos() {
  const router = useRouter();
  return (
    <Screen>
      <Topbar title="Video History" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MOCK_SESSIONS.map(s => (
          <VideoThumb
            key={s.id}
            video={{ id: s.id, filename: `session_${s.date.replace(/ /g, '_')}.mp4`, sport: s.sport, date: s.date, score: s.score, duration: s.duration }}
            onViewAnalysis={() => router.push('/(athlete)/dashboard')}
            onShare={() => {}}
            onDelete={() => {}}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ scroll: { padding: 20, paddingBottom: 48 } });
