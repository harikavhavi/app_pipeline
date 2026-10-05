import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MetricCard as MC } from "../../data/mock-sessions";
import { ScoreRing } from "./ScoreRing";
import { BarMetric } from "./BarMetric";
import { Colors, ScoreColor } from "../../constants/colors";
import { formatMetric, formatDelta } from "../../utils/formatMetric";
interface Props { card: MC; compact?: boolean; }
export const MetricCard: React.FC<Props> = ({ card, compact = false }) => {
  const { label, value, unit, score, higher_is_better, trend, trend_unit } = card;
  const trendColor = trend === null ? Colors.t3 : (higher_is_better ? (trend >= 0 ? Colors.green : Colors.red) : (trend <= 0 ? Colors.green : Colors.red));
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {compact ? (
        <>
          <View style={styles.compactTopRow}>
            <Text style={styles.label} numberOfLines={2}>{label}</Text>
            {score !== null && <ScoreRing score={score} size={34} strokeWidth={3.5} />}
          </View>
          <Text style={styles.valueCompact} numberOfLines={1} adjustsFontSizeToFit>{formatMetric(value, unit)}</Text>
          {trend !== null ? (
            <Text style={[styles.trend,{color:trendColor}]}>{formatDelta(trend,unit)}</Text>
          ) : (
            score !== null && <BarMetric score={score} height={3} style={{marginTop:8}}/>
          )}
        </>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.left}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{formatMetric(value, unit)}</Text>
              {trend !== null && (
                <Text style={[styles.trend,{color:trendColor}]}>{formatDelta(trend,unit)}</Text>
              )}
            </View>
            {score !== null && <ScoreRing score={score} size={60}/>}
          </View>
          {score !== null && <BarMetric score={score} height={3} style={{marginTop:10}}/>}
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  card:{ backgroundColor:Colors.card2, borderRadius:14, padding:14, borderWidth:1, borderColor:Colors.border, marginBottom:8 },
  cardCompact:{ width:150, marginBottom:0, marginRight:10, padding:12, justifyContent:"flex-start" },
  row:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  left:{ flex:1, marginRight:12 },
  label:{ color:Colors.t2, fontSize:11, fontWeight:"600", letterSpacing:0.4, marginBottom:4, textTransform:"uppercase" },
  value:{ color:Colors.white, fontSize:22, fontWeight:"800", marginBottom:2 },
  valueCompact:{ color:Colors.white, fontSize:19, fontWeight:"800", marginTop:8 },
  trend:{ fontSize:11, fontWeight:"600" },
  compactTopRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start" },
});

export default MetricCard;
