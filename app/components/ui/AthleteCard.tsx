import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Athlete } from "../../data/mock-athletes";
import { Colors } from "../../constants/colors";
import { getInitials } from "../../utils/initials";
interface Props { athlete:Athlete; onPress?:()=>void; accent?:string; }
export const AthleteCard: React.FC<Props> = ({ athlete, onPress, accent=Colors.cyan }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.avatar,{backgroundColor:`${accent}22`}]}>
      <Text style={[styles.initials,{color:accent}]}>{getInitials(athlete.name)}</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>{athlete.name}</Text>
      <Text style={styles.sub}>{athlete.sportLabel} · {athlete.ipcClass}</Text>
      <Text style={styles.state}>{athlete.state}</Text>
    </View>
    <View style={styles.right}>
      <Text style={[styles.score,{color:accent}]}>{athlete.avgScore}</Text>
      <Text style={styles.scoreLabel}>AVG</Text>
      {athlete.verified && <Text style={styles.verified}>✓</Text>}
    </View>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  card:{ flexDirection:"row", alignItems:"center", backgroundColor:Colors.card2, borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:Colors.border },
  avatar:{ width:46, height:46, borderRadius:12, justifyContent:"center", alignItems:"center", marginRight:12 },
  initials:{ fontSize:15, fontWeight:"800" },
  info:{ flex:1 },
  name:{ color:Colors.white, fontSize:15, fontWeight:"700" },
  sub:{ color:Colors.t2, fontSize:12, marginTop:2 },
  state:{ color:Colors.t3, fontSize:11, marginTop:1 },
  right:{ alignItems:"center" },
  score:{ fontSize:20, fontWeight:"800" },
  scoreLabel:{ color:Colors.t3, fontSize:9, letterSpacing:1 },
  verified:{ color:Colors.green, fontSize:12, marginTop:2 },
});

export default AthleteCard;
