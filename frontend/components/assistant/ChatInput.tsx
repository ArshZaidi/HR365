"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, Loader2, Mic, MicOff } from "lucide-react";

import Magnetic from "@/components/ui/Magnetic";

export default function ChatInput({
  onSend,
  loading,
}: {
  onSend: (message: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const baseRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || loading) return;
    onSend(value.trim());
    setValue("");
  }

  function toggleVoice() {
    if (typeof window === "undefined" || !supported) return;

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // no-op
      }
      setListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    baseRef.current = value;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const base = baseRef.current;
      const spacer = base && !base.endsWith(" ") ? " " : "";
      setValue(base + spacer + final + interim);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div
        className="
          relative rounded-2xl
          border border-[var(--glass-border)]
          bg-[var(--glass-bg-strong)] backdrop-blur-2xl backdrop-saturate-150
          p-2
          shadow-[0_1px_0_var(--glass-hi)_inset,var(--shadow-sm)]
          transition-all duration-300 ease-[var(--ease-out-soft)]
          focus-within:border-[var(--border-strong)]
        "
      >
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
          rows={1}
          placeholder="Ask HR365 anything..."
          className="
            min-h-[52px] w-full resize-none bg-transparent
            px-3 py-3 pr-28
            text-[14.5px] text-[var(--foreground)]
            outline-none placeholder:text-[var(--muted)]
          "
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
          {supported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={loading}
              aria-label={listening ? "Stop dictation" : "Dictate message"}
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "transition-all duration-300 ease-[var(--ease-out-soft)]",
                "disabled:cursor-not-allowed disabled:opacity-40",
                listening
                  ? "text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-hover)]/70 hover:text-[var(--foreground)]",
              ].join(" ")}
              style={
                listening
                  ? {
                      background:
                        "linear-gradient(135deg, var(--accent-1), var(--accent-6))",
                    }
                  : undefined
              }
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          <Magnetic strength={0.15}>
            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowUp size={17} />
              )}
            </button>
          </Magnetic>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
        HR365 answers are grounded in trusted company information.
      </p>
    </form>
  );
}