import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { ROLES } from "../../constants/roles";
import { RoleCard } from "../../components/auth/RoleCard";
import { OrbBackground } from "../../components/layout/OrbBackground";
import { useAuthStore } from "../../store/auth.store";
const { width:W } = Dimensions.get("window");
export default function RoleSelectScreen() {
  const router = useRouter();
  const setRole = useAuthStore(s=>s.setRole);
  const [selected, setSelected] = useState<string|null>(null);
  const onContinue = () => {
    if (!selected) return;
    setRole(selected as any);
    router.push(`/(auth)/signup/${selected}` as any);
  };
  return (
    <View style={styles.container}>
      <OrbBackground/>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}><Text style={styles.logoP}>Para</Text><Text style={styles.logoS}>Sync</Text></Text>
          <Text style={styles.tagline}>AI Para-Athlete Analysis Platform</Text>
        </View>
        <Text style={styles.prompt}>Select your role</Text>
        <View style={styles.grid}>
          {ROLES.map(role=>(
            <View key={role.id} style={styles.gridCell}>
              <RoleCard {...role} selected={selected===role.id} onPress={()=>setSelected(role.id)}/>
            </View>
          ))}
        </View>
        {selected && (
          <TouchableOpacity style={[styles.cta,{backgroundColor:ROLES.find(r=>r.id===selected)?.accent??Colors.cyan, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6}]} onPress={onContinue}>
            <Text style={styles.ctaText}>Continue as {ROLES.find(r=>r.id===selected)?.label}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.bg} />
          </TouchableOpacity>
        )}
        <View style={styles.divider}><View style={styles.divLine}/><Text style={styles.divText}>or</Text><View style={styles.divLine}/></View>
        <TouchableOpacity style={[styles.guestBtn, { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6 }]} onPress={()=>{ setRole("guest"); router.replace("/(guest)/landing"); }}>
          <Text style={styles.guestText}>Continue as Guest</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.t2} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.loginBtn, { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6 }]} onPress={()=>router.push("/(auth)/login")}>
          <Ionicons name="arrow-back" size={14} color={Colors.t2} />
          <Text style={styles.loginText}>Already registered? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:Colors.bg1 },
  scroll:{ paddingHorizontal:24, paddingTop:60, paddingBottom:40 },
  header:{ alignItems:"center", marginBottom:32 },
  logo:{ fontSize:32, fontWeight:"900" },
  logoP:{ color:Colors.white },
  logoS:{ color:Colors.cyan },
  tagline:{ color:Colors.t2, fontSize:13, marginTop:4 },
  prompt:{ color:Colors.t2, fontSize:13, fontWeight:"600", letterSpacing:0.5, marginBottom:16 },
  grid:{ flexDirection:"row", flexWrap:"wrap", marginHorizontal:-6 },
  gridCell:{ width:"50%", paddingHorizontal:6, marginBottom:12 },
  cta:{ borderRadius:14, paddingVertical:16, alignItems:"center", marginTop:8, marginBottom:16 },
  ctaText:{ color:Colors.bg, fontSize:16, fontWeight:"800" },
  divider:{ flexDirection:"row", alignItems:"center", marginVertical:16 },
  divLine:{ flex:1, height:1, backgroundColor:Colors.border },
  divText:{ color:Colors.t3, fontSize:12, marginHorizontal:12 },
  guestBtn:{ borderWidth:1, borderColor:Colors.border2, borderRadius:14, paddingVertical:14, alignItems:"center", marginBottom:16 },
  guestText:{ color:Colors.t2, fontSize:15, fontWeight:"600" },
  loginBtn:{ alignItems:"center" },
  loginText:{ color:Colors.t2, fontSize:13 },
});
