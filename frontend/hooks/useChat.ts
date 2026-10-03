"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AskResponse, ChatMessage } from "@/types/assistant";

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
   HOOK
================================================================ */

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Holds the leave application waiting for user confirmation.
   *
   * Important:
   * We store the COMPLETE preview response because the backend
   * returns the actual leave data inside `payload`.
   */
  const [pendingLeave, setPendingLeave] =
    useState<LeavePreviewResponse | null>(null);

  /* ================================================================
     SEND MESSAGE
  ================================================================ */

  async function sendMessage(question: string) {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    setError("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);

    setLoading(true);

    try {
      /*
       * ------------------------------------------------------------
       * 1. First check whether this is an AI leave action.
       * ------------------------------------------------------------
       */
      let leavePreview: LeavePreviewResponse | null = null;

      try {
        leavePreview = await apiFetch<LeavePreviewResponse>(
          "/api/leaves/ai/preview",
          {
            method: "POST",
            body: JSON.stringify({
              command: trimmed,
            }),
          },
        );
      } catch {
        /*
         * If leave preview isn't applicable or the endpoint isn't
         * relevant, fall through to normal /api/ask behaviour.
         */
        leavePreview = null;
      }

      /*
       * ------------------------------------------------------------
       * 2. Leave command detected
       * ------------------------------------------------------------
       */

      if (leavePreview?.matched) {
        /*
         * A previous pending leave should not survive a new command.
         */
        setPendingLeave(null);

        /*
         * If backend needs more information, show its message
         * without creating a confirmation card.
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
            response: leavePreview as unknown as AskResponse,
          };

          setMessages((current) => [
            ...current,
            assistantMessage,
          ]);

          return;
        }

        /*
         * ----------------------------------------------------------
         * 3. Leave is ready → wait for explicit confirmation.
         * ----------------------------------------------------------
         */

        setPendingLeave(leavePreview);

        const previewText =
          leavePreview.confirmation_text ||
          leavePreview.message ||
          buildLeavePreviewMessage(leavePreview.payload);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: previewText,
          response: leavePreview as unknown as AskResponse,
        };

        setMessages((current) => [
          ...current,
          assistantMessage,
        ]);

        return;
      }

      /*
       * ------------------------------------------------------------
       * 4. Normal AI/RAG question
       * ------------------------------------------------------------
       */

      const response = await apiFetch<AskResponse>(
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
      const message =
        err instanceof Error
          ? err.message
          : "Unable to get an answer.";

      setError(message);
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

    const payload = pendingLeave.payload;

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * `confirmed: true` is required by the backend.
       */
      const response = await apiFetch<{
        success: boolean;
        message: string;
        leave?: unknown;
      }>("/api/leaves/ai/confirm", {
        method: "POST",
        body: JSON.stringify({
          leave_type: payload.leave_type,
          start_date: payload.start_date,
          end_date: payload.end_date,
          reason: payload.reason ?? null,
          confirmed: true,
        }),
      });

      /*
       * Add the successful application as an assistant message.
       */
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

      /*
       * Remove confirmation card.
       */
      setPendingLeave(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to submit the leave request.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /* ================================================================
     CANCEL LEAVE
  ================================================================ */

  function cancelLeave() {
    if (loading) return;

    setPendingLeave(null);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "No problem — I cancelled the leave application.",
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
) {
  const start = formatDate(payload.start_date);
  const end = formatDate(payload.end_date);

  const days = calculateDays(
    payload.start_date,
    payload.end_date,
  );

  const leaveType = payload.leave_type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return `You're requesting ${days} ${
    leaveType
  } ${days === 1 ? "day" : "days"} from ${start} to ${end}.`;
}

/* ================================================================
   DATE HELPERS
================================================================ */

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function calculateDays(
  startDate: string,
  endDate: string,
) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(
      (end.getTime() - start.getTime()) /
        86400000,
    ) + 1,
  );
}