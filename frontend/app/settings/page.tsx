"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/ui/PageTransition";
import {
  EyebrowPill,
  PageBody,
  PageHeader,
} from "@/components/ui/premium";

import ProfileSection from "@/components/settings/ProfileSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  designation?: string | null;
  department?: string | null;
  role?: string | null;
  avatar_url?: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    setProfile(
      data
        ? { ...data, email: data.email ?? session.user.email }
        : {
            id: session.user.id,
            email: session.user.email,
          },
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <AppShell>
      <PageTransition>
        <main className="min-h-full">
          <PageHeader
            eyebrow={
              <EyebrowPill tone={2}>
                <span className="inline-flex items-center gap-1.5">
                  <SettingsIcon size={11} />
                  Settings
                </span>
              </EyebrowPill>
            }
            title="Your workspace, your way."
            description="Manage your profile, appearance, and preferences for HR365."
          />

          <PageBody>
            {loading ? (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <div className="h-[520px] animate-pulse rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl" />
                <div className="h-[520px] animate-pulse rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                <ProfileSection
                  profile={profile}
                  onUpdated={loadProfile}
                />
                <AppearanceSection />
              </div>
            )}
          </PageBody>
        </main>
      </PageTransition>
    </AppShell>
  );
}