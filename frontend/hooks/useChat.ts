"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AskResponse,
  ChatMessage,
} from "@/types/assistant";

/* ================================================================
   LEAVE TYPES
================================================================ */

export interface LeavePreviewPayload {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

export interface LeavePreviewResponse {
  matched: boolean;
  action?: string | null;
  requires_confirmation?: boolean;
  ready?: boolean;
  missing_fields?: string[];
  message?: string;
  confirmation_text?: string;
  payload?: LeavePreviewPayload | null;
}

/* ================================================================
   LEAVE ACTION DETECTION
================================================================ */

/**
 * Only send messages to the leave-action endpoint when the user
 * is actually trying to perform a leave action.
 *
 * This is deliberately conservative.
 *
 * Questions such as:
 *   "What is the leave policy?"
 *   "How many days of leave can I take?"
 *   "What is my leave status?"
 *
 * must go through the normal HR assistant.
 */
function looksLikeLeaveAction(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return false;
  }

  const hasLeaveTerm =
    /\b(leave|leaves|vacation|time off)\b/.test(
      normalized,
    );

  if (!hasLeaveTerm) {
    return false;
  }

  /*
   * Explicit action phrases.
   */
  const actionPatterns = [
    /\bapply\s+(for\s+)?/,
    /\brequest\s+(for\s+)?/,
    /\bsubmit\s+(a\s+)?/,
    /\btake\s+(a\s+)?/,
    /\bbook\s+(a\s+)?/,
    /\bneed\s+(a\s+)?/,
    /\bwant\s+(to\s+)?(take|apply|request|use)/,
    /\bi\s+(want|need|would like)\s+(to\s+)?/,
    /\bput\s+in\s+(a\s+)?/,
    /\bfile\s+(a\s+)?/,
  ];

  const hasActionVerb = actionPatterns.some(
    (pattern) =>
      pattern.test(normalized),
  );

  if (!hasActionVerb) {
    return false;
  }

  /*
   * Questions should generally remain normal assistant queries.
   *
   * Example:
   * "Can I take leave?"
   *
   * This is asking about eligibility/policy rather than clearly
   * submitting a request.
   */
  const isQuestion =
    /^(what|how|why|when|where|who|can|could|would|should|is|are|do|does|did)\b/.test(
      normalized,
    );

  if (
    isQuestion &&
    !/\b(apply|submit|request|book|file)\b/.test(
      normalized,
    )
  ) {
    return false;
  }

  return true;
}

/* ================================================================
   HOOK
================================================================ */

