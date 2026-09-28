"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface HR365Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: "employee" | "hr" | "admin" | string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  joining_date?: string | null;
  manager_id?: string | null;
  is_active: boolean;
}

let cachedProfile: HR365Profile | null = null;
let profilePromise: Promise<HR365Profile | null> | null =
  null;

async function fetchProfile(): Promise<HR365Profile | null> {
  if (cachedProfile) {
    return cachedProfile;
  }

  if (profilePromise) {
    return profilePromise;
  }

  profilePromise = (async () => {
    try {
      /*
       * Get the currently authenticated Supabase user.
       */
      const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

      const user = session?.user;

      if (sessionError || !user) {
          cachedProfile = null;
          return null;
      }

      /*
       * Fetch ONLY this user's profile.
       *
       * profiles.id is linked to auth.users.id.
       */
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            employee_id,
            full_name,
            email,
            role,
            department,
            designation,
            phone,
            joining_date,
            manager_id,
            is_active
          `,
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "HR365 profile fetch failed:",
          error,
        );

        cachedProfile = null;
        return null;
      }

      if (!data) {
        console.error(
          "No HR365 profile found for authenticated user:",
          user.id,
        );

        cachedProfile = null;
        return null;
      }

      /*
       * If the database profile does not contain an email,
       * use the authenticated Supabase email.
       */
      const profile: HR365Profile = {
        ...data,
        email: data.email || user.email || "",
      };

      cachedProfile = profile;

      return profile;
    } finally {
      profilePromise = null;
    }
  })();

  return profilePromise;
}

export function clearProfileCache() {
  cachedProfile = null;
  profilePromise = null;
}

export function useProfile() {
  const [profile, setProfile] =
    useState<HR365Profile | null>(
      cachedProfile,
    );

  const [loading, setLoading] = useState(
    !cachedProfile,
  );

  const [error, setError] =
    useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);

      if (!cachedProfile) {
        setLoading(true);
      }

      const result = await fetchProfile();

      setProfile(result);
    } catch (err) {
      console.error(
        "HR365 profile error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve profile.",
      );

      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();

    /*
     * Keep profile synchronized with login/logout.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          event === "SIGNED_OUT" ||
          !session
        ) {
          clearProfileCache();

          setProfile(null);
          setLoading(false);

          return;
        }

        /*
         * Only refetch when the authentication state
         * actually changes.
         */
        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          clearProfileCache();

          await loadProfile();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    refresh: async () => {
      clearProfileCache();
      await loadProfile();
    },
  };
}