import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Colors } from "../../constants/colors";
interface Props { id:string; label:string; desc:string; monogram:string; accent:string; selected:boolean; onPress:()=>void; }
export const RoleCard: React.FC<Props> = ({ label, desc, monogram, accent, selected, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const onPressIn = ()=>Animated.spring(scaleAnim,{toValue:0.97,useNativeDriver:true}).start();
  const onPressOut = ()=>Animated.spring(scaleAnim,{toValue:1,useNativeDriver:true}).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.9}>
      <Animated.View style={[styles.card,selected&&{borderColor:accent,borderWidth:1.5,backgroundColor:`${accent}12`},{transform:[{scale:scaleAnim}]}]}>
        <View style={[styles.mono,{backgroundColor:`${accent}22`}]}>
          <Text style={[styles.monoText,{color:accent}]}>{monogram}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{desc}</Text>
        {selected && <View style={[styles.dot,{backgroundColor:accent}]}/>}
      </Animated.View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card:{ backgroundColor:Colors.card2, borderRadius:16, padding:18, borderWidth:1, borderColor:Colors.border, minHeight:120 },
  mono:{ width:44, height:44, borderRadius:12, justifyContent:"center", alignItems:"center", marginBottom:10 },
  monoText:{ fontSize:14, fontWeight:"800", letterSpacing:1 },
  label:{ color:Colors.white, fontSize:16, fontWeight:"700", marginBottom:4 },
  desc:{ color:Colors.t2, fontSize:12, lineHeight:17 },
  dot:{ width:8, height:8, borderRadius:4, position:"absolute", top:14, right:14 },
});
