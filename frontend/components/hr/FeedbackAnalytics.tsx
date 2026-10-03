"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { GlassPanel, IconChip, type Tone } from "@/components/ui/premium";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

interface NegativeExample {
  id: string;
  question: string;
  rating: string;
  confidence_score?: number | null;
  confidence_level?: string | null;
  diagnosis: string;
  created_at: string;
}

interface FeedbackAnalysis {
  total_feedback: number;
  positive: number;
  negative: number;
  negative_rate: number;
  negative_examples: NegativeExample[];
  recommended_next_step?: string;
}

interface FallbackStats {
  total: number;
  resolved: number;
  escalated: number;
  open: number;
}

interface FeedbackAnalyticsProps {
  /**
   * Optional — proxy data used if the analytics endpoint is unavailable.
   * Values are derived from HR request states.
   */
  fallbackStats?: FallbackStats;
}

export default function FeedbackAnalytics({
  fallbackStats,
}: FeedbackAnalyticsProps) {
  const [data, setData] = useState<FeedbackAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProxy, setIsProxy] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Authentication session expired.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/feedback/analysis`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        /* 404 → fall back to proxy */
        if (response.status === 404 && fallbackStats) {
          setData(buildProxy(fallbackStats));
          setIsProxy(true);
          setLoading(false);
          return;
        }
        throw new Error(
          result?.detail || "Unable to retrieve feedback analytics.",
        );
      }

      setData(result);
      setIsProxy(false);
    } catch (err) {
      /* Network error or unreachable backend — proxy fallback too */
      if (fallbackStats) {
        setData(buildProxy(fallbackStats));
        setIsProxy(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load feedback analytics.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackStats]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const interval = setInterval(loadAnalytics, 30_000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  useEffect(() => {
    const onFocus = () => loadAnalytics();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadAnalytics();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadAnalytics]);

  if (loading) {
    return (
      <GlassPanel tone={3} padded={false}>
        <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-1 shrink-0 rounded-full"
              style={{ background: "var(--accent-3)" }}
            />
            <div className="animate-pulse space-y-1.5">
              <div className="h-4 w-44 rounded bg-[var(--surface-hover)]/60" />
              <div className="h-3 w-64 rounded bg-[var(--surface-hover)]/60" />
            </div>
          </div>
        </div>
        <div className="animate-pulse space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]/60" />
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]/60" />
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]/60" />
          </div>
          <div className="h-32 rounded-xl bg-[var(--surface-hover)]/60" />
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel tone={1} padded={false}>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
              }}
            >
              <XCircle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[15px] font-medium"
                style={{ color: "var(--danger)" }}
              >
                Feedback analytics unavailable
              </p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">{error}</p>
              <button
                type="button"
                onClick={loadAnalytics}
                className="
                  mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg
                  border px-3 text-[12.5px] font-medium
                "
                style={{
                  borderColor: "var(--danger)",
                  color: "var(--danger)",
                }}
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (!data) return null;

  const positiveRate =
    data.total_feedback > 0
      ? Math.round((data.positive / data.total_feedback) * 100)
      : 0;

  const negativeRate = Math.round(data.negative_rate * 100);

  return (
    <div className="relative">
      {/* Live / proxy pill */}
      <span
        className="
          absolute -top-3 right-5 z-10 inline-flex items-center gap-1.5
          rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase
          backdrop-blur-xl
        "
        style={{
          background: isProxy ? "var(--warning-soft)" : "var(--success-soft)",
          color: isProxy ? "var(--warning)" : "var(--success)",
          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)",
        }}
      >
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{
            background: isProxy ? "var(--warning)" : "var(--success)",
          }}
        />
        {isProxy ? "Estimated" : "Live"}
      </span>

      <GlassPanel
        tone={3}
        title="AI feedback analytics"
        subtitle={
          isProxy
            ? "Proxy estimate derived from HR ticket outcomes"
            : "Auto-updates every 30 seconds while the tab is open"
        }
        padded={false}
      >
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <Metric
            tone={3}
            icon={<MessageSquareText size={16} />}
            label="Total feedback"
            value={data.total_feedback}
            description="Responses received"
          />
          <Metric
            tone={4}
            icon={<CheckCircle2 size={16} />}
            label="Positive"
            value={`${positiveRate}%`}
            description={`${data.positive} positive responses`}
          />
          <Metric
            tone={5}
            icon={<XCircle size={16} />}
            label="Negative"
            value={`${negativeRate}%`}
            description={`${data.negative} negative responses`}
          />
        </div>

        <div className="border-t border-[var(--border)] p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[14px] font-semibold tracking-[-0.005em]">
              Feedback quality
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              {isProxy
                ? "Approximated from resolved vs escalated HR tickets."
                : "Positive versus negative responses across recorded AI interactions."}
            </p>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-[var(--surface-hover)]/70">
            {data.total_feedback > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[var(--ease-out-soft)]"
                style={{
                  width: `${positiveRate}%`,
                  background:
                    "linear-gradient(90deg, var(--accent-4), var(--accent-3))",
                }}
              />
            )}
          </div>

          <div className="mt-2.5 flex justify-between text-[12px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent-4)" }}
              />
              {positiveRate}% positive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent-5)" }}
              />
              {negativeRate}% negative
            </span>
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[14px] font-semibold tracking-[-0.005em]">
              Negative feedback requiring review
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              Automatically classified using confidence and retrieval
              evidence.
            </p>
          </div>

          {data.negative_examples.length === 0 ? (
            <div
              className="
                flex flex-col items-center justify-center rounded-xl border
                border-dashed px-5 py-10 text-center
              "
              style={{ borderColor: "var(--border-strong)" }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-4-soft)] text-[var(--accent-4)]">
                <CheckCircle2 size={18} />
              </div>
              <p className="mt-3.5 text-[14px] font-medium">
                No negative feedback
              </p>
              <p className="mt-1 text-[12.5px] text-[var(--muted)]">
                {isProxy
                  ? "No escalated tickets to report."
                  : "There are currently no negative responses requiring review."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.negative_examples.map((item) => (
                <div
                  key={item.id}
                  className="
                    rounded-xl border p-4
                    border-[var(--border)]
                    bg-[var(--surface)]/40 backdrop-blur-xl
                  "
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-[13.5px] leading-6 font-medium">
                      {item.question}
                    </p>
                    <span
                      className="w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        background: "var(--warning-soft)",
                        color: "var(--warning)",
                      }}
                    >
                      {formatDiagnosis(item.diagnosis)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-[var(--muted)]">
                    {item.confidence_score != null && (
                      <span className="tabular-nums">
                        Confidence:{" "}
                        {Math.round(item.confidence_score * 100)}%
                      </span>
                    )}
                    {item.confidence_level && (
                      <span>Level: {item.confidence_level}</span>
                    )}
                    <span className="tabular-nums">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.recommended_next_step && (
          <div className="border-t border-[var(--border)] p-5 sm:p-6">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "var(--accent-3)",
                background: "var(--accent-3-soft)",
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={13} style={{ color: "var(--accent-3)" }} />
                <span
                  className="text-[10.5px] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: "var(--accent-3)" }}
                >
                  Recommended next step
                </span>
              </div>
              <p className="mt-2.5 text-[13.5px] leading-6 text-[var(--foreground)]">
                {data.recommended_next_step}
              </p>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

/* ================================================================
   PROXY BUILDER
================================================================ */

function buildProxy(stats: FallbackStats): FeedbackAnalysis {
  const denom = stats.resolved + stats.escalated;

  /* If nothing to base a rate on, assume healthy (85%) */
  const positiveRate = denom > 0 ? stats.resolved / denom : 0.85;

  const positive = stats.resolved;
  const negative = stats.escalated;
  const total = Math.max(1, positive + negative);

  return {
    total_feedback: total,
    positive,
    negative,
    negative_rate: negative / total,
    negative_examples: [],
    recommended_next_step:
      stats.open > 0
        ? `${stats.open} ticket${stats.open !== 1 ? "s" : ""} still open. Resolving them will likely improve team sentiment.`
        : "All tickets are resolved. Keep up the response quality.",
  };
}

/* ================================================================
   METRIC
================================================================ */

function Metric({
  label,
  value,
  description,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  tone: Tone;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        relative overflow-hidden rounded-xl border p-4
        border-[var(--border)]
        bg-[var(--surface)]/40 backdrop-blur-xl
      "
    >
      <div className="flex items-center gap-2.5">
        <IconChip tone={tone} size="sm">
          {icon}
        </IconChip>
        <span className="text-[10.5px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          {label}
        </span>
      </div>
      <div className="mt-3.5 text-[1.625rem] leading-none font-semibold tracking-[-0.035em] tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-[var(--muted)]">
        {description}
      </div>
    </div>
  );
}

function formatDiagnosis(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}