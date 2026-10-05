import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
interface Props { label:string; value:string; onChangeText:(v:string)=>void; placeholder?:string; secureTextEntry?:boolean; keyboardType?:any; autoCapitalize?:any; accent?:string; }
export const FieldInput: React.FC<Props> = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType="default", autoCapitalize="sentences", accent=Colors.cyan }) => {
  const [focused, setFocused] = React.useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused&&{borderColor:accent}]}>
        <TextInput
          style={styles.input} value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor={Colors.t3}
          secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize={autoCapitalize}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={()=>setSecure(s=>!s)} style={styles.eye}>
            <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={18} color={Colors.t2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  wrap:{ marginBottom:16 },
  label:{ color:Colors.t2, fontSize:12, fontWeight:"600", marginBottom:6, letterSpacing:0.3 },
  inputWrap:{ flexDirection:"row", alignItems:"center", backgroundColor:Colors.card2, borderRadius:12, borderWidth:1, borderColor:Colors.border, paddingHorizontal:14 },
  input:{ flex:1, color:Colors.white, fontSize:15, paddingVertical:13 },
  eye:{ padding:4 },
});

export default FieldInput;
