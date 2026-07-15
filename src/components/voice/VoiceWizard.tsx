"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useHybridWizard, WizardState } from "@/hooks/useHybridWizard";
import { WelcomeWizardData, WizardAnswers } from "@/types/wizard";

interface VoiceWizardProps {
  onComplete: (data: WelcomeWizardData, results: string[], answers: WizardAnswers) => void;
  onSkip: () => void;
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={
            i === current
              ? { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }
              : { scale: 1, opacity: i < current ? 1 : 0.25 }
          }
          transition={
            i === current
              ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
              : { duration: 0.3 }
          }
          style={{
            width: i === current ? 10 : 8,
            height: i === current ? 10 : 8,
            background: i <= current ? "var(--primary)" : "var(--muted)",
          }}
        />
      ))}
    </div>
  );
}

function AvatarRings({ state }: { state: WizardState }) {
  if (state === "speaking") {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ border: "2px solid var(--primary)" }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.6, 0], scale: [1, 1.5 + i * 0.3, 2 + i * 0.3] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              delay: i * 0.4,
              ease: "easeOut",
            }}
          />
        ))}
      </>
    );
  }

  if (state === "listening") {
    return (
      <motion.div
        className="absolute rounded-full"
        style={{ border: "3px solid #22c55e" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      />
    );
  }

  return null;
}

function Avatar({ state }: { state: WizardState }) {
  const isProcessing = state === "processing";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <AvatarRings state={state} />

      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 160,
          height: 160,
          background: "var(--primary)",
        }}
        animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
        transition={
          isProcessing
            ? { repeat: Infinity, duration: 3, ease: "linear" }
            : { duration: 0.4 }
        }
      >
        {state === "listening" ? (
          <Mic size={64} color="white" />
        ) : (
          <span
            className="font-bold text-white select-none"
            style={{ fontSize: 72, lineHeight: 1 }}
          >
            M
          </span>
        )}
      </motion.div>
    </div>
  );
}

function StatusLabel({ state }: { state: WizardState }) {
  if (state === "idle" || state === "complete") return null;

  const labels: Record<WizardState, string> = {
    idle: "",
    speaking: "MAX está hablando...",
    listening: "Escuchándote",
    processing: "Procesando...",
    complete: "",
  };

  return (
    <div className="flex items-center justify-center gap-1 h-5">
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        {labels[state]}
      </span>
      {state === "listening" && (
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block rounded-full"
              style={{ width: 4, height: 4, background: "#22c55e" }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

export function VoiceWizard({ onComplete, onSkip }: VoiceWizardProps) {
  const {
    state,
    maxText,
    userText,
    stepIndex,
    totalSteps,
    currentOptions,
    isNameStep,
    nameValue,
    setNameValue,
    selectOption,
    submitName,
    isMicListening,
    toggleMic,
    isMicSupported,
    start,
    skip,
  } = useHybridWizard(onComplete, onSkip);

  useEffect(() => {
    const t = setTimeout(start, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between px-6 py-10"
      style={{
        background: "linear-gradient(to bottom, var(--bg), #111111)",
      }}
    >
      {/* Progress dots */}
      <div className="w-full flex flex-col items-center gap-4 pt-4">
        {totalSteps > 0 && <ProgressDots total={totalSteps} current={stepIndex} />}
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 flex-1 justify-center w-full max-w-sm">
        <Avatar state={state} />

        {/* MAX text */}
        <div className="min-h-[60px] flex items-center justify-center text-center px-2">
          <AnimatePresence mode="wait">
            {maxText ? (
              <motion.p
                key={maxText}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-medium leading-snug"
                style={{ color: "var(--text)" }}
              >
                {maxText.length > 120 ? maxText.slice(0, 120) + "…" : maxText}
              </motion.p>
            ) : state === "processing" && !maxText ? (
              <motion.p
                key="connecting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm"
                style={{ color: "var(--muted)" }}
              >
                MAX está pensando...
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        {/* User bubble */}
        <AnimatePresence>
          {userText ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-2 rounded-2xl max-w-xs text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                Vos:{" "}
              </span>
              <span className="text-sm" style={{ color: "var(--text)" }}>
                {userText}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <StatusLabel state={state} />

        {/* Options / input area */}
        <AnimatePresence>
          {state === "listening" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm flex flex-col gap-2"
            >
              {isNameStep ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && nameValue.trim() && submitName()}
                    placeholder="Tu nombre..."
                    className="flex-1 px-4 py-3 rounded-lg text-sm"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  <button
                    onClick={submitName}
                    disabled={!nameValue.trim()}
                    className="px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-40"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {currentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(opt.id)}
                      className="px-3 py-3 rounded-xl text-sm font-medium text-left transition-transform active:scale-95"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {isMicSupported && (
                <button
                  onClick={toggleMic}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: isMicListening ? "#ef444420" : "transparent",
                    color: isMicListening ? "#ef4444" : "var(--muted)",
                    border: `1px solid ${isMicListening ? "#ef4444" : "var(--border)"}`,
                  }}
                >
                  {isMicListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isMicListening ? "Escuchando..." : "Hablar"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="w-full flex justify-start">
        <button
          onClick={skip}
          className="text-sm transition-opacity hover:opacity-80"
          style={{ color: "var(--muted)" }}
        >
          Saltar →
        </button>
      </div>
    </div>
  );
}
