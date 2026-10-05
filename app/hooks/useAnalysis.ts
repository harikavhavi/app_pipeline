import { useRef } from "react";
import { useAnalysisStore } from "../store/analysis.store";
import { analysisService } from "../services/analysis.service";
export const useAnalysis = () => {
  const { setStatus, setProgress, setLiveMetrics, setCurrentSession, reset } = useAnalysisStore();
  const run = async (payload:{videoUri:string;sport:string;ipcClass:string;athleteId:string}) => {
    reset();
    setStatus("processing");
    try {
      const session = await analysisService.runAnalysis(
        payload,
        (p)=>setProgress(p),
        (m)=>setLiveMetrics(m),
      );
      setCurrentSession(session);
      setStatus("complete");
      return session;
    } catch(e) {
      setStatus("error");
      throw e;
    }
  };
  return { run };
};
