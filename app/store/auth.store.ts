import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RoleId = "athlete"|"coach"|"scout"|"federation"|"guest"|null;
interface User { id?: string; userId?: string; userName?: string; name?: string; email?: string; role: RoleId; [key: string]: any; }
interface AuthState {
  role: RoleId; userId: string|null; userName: string|null;
  isLoggedIn: boolean; user: User|null;
  setRole:(r:RoleId)=>void;
  login:(u:User)=>void;
  logout:()=>void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role:null, userId:null, userName:null, isLoggedIn:false, user:null,
      setRole:(role)=>set({role}),
      login:(user)=>set({role:user.role, userId:user.userId ?? user.id ?? null, userName:user.userName ?? user.name ?? null, isLoggedIn:true, user}),
      logout:()=>set({role:null, userId:null, userName:null, isLoggedIn:false, user:null}),
    }),
    {
      name: "parasync-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
