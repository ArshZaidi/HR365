"use client";

import { supabase } from "@/lib/supabase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);

  headers.set(
    "Content-Type",
    "application/json"
  );

  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let message =
      "Something went wrong.";

    try {
      const data =
        await response.json();

      message =
        data.detail || message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
}