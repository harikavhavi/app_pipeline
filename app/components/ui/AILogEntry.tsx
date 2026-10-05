import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
interface Props { msg:string; type:"good"|"warn"; }
export const AILogEntry: React.FC<Props> = ({ msg, type }) => (
  <View style={[styles.row, type==="warn" && styles.rowWarn]}>
    <View style={[styles.dot, {backgroundColor: type==="good" ? Colors.green : Colors.orange}]}/>
    <Text style={styles.msg}>{msg}</Text>
  </View>
);
const styles = StyleSheet.create({
  row:{ flexDirection:"row", alignItems:"flex-start", paddingVertical:8, paddingHorizontal:12, borderRadius:10, backgroundColor:Colors.card, marginBottom:6, borderWidth:1, borderColor:Colors.border },
  rowWarn:{ borderColor:"rgba(249,115,22,0.3)" },
  dot:{ width:7, height:7, borderRadius:3.5, marginTop:4, marginRight:10 },
  msg:{ color:Colors.t1, fontSize:13, lineHeight:19, flex:1 },
});

export default AILogEntry;
