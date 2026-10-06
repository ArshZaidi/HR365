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
 * Detect an explicit leave action.
 *
 * Examples:
 * - "I want to apply for leave"
 * - "Apply for sick leave from October 10 to October 12"
 * - "I need casual leave"
 *
 * Policy questions such as:
 * - "What is the leave policy?"
 * - "Can I take leave?"
 *
 * continue through the normal HR assistant.
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
    (pattern) => pattern.test(normalized),
  );

  if (!hasActionVerb) {
    return false;
  }

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

/**
 * Detect a follow-up message belonging to an already active
 * leave-application conversation.
 *
 * Examples:
 * - "general leave"
 * - "sick leave"
 * - "10th to 12th October"
 * - "October 10 to October 12"
 * - "from 10th to 12th"
 */
function looksLikeLeaveFollowUp(text: string): boolean {
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

  const hasLeaveType =
    /\b(casual|sick|earned|annual|vacation|other|general)\b/.test(
      normalized,
    );

  const hasDateNumber =
    /\b\d{1,2}(?:st|nd|rd|th)?\b/.test(
      normalized,
    );

  const hasMonth =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|sept(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/.test(
      normalized,
    );

  const hasDateConnector =
    /\b(from|to|until|through|between)\b/.test(
      normalized,
    );

  const hasIsoDate =
    /\b\d{4}-\d{1,2}-\d{1,2}\b/.test(
      normalized,
    );

  return (
    hasLeaveTerm ||
    hasLeaveType ||
    hasDateNumber ||
    hasMonth ||
    hasDateConnector ||
    hasIsoDate
  );
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

  /**
   * A fully parsed leave request waiting for confirmation.
   */
  const [pendingLeave, setPendingLeave] =
    useState<LeavePreviewResponse | null>(
      null,
    );

  /**
   * A partially collected leave request.
   *
   * Example:
   *
   * User:
   *   "I want to apply for leave"
   *
   * leaveDraft:
   *   "I want to apply for leave"
   *
   * User:
   *   "general leave"
   *
   * leaveDraft:
   *   "I want to apply for leave. general leave"
   *
   * User:
   *   "10th to 12th October"
   *
   * The complete command is sent to the backend.
   */
  const [leaveDraft, setLeaveDraft] =
    useState<string>("");

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

      if (
        message.includes("internal server error") ||
        message.includes("server error")
      ) {
        return "Something went wrong while processing your request. Please try again.";
      }

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
    const trimmed = question.trim();

    if (!trimmed || loading) {
      return;
    }

    setError("");

    const hasActiveLeaveDraft =
      Boolean(leaveDraft);

    const isNewLeaveAction =
      looksLikeLeaveAction(trimmed);

    const isLeaveFollowUp =
      hasActiveLeaveDraft &&
      looksLikeLeaveFollowUp(trimmed);

    /*
     * A fully confirmed leave request is handled by the
     * confirmation card, so a normal new message cancels
     * any previous confirmation state.
     *
     * An INCOMPLETE leave draft is different:
     * it must survive across multiple user messages.
     */
    setPendingLeave(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setLoading(true);

    try {
      /* ==========================================================
         1. LEAVE ACTION
      ========================================================== */

      if (
        isNewLeaveAction ||
        isLeaveFollowUp
      ) {
        /*
         * If this is a follow-up, combine it with the
         * previously collected leave information.
         *
         * Example:
         *
         * "I want to apply for leave"
         * +
         * "general leave"
         *
         * becomes:
         *
         * "I want to apply for leave. general leave"
         */
        const leaveCommand =
          hasActiveLeaveDraft
            ? `${leaveDraft}. ${trimmed}`
            : trimmed;

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
                  command: leaveCommand,
                }),
              },
            );
        } catch (previewError) {
          console.warn(
            "Leave action preview failed:",
            previewError,
          );

          /*
           * Do not keep a stale draft if the leave
           * endpoint itself failed.
           */
          setLeaveDraft("");

          leavePreview = null;
        }

        if (leavePreview?.matched) {
          /*
           * Backend still needs information.
           *
           * Keep the entire conversation collected so far
           * as the draft.
           */
          if (
            !leavePreview.ready ||
            !leavePreview.payload
          ) {
            setLeaveDraft(leaveCommand);

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                leavePreview.message ||
                "I need a few more details before I can prepare the leave request.",
            };

            setMessages((current) => [
              ...current,
              assistantMessage,
            ]);

            return;
          }

          /*
           * Everything is available.
           *
           * Now move the request into the confirmation
           * state and clear the temporary draft.
           */
          setLeaveDraft("");

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

          setMessages((current) => [
            ...current,
            assistantMessage,
          ]);

          return;
        }

        /*
         * If this was an attempted leave conversation but the
         * backend did not recognize it, don't leave stale state.
         */
        if (
          isLeaveFollowUp ||
          isNewLeaveAction
        ) {
          setLeaveDraft("");
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

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        response,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      const friendly =
        buildFriendlyError(err);

      setError("");

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: friendly,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ================================================================
     CONFIRM LEAVE
  ================================================================ */

  async function confirmLeave() {
    if (!pendingLeave?.payload) {
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

              notify_hr: true,
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

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setPendingLeave(null);
      setLeaveDraft("");
    } catch (err) {
      const friendly =
        buildFriendlyError(err);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: friendly,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
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
    setLeaveDraft("");

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "No problem — I cancelled the leave application.",
    };

    setMessages((current) => [
      ...current,
      assistantMessage,
    ]);
  }

  /* ================================================================
     CLEAR CHAT
  ================================================================ */

  function clearChat() {
    setMessages([]);
    setError("");
    setPendingLeave(null);
    setLeaveDraft("");
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
    other: "General / Other Leave",
  };

  return (
    labels[value] ||
    value.replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase(),
    )
  );
}