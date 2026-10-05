import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ScoreColor, Colors } from "../../constants/colors";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
interface Props { score: number; size?: number; strokeWidth?: number; }
export const ScoreRing: React.FC<Props> = ({ score, size=72, strokeWidth=5 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const color = ScoreColor(score);
  const R = (size-strokeWidth)/2;
  const C = 2*Math.PI*R;
  useEffect(()=>{
    Animated.timing(anim,{toValue:score/100,duration:1400,useNativeDriver:false}).start();
  },[score]);
  const dash = anim.interpolate({inputRange:[0,1],outputRange:[0,C]});
  return (
    <View style={{width:size,height:size,alignItems:"center",justifyContent:"center"}}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size/2} cy={size/2} r={R} stroke={Colors.border2} strokeWidth={strokeWidth} fill="none"/>
        <AnimatedCircle
          cx={size/2} cy={size/2} r={R} stroke={color}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={C} strokeDashoffset={dash as any}
          strokeLinecap="round" rotation={-90} origin={`${size/2},${size/2}`}
        />
      </Svg>
      <Text style={[styles.score,{color,fontSize:Math.max(10, Math.round(size*0.27))}]}>{score}</Text>
    </View>
  );
};
const styles = StyleSheet.create({ score:{ fontWeight:"800" } });

export default ScoreRing;
