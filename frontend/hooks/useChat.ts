"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AskResponse,
  ChatMessage,
} from "@/types/assistant";

export function useChat() {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function sendMessage(question: string) {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    setError("");

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
      const response = await apiFetch<AskResponse>(
        "/api/ask",
        {
          method: "POST",
          body: JSON.stringify({
            question: trimmed,
          }),
        }
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
      setError(
        err instanceof Error
          ? err.message
          : "Unable to get an answer."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  };
}