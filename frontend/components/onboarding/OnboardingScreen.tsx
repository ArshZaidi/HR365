"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export default function OnboardingScreen() {
  const router = useRouter();

  const [entering, setEntering] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 70,
    damping: 20,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 70,
    damping: 20,
  });

  const orbX = useTransform(smoothX, [-500, 500], [-35, 35]);
  const orbY = useTransform(smoothY, [-500, 500], [-35, 35]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(
        event.clientX - window.innerWidth / 2
      );

      mouseY.set(
        event.clientY - window.innerHeight / 2
      );
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };
  }, [mouseX, mouseY]);

  /*
   * Warm Render silently in the background.
   * The user never sees the old loading screen.
   */
  useEffect(() => {
    let cancelled = false;

    const wakeBackend = async () => {
      try {
        const response = await fetch(
          `${API_URL}/health`,
          {
            cache: "no-store",
          }
        );

        if (!cancelled && response.ok) {
          setBackendReady(true);
        }
      } catch {
        if (!cancelled) {
          setBackendReady(false);
        }
      }
    };

    wakeBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  const waitForBackend = async () => {
    if (backendReady) {
      return true;
    }

    setShowStatus(true);

    const timeout = Date.now() + 50000;

    while (Date.now() < timeout) {
      try {
        const response = await fetch(
          `${API_URL}/health`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          setBackendReady(true);
          return true;
        }
      } catch {
        // Render may still be waking.
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );
    }

    return false;
  };

  const handleEnter = async () => {
    if (entering) return;

    setEntering(true);

    const ready = await waitForBackend();

    /*
     * Even if the backend takes too long, enter the application.
     * The dashboard/API layer can handle the eventual wake-up.
     */
    if (!ready) {
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "hr365_onboarding_complete",
        "true"
      );
    }

    router.push("/dashboard");
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.04,
        filter: "blur(12px)",
      }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="hr365-onboarding"
    >
      {/* ========================================================= */}
      {/* BACKGROUND */}
      {/* ========================================================= */}

      <div className="onboarding-noise" />

      <div className="onboarding-grid" />

      <motion.div
        className="onboarding-cursor-glow"
        style={{
          x: orbX,
          y: orbY,
        }}
      />

      <motion.div
        className="onboarding-orb onboarding-orb-a"
        animate={{
          x: [0, 80, -30, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.12, 0.94, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="onboarding-orb onboarding-orb-b"
        animate={{
          x: [0, -70, 30, 0],
          y: [0, 50, -40, 0],
          scale: [1, 0.92, 1.08, 1],
        }}
        transition={{
          duration: 17,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="onboarding-orb onboarding-orb-c"
        animate={{
          x: [0, 50, -40, 0],
          y: [0, 35, -55, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* ========================================================= */}
      {/* TOP BAR */}
      {/* ========================================================= */}

      <motion.header
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.2,
          duration: 0.8,
        }}
        className="onboarding-header"
      >
        <div className="onboarding-logo">
          HR<span>365</span>
        </div>

        <div className="onboarding-secure">
          <span className="onboarding-secure-dot" />
          Secure workspace
        </div>
      </motion.header>

      {/* ========================================================= */}
      {/* FLOATING CARDS */}
      {/* ========================================================= */}

      <motion.div
        className="floating-card floating-card-left"
        initial={{
          opacity: 0,
          x: -60,
          rotate: -8,
        }}
        animate={{
          opacity: 1,
          x: 0,
          rotate: -4,
        }}
        transition={{
          delay: 0.8,
          duration: 1.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="floating-card-icon">
          <Sparkles size={17} />
        </div>

        <div>
          <p>AI Assistant</p>
          <span>Always ready</span>
        </div>

        <div className="floating-pulse" />
      </motion.div>

      <motion.div
        className="floating-card floating-card-right"
        initial={{
          opacity: 0,
          x: 60,
          rotate: 8,
        }}
        animate={{
          opacity: 1,
          x: 0,
          rotate: 4,
        }}
        transition={{
          delay: 1,
          duration: 1.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="floating-card-icon">
          <CheckCircle2 size={17} />
        </div>

        <div>
          <p>HR requests</p>
          <span>Track everything</span>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================= */}

      <section className="onboarding-content">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="onboarding-eyebrow"
        >
          <span>
            <Sparkles size={14} />
          </span>

          YOUR INTELLIGENT HR WORKSPACE
        </motion.div>

        <div className="onboarding-title-wrap">
          <motion.h1
            initial={{
              opacity: 0,
              y: 50,
              filter: "blur(15px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            transition={{
              delay: 0.5,
              duration: 1.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="onboarding-title"
          >
            Welcome
            <br />
            <em>back.</em>
          </motion.h1>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              rotate: -12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            transition={{
              delay: 1.15,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
            }}
            className="onboarding-spark"
          >
            ✦
          </motion.div>
        </div>

        <motion.p
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.9,
            duration: 0.8,
          }}
          className="onboarding-description"
        >
          Everything you need to navigate work,
          <br className="desktop-break" />
          HR, and your day — in one intelligent place.
        </motion.p>

        {/* ======================================================= */}
        {/* FEATURE STRIP */}
        {/* ======================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.15,
            duration: 0.8,
          }}
          className="onboarding-features"
        >
          <Feature
            icon={<Sparkles size={17} />}
            title="Ask"
            text="AI-powered HR answers"
          />

          <Feature
            icon={<CalendarDays size={17} />}
            title="Manage"
            text="Leave & attendance"
          />

          <Feature
            icon={<FileText size={17} />}
            title="Track"
            text="Requests & updates"
          />

          <Feature
            icon={<LockKeyhole size={17} />}
            title="Protected"
            text="Your data stays private"
          />
        </motion.div>

        {/* ======================================================= */}
        {/* CTA */}
        {/* ======================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.4,
            duration: 0.9,
          }}
          className="onboarding-action"
        >
          <motion.button
            type="button"
            onClick={handleEnter}
            disabled={entering}
            whileHover={{
              scale: 1.035,
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="onboarding-button"
          >
            <span>
              {entering
                ? "Preparing your workspace"
                : "Enter HR365"}
            </span>

            <motion.span
              animate={
                entering
                  ? {
                      rotate: 360,
                    }
                  : {
                      x: [0, 5, 0],
                    }
              }
              transition={
                entering
                  ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }
                  : {
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            >
              {entering ? (
                <span className="onboarding-spinner" />
              ) : (
                <ArrowUpRight size={19} />
              )}
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {showStatus && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="onboarding-status"
              >
                <span className="onboarding-status-dot" />
                Preparing your workspace in the background
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 1.7,
          }}
          className="onboarding-footnote"
        >
          HR365 <span>•</span> Built for people, powered by intelligence
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* BOTTOM DECORATIVE LINE */}
      {/* ========================================================= */}

      <motion.div
        initial={{
          scaleX: 0,
        }}
        animate={{
          scaleX: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="onboarding-bottom-line"
      />
    </motion.main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="onboarding-feature"
    >
      <div className="onboarding-feature-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </motion.div>
  );
}