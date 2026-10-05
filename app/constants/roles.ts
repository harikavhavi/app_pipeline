import { Colors } from "./colors";
export type RoleId = "athlete" | "coach" | "scout" | "federation" | "guest";
export const ROLES: Array<{
  id: RoleId; label: string; desc: string; monogram: string; accent: string;
}> = [
  { id:"athlete",    label:"Athlete",     desc:"Upload videos & track your biomechanics", monogram:"AT", accent:Colors.cyan },
  { id:"coach",      label:"Coach",       desc:"Monitor your squad & assign drills",        monogram:"CO", accent:Colors.blue },
  { id:"scout",      label:"Scout",       desc:"Discover & connect with para-athletes",     monogram:"SC", accent:Colors.purple },
  { id:"federation", label:"Federation",  desc:"Manage your national registry & events",    monogram:"FD", accent:Colors.orange },
];
