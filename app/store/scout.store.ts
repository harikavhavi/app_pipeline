import { create } from "zustand";
import { Athlete } from "../data/mock-athletes";
interface ScoutState {
  shortlist: Athlete[];
  browseFilters: { sport:string|null; ipcClass:string|null; state:string|null; verified:boolean };
  addToShortlist:(a:Athlete)=>void;
  removeFromShortlist:(id:string)=>void;
  setFilter:(k:string, v:any)=>void;
}
export const useScoutStore = create<ScoutState>((set)=>({
  shortlist:[],
  browseFilters:{ sport:null, ipcClass:null, state:null, verified:false },
  addToShortlist:(a)=>set(s=>({ shortlist:[...s.shortlist.filter(x=>x.id!==a.id),a] })),
  removeFromShortlist:(id)=>set(s=>({ shortlist:s.shortlist.filter(x=>x.id!==id) })),
  setFilter:(k,v)=>set(s=>({ browseFilters:{...s.browseFilters,[k]:v} })),
}));
