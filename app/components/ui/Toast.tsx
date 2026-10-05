import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide?: () => void;
}

const TYPE_COLORS: Record<ToastType, string> = {
  success: Colors.green,
  error: Colors.red,
  warn: Colors.orange,
  info: Colors.cyan,
};

export default function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
          ]).start(() => onHide?.());
        }, 2500);
      });
    }
  }, [visible]);

  const accent = TYPE_COLORS[type];

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }], borderColor: accent + '50' }]}>
      <TouchableOpacity onPress={onHide}>
        <Text style={[styles.msg, { color: accent }]}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  msg: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
