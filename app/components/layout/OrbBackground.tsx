import React, { useRef, useEffect } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { Colors } from "../../constants/colors";
const { width: W, height: H } = Dimensions.get("window");
const ORB_CONFIG = [
  { x:0.15*W, y:0.1*H,  size:280, color:"rgba(0,212,255,0.12)",  dx:0.06*W, dy:0.05*H },
  { x:0.7*W,  y:0.35*H, size:220, color:"rgba(168,85,247,0.10)", dx:-0.05*W, dy:0.04*H },
  { x:0.3*W,  y:0.7*H,  size:200, color:"rgba(59,130,246,0.09)", dx:0.04*W, dy:-0.06*H },
];
export const OrbBackground: React.FC = () => {
  const anims = useRef(ORB_CONFIG.map(()=>({ x:new Animated.Value(0), y:new Animated.Value(0) }))).current;
  useEffect(()=>{
    ORB_CONFIG.forEach((orb,i)=>{
      const loop = ()=>Animated.sequence([
        Animated.parallel([
          Animated.timing(anims[i].x,{toValue:orb.dx,duration:8000+i*1200,useNativeDriver:true}),
          Animated.timing(anims[i].y,{toValue:orb.dy,duration:10000+i*800,useNativeDriver:true}),
        ]),
        Animated.parallel([
          Animated.timing(anims[i].x,{toValue:0,duration:8000+i*1200,useNativeDriver:true}),
          Animated.timing(anims[i].y,{toValue:0,duration:10000+i*800,useNativeDriver:true}),
        ]),
      ]).start(({finished})=>{ if(finished) loop(); });
      loop();
    });
  },[]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ORB_CONFIG.map((orb,i)=>(
        <Animated.View key={i} style={[styles.orb,{
          left:orb.x-orb.size/2, top:orb.y-orb.size/2,
          width:orb.size, height:orb.size, backgroundColor:orb.color,
          transform:[{translateX:anims[i].x},{translateY:anims[i].y}],
        }]}/>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({ orb:{ position:"absolute", borderRadius:9999 } });
