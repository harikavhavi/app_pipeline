import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Outfit_400Regular, Outfit_700Bold, Outfit_900Black } from "@expo-google-fonts/outfit";
export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Outfit_400Regular, Outfit_700Bold, Outfit_900Black });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown:false, animation:"slide_from_right", contentStyle:{backgroundColor:"#000000"} }}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="(auth)"/>
        <Stack.Screen name="(athlete)"/>
        <Stack.Screen name="(coach)"/>
        <Stack.Screen name="(scout)"/>
        <Stack.Screen name="(federation)"/>
        <Stack.Screen name="(guest)"/>
      </Stack>
    </SafeAreaProvider>
  );
}
