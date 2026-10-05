import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MetricCard as MCType } from "../../data/mock-sessions";
import { MetricCard } from "./MetricCard";
import { Colors } from "../../constants/colors";
interface Props { pillar?: string; title?: string; cards: MCType[]; accent?: string; }
export const PillarSection: React.FC<Props> = ({ pillar, title, cards, accent=Colors.cyan }) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <View style={[styles.dot,{backgroundColor:accent}]}/>
      <Text style={styles.title}>{title ?? pillar}</Text>
      <Text style={styles.count}>{cards.length}</Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      decelerationRate="fast"
      snapToInterval={160}
    >
      {cards.map(c=><MetricCard key={c.id} card={c} compact/>)}
    </ScrollView>
  </View>
);
const styles = StyleSheet.create({
  wrap:{ marginBottom:20 },
  header:{ flexDirection:"row", alignItems:"center", marginBottom:12 },
  dot:{ width:8, height:8, borderRadius:4, marginRight:10 },
  title:{ color:Colors.white, fontSize:15, fontWeight:"700", flex:1 },
  count:{ color:Colors.t3, fontSize:12, fontWeight:"600" },
  row:{ paddingRight:10 },
});

export default PillarSection;
