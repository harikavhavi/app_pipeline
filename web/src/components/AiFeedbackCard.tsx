"use client";

import { Card } from "@/components/ui";
import { IconChart } from "@/components/icons";

/**
 * Renders the scout/coach feedback text stored on a session (session.feedback).
 * This is LLM-generated (Gemini) when GEMINI_API_KEY is configured on the
 * pipeline backend, and falls back to rule-based template text otherwise —
 * see pipeline/src/llm/gemini_client.py and pipeline/src/pipeline/adapter.py.
 * Either way the shape is identical, so this component doesn't need to know
 * which one produced it.
 */
export default function AiFeedbackCard({
  feedback,
}: {
  feedback?: { scout_feedback?: string; coach_feedback?: string };
}) {
  if (!feedback?.scout_feedback && !feedback?.coach_feedback) return null;

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <IconChart size={16} className="text-cyan" />
        <h3 className="text-sm font-bold">AI Feedback</h3>
      </div>
      <div className="space-y-4">
        {feedback.scout_feedback && (
          <div>
            <div className="text-[11px] font-semibold text-t3 uppercase tracking-wide mb-1">For Scouts</div>
            <p className="text-sm text-t2 leading-relaxed">{feedback.scout_feedback}</p>
          </div>
        )}
        {feedback.coach_feedback && (
          <div>
            <div className="text-[11px] font-semibold text-t3 uppercase tracking-wide mb-1">For Coaches</div>
            <p className="text-sm text-t2 leading-relaxed">{feedback.coach_feedback}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
