"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function FeedbackAnalytics() {
  const [data, setData] = useState<FeedbackAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
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
        throw new Error(
          result?.detail ||
            "Unable to retrieve feedback analytics.",
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load feedback analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="animate-pulse space-y-5">
          <div className="h-5 w-44 rounded bg-[var(--surface-hover)]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
            <div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
          </div>
          <div className="h-32 rounded-xl bg-[var(--surface-hover)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="text-sm font-medium text-red-600">
          Feedback analytics unavailable
        </div>

        <p className="mt-1 text-sm text-red-600/80">
          {error}
        </p>

        <button
          type="button"
          onClick={loadAnalytics}
          className="mt-4 rounded-xl border border-red-500/20 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/5"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const positiveRate =
    data.total_feedback > 0
      ? Math.round(
          (data.positive / data.total_feedback) * 100,
        )
      : 0;

  const negativeRate = Math.round(
    data.negative_rate * 100,
  );

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">
            AI feedback analytics
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Monitor answer quality and identify areas where
            HR365 needs improvement.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="w-fit rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <Metric
          label="Total feedback"
          value={data.total_feedback}
          description="Responses received"
        />

        <Metric
          label="Positive"
          value={`${positiveRate}%`}
          description={`${data.positive} positive responses`}
        />

        <Metric
          label="Negative"
          value={`${negativeRate}%`}
          description={`${data.negative} negative responses`}
        />
      </div>

      <div className="border-t border-[var(--border)] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Feedback quality
          </h3>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Positive versus negative responses across the
            recorded AI interactions.
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-hover)]">
          {data.total_feedback > 0 && (
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{
                width: `${positiveRate}%`,
              }}
            />
          )}
        </div>

        <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
          <span>{positiveRate}% positive</span>
          <span>{negativeRate}% negative</span>
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Negative feedback requiring review
          </h3>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Automatically classified using confidence and
            retrieval evidence.
          </p>
        </div>

        {data.negative_examples.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-5 text-center">
            <div className="text-sm font-medium text-[var(--foreground)]">
              No negative feedback
            </div>

            <p className="mt-1 text-xs text-[var(--muted)]">
              There are currently no negative responses requiring
              review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.negative_examples.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-medium leading-6 text-[var(--foreground)]">
                    {item.question}
                  </p>

                  <span className="w-fit shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    {formatDiagnosis(item.diagnosis)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                  {item.confidence_score != null && (
                    <span>
                      Confidence:{" "}
                      {Math.round(
                        item.confidence_score * 100,
                      )}
                      %
                    </span>
                  )}

                  {item.confidence_level && (
                    <span>
                      Level: {item.confidence_level}
                    </span>
                  )}

                  <span>
                    {new Date(
                      item.created_at,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.recommended_next_step && (
        <div className="border-t border-[var(--border)] p-5">
          <div className="rounded-xl bg-[var(--surface-hover)]/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Recommended next step
            </div>

            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {data.recommended_next_step}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <div className="text-xs text-[var(--muted)]">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </div>

      <div className="mt-1 text-xs text-[var(--muted)]">
        {description}
      </div>
    </div>
  );
}

function formatDiagnosis(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}