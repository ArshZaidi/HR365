"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { Notice, NoticesResponse } from "@/types/notices";

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<NoticesResponse>("/api/notices");
      setNotices(data.notices || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Silent — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  /* Initial + on tab focus */
  useEffect(() => {
    load();

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () =>
      document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  /* Poll every 60s */
  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      const target = notices.find((n) => n.id === id);
      if (!target || target.is_read) return;

      /* Optimistic */
      setNotices((current) =>
        current.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await apiFetch(`/api/notices/${id}/read`, { method: "POST" });
      } catch {
        /* Revert on failure */
        setNotices((current) =>
          current.map((n) =>
            n.id === id ? { ...n, is_read: false } : n,
          ),
        );
        setUnreadCount((c) => c + 1);
      }
    },
    [notices],
  );

  return { notices, unreadCount, loading, refresh: load, markRead };
}