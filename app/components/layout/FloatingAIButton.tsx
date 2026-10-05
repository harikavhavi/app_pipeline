/**
 * FloatingAIButton.tsx
 * Sparkle-star floating action button that opens the AI chatbot.
 * Sits in the bottom-right corner of every screen (above the tab bar).
 * Pulses gently to attract attention without being intrusive.
 */
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export const FloatingAIButton: React.FC = () => {
  const router    = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const rotAnim   = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    // Gentle pulse scale animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 1400, useNativeDriver: true }),
      ])
    );
    // Glow opacity cycle
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    // Slow star rotation
    const rotLoop = Animated.loop(
      Animated.timing(rotAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    );
    pulseLoop.start();
    glowLoop.start();
    rotLoop.start();
    return () => { pulseLoop.stop(); glowLoop.stop(); rotLoop.stop(); };
  }, []);



  const spin = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Glow ring behind the button */}
      <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/(athlete)/ai-chat' as any)}
          activeOpacity={0.85}
        >
          {/* Star sparkle icon — rotates */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const BTN = 52;
const GLOW = BTN + 20;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 76,   // above the tab bar
    right: 18,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: GLOW,
    height: GLOW,
  },
  glowRing: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    backgroundColor: Colors.cyan,
    // soft glow via shadow
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 0,
  },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    // Gradient-like: deep dark center with cyan/purple dual glow
    backgroundColor: '#0a0a1a',
    borderWidth: 1.5,
    borderColor: Colors.cyan + '80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    // Slight gradient feel via overlay
    overflow: 'hidden',
  },
});

export default FloatingAIButton;
