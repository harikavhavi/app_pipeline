import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLS = 12;
const ROWS = 20;
const DOT_SIZE = 2;
const GAP_X = width / COLS;
const GAP_Y = height / ROWS;

export default function GridBackground() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const dots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dots.push({ x: c * GAP_X + GAP_X / 2, y: r * GAP_Y + GAP_Y / 2, key: `${r}-${c}` });
    }
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      {dots.map(d => (
        <View
          key={d.key}
          style={[
            styles.dot,
            { left: d.x - DOT_SIZE / 2, top: d.y - DOT_SIZE / 2 },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});
