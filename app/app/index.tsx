import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { useAuthStore } from "../store/auth.store";
const { width: W } = Dimensions.get("window");
const ROLE_HOME: Record<string, string> = {
  athlete: "/(athlete)/home",
  coach: "/(coach)/home",
  scout: "/(scout)/home",
  federation: "/(federation)/dashboard",
};
export default function SplashScreen() {
  const router = useRouter();
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const role = useAuthStore(s => s.role);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dotAnims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  // If we already have a persisted session (restored from device storage),
  // skip straight to the role's home instead of showing the splash CTA.
  useEffect(() => {
    if (isLoggedIn && role && ROLE_HOME[role]) {
      router.replace(ROLE_HOME[role] as any);
    }
  }, [isLoggedIn, role]);

  useEffect(()=>{
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim,{toValue:1,duration:800,useNativeDriver:true}),
        Animated.timing(slideAnim,{toValue:0,duration:800,useNativeDriver:true}),
      ]),
      Animated.stagger(120, dotAnims.map(a=>Animated.loop(Animated.sequence([
        Animated.timing(a,{toValue:1,duration:400,useNativeDriver:true}),
        Animated.timing(a,{toValue:0,duration:400,useNativeDriver:true}),
      ])))),
    ]).start();
  },[]);
  return (
    <View style={styles.container}>
      <View style={styles.orbCyan}/>
      <View style={styles.orbPurple}/>
      <Animated.View style={[styles.content,{opacity:fadeAnim,transform:[{translateY:slideAnim}]}]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoRing}>
            <Text style={styles.logoText}>PS</Text>
          </View>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.titlePara}>Para</Text>
          <Text style={styles.titleSync}>Sync</Text>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
        </View>
        <Text style={styles.subtitle}>BIOMECHANICAL ANALYSIS ENGINE</Text>
        <Text style={styles.desc}>Advanced AI platform for para-athletes.{"\n"}Measure. Analyse. Improve.</Text>
        <View style={styles.dots}>
          {dotAnims.map((a,i)=>(
            <Animated.View key={i} style={[styles.dot,{opacity:a,backgroundColor: i===0?Colors.cyan:i===1?Colors.purple:Colors.blue}]}/>
          ))}
        </View>
        <TouchableOpacity style={[styles.cta, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]} onPress={()=>router.replace("/(auth)/role-select")} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.bg} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn} onPress={()=>router.push("/(auth)/login")}>
          <Text style={styles.loginText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
        <Text style={styles.team}>Team Code Blooded · NIT Rourkela</Text>
        <Text style={styles.samsung}>Samsung Solve For Tomorrow 2026 — Top 100</Text>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:Colors.bg1, justifyContent:"center", alignItems:"center" },
  orbCyan:{ position:"absolute", top:-60, left:-80, width:300, height:300, borderRadius:150, backgroundColor:"rgba(0,212,255,0.12)" },
  orbPurple:{ position:"absolute", bottom:-80, right:-60, width:260, height:260, borderRadius:130, backgroundColor:"rgba(168,85,247,0.10)" },
  content:{ alignItems:"center", paddingHorizontal:32 },
  logoWrap:{ marginBottom:28 },
  logoRing:{ width:80, height:80, borderRadius:40, borderWidth:2.5, borderColor:Colors.cyan, backgroundColor:"rgba(0,212,255,0.1)", justifyContent:"center", alignItems:"center" },
  logoText:{ color:Colors.cyan, fontSize:26, fontWeight:"900", letterSpacing:2 },
  titleRow:{ flexDirection:"row", alignItems:"center", marginBottom:8 },
  titlePara:{ color:Colors.white, fontSize:36, fontWeight:"900" },
  titleSync:{ color:Colors.cyan, fontSize:36, fontWeight:"900" },
  aiBadge:{ backgroundColor:Colors.cyan, borderRadius:8, paddingHorizontal:7, paddingVertical:2, marginLeft:8 },
  aiBadgeText:{ color:Colors.bg, fontSize:11, fontWeight:"800" },
  subtitle:{ color:Colors.t2, fontSize:11, letterSpacing:3, marginBottom:20 },
  desc:{ color:Colors.t2, fontSize:14, textAlign:"center", lineHeight:22, marginBottom:28 },
  dots:{ flexDirection:"row", marginBottom:40, gap:8 },
  dot:{ width:8, height:8, borderRadius:4 },
  cta:{ width:W-64, backgroundColor:Colors.cyan, borderRadius:14, paddingVertical:16, alignItems:"center", marginBottom:14 },
  ctaText:{ color:Colors.bg, fontSize:16, fontWeight:"800" },
  loginBtn:{ marginBottom:32 },
  loginText:{ color:Colors.t2, fontSize:13 },
  team:{ color:Colors.t3, fontSize:11, letterSpacing:0.5 },
  samsung:{ color:Colors.t3, fontSize:10, marginTop:4 },
});
