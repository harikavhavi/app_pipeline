import { Platform } from "react-native";
import Constants from "expo-constants";

function resolveApiBase(): string {
  if (Platform.OS === "web") return "http://localhost:8000";
  // On a physical device (Expo Go), "localhost" refers to the phone itself, not
  // the dev machine — use the same LAN host Expo Go used to load this app.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;
  const host = hostUri?.split(":")?.[0];
  return host ? `http://${host}:8000` : "http://localhost:8000";
}

export const API_BASE = resolveApiBase();
export const api = {
  get: async (path:string)=>{ const r=await fetch(`${API_BASE}${path}`); return r.json(); },
  post: async (path:string, body:any, opts?:RequestInit)=>{
    const r=await fetch(`${API_BASE}${path}`,{ method:"POST", ...opts,
      headers:{ "Content-Type":"application/json", ...(opts?.headers??{}) },
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return r.json();
  },
};
