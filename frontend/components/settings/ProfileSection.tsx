"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  Mail,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { DEPARTMENTS, DESIGNATIONS } from "@/lib/options";
import { GlassPanel } from "@/components/ui/premium";

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  designation?: string | null;
  department?: string | null;
  avatar_url?: string | null;
}

interface ProfileSectionProps {
  profile: Profile | null;
  onUpdated: () => void;
}

const inputBase = [
  "w-full rounded-xl px-4 py-3 text-[14px]",
  "border border-[var(--border)]",
  "bg-[var(--surface)]/60 backdrop-blur-xl",
  "text-[var(--foreground)] outline-none",
  "transition-all duration-200 ease-[var(--ease-out-soft)]",
  "placeholder:text-[var(--muted)]",
  "focus:border-[var(--border-strong)]",
  "focus:bg-[var(--surface)]/80",
].join(" ");

const labelBase =
  "mb-2 block text-[12px] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase";

export default function ProfileSection({
  profile,
  onUpdated,
}: ProfileSectionProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [designation, setDesignation] = useState(
    profile?.designation || "",
  );
  const [department, setDepartment] = useState(profile?.department || "");

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U";

  /* ─── Avatar upload ─────────────────────── */
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    setError("");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${profile.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload image.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    if (!profile?.id) return;

    setUploading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (error) throw error;

      setAvatarUrl("");
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove image.",
      );
    } finally {
      setUploading(false);
    }
  };

  /* ─── Save profile fields ───────────────── */
  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          designation: designation.trim() || null,
          department: department.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassPanel
      tone={1}
      title="Profile"
      subtitle="Your identity across the HR365 workspace"
    >
      {/* Avatar row */}
      <div className="flex flex-col items-start gap-6 pb-6 sm:flex-row sm:items-center">
        <div className="relative">
          <div
            className="
              relative flex h-24 w-24 items-center justify-center
              overflow-hidden rounded-full text-[26px] font-semibold text-white
              ring-4 ring-[var(--surface)]/70
            "
            style={{
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
              boxShadow: "0 16px 36px -16px rgba(23,22,20,0.35)",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="
              absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center
              rounded-full border border-[var(--glass-border)]
              bg-[var(--foreground)] text-[var(--background)]
              shadow-[var(--shadow-md)]
              transition-all duration-300 ease-[var(--ease-out-soft)]
              hover:scale-105
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">Profile picture</p>
          <p className="mt-1 text-[12.5px] text-[var(--muted)]">
            PNG, JPEG, or WEBP. Max 5 MB.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="
                inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                border border-[var(--border)]
                bg-[var(--surface)]/60 backdrop-blur-xl
                text-[12.5px] font-medium
                transition-all duration-200
                hover:-translate-y-0.5 hover:border-[var(--border-strong)]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              <Upload size={13} />
              {avatarUrl ? "Replace" : "Upload"}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={uploading}
                className="
                  inline-flex h-9 items-center gap-1.5 rounded-lg px-3
                  text-[12.5px] font-medium
                  transition-opacity duration-200
                  hover:opacity-80
                  disabled:cursor-not-allowed disabled:opacity-50
                "
                style={{ color: "var(--danger)" }}
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full name */}
          <div className="sm:col-span-2">
            <label className={labelBase}>Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className={inputBase}
            />
          </div>

          {/* Email (read-only) */}
          <div className="sm:col-span-2">
            <label className={labelBase}>Email</label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                value={profile?.email || ""}
                disabled
                className={`${inputBase} pl-10 opacity-60`}
              />
            </div>
            <p className="mt-1.5 text-[11.5px] text-[var(--muted)]">
              Email is managed by your authentication provider.
            </p>
          </div>

          {/* Designation */}
          <div>
            <label className={labelBase}>Designation</label>
            <input
              list="designation-options"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputBase}
            />
            <datalist id="designation-options">
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* Department */}
          <div>
            <label className={labelBase}>Department</label>
            <input
              list="department-options"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className={inputBase}
            />
            <datalist id="department-options">
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>

        {error && (
          <div
            className="mt-5 rounded-xl border px-4 py-3 text-[13px] font-medium"
            style={{
              borderColor: "var(--danger)",
              background: "var(--danger-soft)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex h-11 items-center gap-2 rounded-xl px-5
              text-[14px] font-medium text-white
              transition-all duration-300 ease-[var(--ease-out-soft)]
              hover:-translate-y-0.5
              disabled:cursor-not-allowed disabled:opacity-60
            "
            style={{
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-6) 60%, var(--accent-2))",
              boxShadow:
                "0 16px 36px -14px rgba(210,105,74,0.5), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : saved ? (
              <Check size={15} />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>

          {saved && (
            <span className="text-[12.5px]" style={{ color: "var(--success)" }}>
              Your changes are live.
            </span>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}