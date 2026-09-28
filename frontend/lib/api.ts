"use client";

import { supabase } from "@/lib/supabase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

let cachedAccessToken: string | null = null;
let authListenerInitialized = false;
let refreshPromise: Promise<string | null> | null = null;

function initializeAuthCache() {
  if (authListenerInitialized) {
    return;
  }

  authListenerInitialized = true;

  supabase.auth.onAuthStateChange(
    (_event, session) => {
      cachedAccessToken =
        session?.access_token ?? null;
    },
  );
}

async function getAccessToken(): Promise<string | null> {
  initializeAuthCache();

  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  cachedAccessToken =
    session?.access_token ?? null;

  return cachedAccessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !session?.access_token) {
        cachedAccessToken = null;
        return null;
      }

      cachedAccessToken =
        session.access_token;

      return session.access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function performRequest(
  endpoint: string,
  options: RequestInit,
  token: string | null,
) {
  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Content-Type",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  return fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let token = await getAccessToken();

  let response = await performRequest(
    endpoint,
    options,
    token,
  );

  if (response.status === 401) {
    token = await refreshAccessToken();

    if (token) {
      response = await performRequest(
        endpoint,
        options,
        token,
      );
    }
  }

  if (!response.ok) {
    let message =
      "Something went wrong.";

    try {
      const data =
        await response.json();

      message =
        data.detail || message;
    } catch {
      // Keep generic message.
    }

    throw new Error(message);
  }

  return response.json();
}