export function useChat() {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [pendingLeave, setPendingLeave] =
    useState<LeavePreviewResponse | null>(
      null,
    );

  /* ================================================================
     FRIENDLY ERROR
  ================================================================ */

  function buildFriendlyError(
    value: unknown,
  ): string {
    if (
      value instanceof Error &&
      value.message
    ) {
      const message =
        value.message.toLowerCase();

      /*
       * Never expose raw infrastructure errors
       * to the employee.
       */

      if (
        message.includes("failed to fetch") ||
        message.includes("network") ||
        message.includes("503") ||
        message.includes("502") ||
        message.includes("504")
      ) {
        return "HR365 is taking a little longer to respond. Please try again in a moment.";
      }

      if (
        message.includes("401") ||
        message.includes("unauthorized") ||
        message.includes("authentication")
      ) {
        return "Your session needs to be refreshed. Please sign in again.";
      }

      if (
        message.includes("429") ||
        message.includes("rate limit")
      ) {
        return "HR365 is handling a high number of requests right now. Please try again shortly.";
      }

      /*
       * Avoid exposing backend implementation details.
       */
      if (
        message.includes("internal server error") ||
        message.includes("server error")
      ) {
        return "Something went wrong while processing your request. Please try again.";
      }

      /*
       * Keep legitimate user-facing API errors.
       */
      return value.message;
    }

    return "I couldn't process that request. Please try again.";
  }

  /* ================================================================
     SEND MESSAGE
  ================================================================ */

  async function sendMessage(
    question: string,
  ) {
    const trimmed =
      question.trim();

    if (
      !trimmed ||
      loading
    ) {
      return;
    }

    setError("");

    /*
     * A new message cancels any previous leave
     * confirmation state.
     */
    setPendingLeave(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages(
      (current) => [
        ...current,
        userMessage,
      ],
    );

    setLoading(true);

    try {
      /* ==========================================================
         1. LEAVE ACTION
         ========================================================== */

      if (
        looksLikeLeaveAction(
          trimmed,
        )
      ) {
        let leavePreview:
          | LeavePreviewResponse
          | null = null;

        try {
          leavePreview =
            await apiFetch<LeavePreviewResponse>(
              "/api/leaves/ai/preview",
              {
                method: "POST",
                body: JSON.stringify({
                  command: trimmed,
                }),
              },
            );
        } catch (previewError) {
          /*
           * A leave-action parsing failure should not break
           * the entire assistant.
           *
           * Fall through to normal /api/ask.
           */
          console.warn(
            "Leave action preview failed:",
            previewError,
          );

          leavePreview = null;
        }

        if (
          leavePreview?.matched
        ) {
          /*
           * Backend needs more information.
           */
          if (
            !leavePreview.ready ||
            !leavePreview.payload
          ) {
            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                leavePreview.message ||
                "I need a few more details before I can prepare the leave request.",
            };

            setMessages(
              (current) => [
                ...current,
                assistantMessage,
              ],
            );

            return;
          }

          /*
           * Ready for explicit confirmation.
           */
          setPendingLeave(
            leavePreview,
          );

          const previewText =
            leavePreview.confirmation_text ||
            leavePreview.message ||
            buildLeavePreviewMessage(
              leavePreview.payload,
            );

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: previewText,
            response:
              leavePreview as unknown as AskResponse,
          };

          setMessages(
            (current) => [
              ...current,
              assistantMessage,
            ],
          );

          return;
        }
      }

      /* ==========================================================
         2. NORMAL HR365 ASSISTANT
         ========================================================== */

      const response =
        await apiFetch<AskResponse>(
          "/api/ask",
          {
            method: "POST",
            body: JSON.stringify({
              question: trimmed,
            }),
          },
        );

      /*
       * Always render only the answer as the main assistant
       * content. Metadata stays attached to the message object
       * for optional UI components.
       */
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        response,
      };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      );
    } catch (err) {
      const friendly =
        buildFriendlyError(err);

      setError("");

      /*
       * Render the error as a proper assistant message
       * rather than a raw red error box.
       */
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: friendly,
      };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================================================================
     CONFIRM LEAVE
  ================================================================ */

  async function confirmLeave() {
    if (
      !pendingLeave?.payload
    ) {
      return;
    }

    setError("");

    const payload =
      pendingLeave.payload;

    setLoading(true);

    try {
      const response =
        await apiFetch<{
          success: boolean;
          message: string;
          leave?: unknown;
        }>(
          "/api/leaves/ai/confirm",
          {
            method: "POST",
            body: JSON.stringify({
              leave_type:
                payload.leave_type,

              start_date:
                payload.start_date,

              end_date:
                payload.end_date,

              reason:
                payload.reason ?? null,

              confirmed: true,
            }),
          },
        );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          response.message ||
          "Your leave request has been submitted successfully.",
      };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      );

      setPendingLeave(null);
    } catch (err) {
      const friendly =
        buildFriendlyError(err);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: friendly,
      };

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================================================================
     CANCEL LEAVE
  ================================================================ */

  function cancelLeave() {
    if (loading) {
      return;
    }

    setPendingLeave(null);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "No problem — I cancelled the leave application.",
    };

    setMessages(
      (current) => [
        ...current,
        assistantMessage,
      ],
    );
  }

  /* ================================================================
     CLEAR CHAT
  ================================================================ */

  function clearChat() {
    setMessages([]);
    setError("");
    setPendingLeave(null);
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    pendingLeave,
    confirmLeave,
    cancelLeave,
    clearChat,
  };
}

/* ================================================================
   LEAVE PREVIEW TEXT
================================================================ */

function buildLeavePreviewMessage(
  payload: LeavePreviewPayload,
): string {
  const start =
    formatLeaveDate(
      payload.start_date,
    );

  const end =
    formatLeaveDate(
      payload.end_date,
    );

  const days =
    calculateLeaveDays(
      payload.start_date,
      payload.end_date,
    );

  const type =
    formatLeaveType(
      payload.leave_type,
    );

  return (
    `You're requesting ${days} ${
      days === 1
        ? "day"
        : "days"
    } of ${type} from ${start} to ${end}. Would you like me to submit it?`
  );
}

/* ================================================================
   DATE HELPERS
================================================================ */

function formatLeaveDate(
  value: string,
): string {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function calculateLeaveDays(
  start: string,
  end: string,
): number {
  const startDate =
    new Date(
      `${start}T00:00:00`,
    );

  const endDate =
    new Date(
      `${end}T00:00:00`,
    );

  const difference =
    endDate.getTime() -
    startDate.getTime();

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24),
    ) + 1
  );
}

function formatLeaveType(
  value: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    casual: "Casual Leave",
    sick: "Sick Leave",
    earned: "Earned Leave",
    annual: "Annual Leave",
    other: "Other Leave",
  };

  return (
    labels[value] ||
    value
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase(),
      )
  );
}