"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Loader2, Menu, Home, Pencil, Check, Search } from "lucide-react";
import { useMaxAssistant, AssistantState, ConversationMessage } from "@/hooks/useMaxAssistant";
import ConversationHistory from "./ConversationHistory";
import { NoCreditsModal } from "./NoCreditsModal";
import { getActiveAssistant } from "@/assistants/registry";

const assistant = getActiveAssistant();

interface MaxVoiceAssistantProps {
  projectId?: string;
  projectContext?: string;
  projectName?: string;
  mode?: "chat" | "onboarding";
  onContextGenerated?: (context: string) => void;
  loadConversationId?: string;
  onGoHome?: () => void;
}

function AvatarRings({ state }: { state: AssistantState }) {
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
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.4, ease: "easeOut" }}
          />
        ))}
      </>
    );
  }

  if (state === "recording") {
    return (
      <motion.div
        className="absolute rounded-full"
        style={{ border: "3px solid #22c55e" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      />
    );
  }

  if (state === "searching") {
    return (
      <>
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ border: "2px solid #f59e0b" }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.5, 0], scale: [1, 1.4 + i * 0.2, 1.8 + i * 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3, ease: "easeOut" }}
          />
        ))}
      </>
    );
  }

  if (state === "processing") {
    return (
      <motion.div
        className="absolute rounded-full"
        style={{ border: "2px solid var(--primary)", opacity: 0.4 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />
    );
  }

  return null;
}

function Avatar({ state }: { state: AssistantState }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <AvatarRings state={state} />
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full select-none"
        style={{ width: 140, height: 140, background: "var(--primary)" }}
      >
        {state === "searching" ? (
          <Search size={52} color="#ffffff" />
        ) : state === "processing" ? (
          <Loader2 size={52} color="#ffffff" className="animate-spin" />
        ) : state === "recording" ? (
          <Mic size={52} color="#ffffff" />
        ) : (
          <span className="font-bold" style={{ fontSize: 64, lineHeight: 1, color: "#ffffff" }}>{assistant.identity.name.charAt(0)}</span>
        )}
      </motion.div>
    </div>
  );
}

function StatusLabel({ state, isActive }: { state: AssistantState; isActive: boolean }) {
  const labels: Partial<Record<AssistantState, string>> = {
    recording: "Escuchándote...",
    searching: "Buscando en la web...",
    processing: "Procesando...",
    speaking: `${assistant.identity.name} está hablando...`,
    error: "Error",
  };

  const label = !isActive ? assistant.identity.tagline : (labels[state] ?? "Listo para escucharte");

  return (
    <div className="flex items-center justify-center gap-2 h-5">
      <span className="text-sm" style={{ color: state === "error" ? "#ef4444" : "var(--muted)" }}>
        {label}
      </span>
      {state === "recording" && (
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

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s<]+[^\s<.])/g);
  return parts.map((part, i) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: 'var(--primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isMax = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full min-w-0 ${isMax ? "justify-start" : "justify-end"}`}
    >
      <div
        className="px-3 py-2 rounded-2xl text-sm break-words"
        style={{
          maxWidth: "85%",
          background: isMax ? "var(--surface)" : "var(--primary)",
          color: isMax ? "var(--text)" : "white",
          border: isMax ? "1px solid var(--border)" : "none",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {isMax && (
          <span className="text-xs font-semibold block mb-0.5" style={{ color: "var(--primary)" }}>
            {assistant.identity.name}
          </span>
        )}
        {linkify(msg.text)}
      </div>
    </motion.div>
  );
}

export function MaxVoiceAssistant({
  projectId,
  projectContext,
  projectName,
  mode = "chat",
  onContextGenerated,
  loadConversationId,
  onGoHome,
}: MaxVoiceAssistantProps) {
  const stableOnContextGenerated = useCallback(
    (context: string) => onContextGenerated?.(context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onContextGenerated]
  );

  const {
    state,
    messages,
    currentMaxText,
    currentUserText,
    error,
    isActive,
    noCredits,
    setNoCredits,
    start,
    stop,
    startRecording,
    stopRecording,
    loadConversation,
    renameConversation,
  } = useMaxAssistant({
    projectId,
    projectContext,
    mode,
    onContextGenerated: onContextGenerated ? stableOnContextGenerated : undefined,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [chatName, setChatName] = useState("");

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      if (loadConversationId) {
        loadConversation(loadConversationId);
      } else {
        start();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canRecord = isActive && state === "idle";

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "linear-gradient(to bottom, var(--bg), #111111)" }}
    >
      {/* Header */}
      <div className="w-full flex-shrink-0 px-4 pt-10 pb-3">
        {/* Fila de iconos */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-4">
            <button onClick={() => setDrawerOpen(true)} className="p-1" style={{ color: "var(--muted)" }}>
              <Menu size={22} />
            </button>
            {onGoHome && (
              <button onClick={onGoHome} className="p-1" style={{ color: "var(--muted)" }}>
                <Home size={20} />
              </button>
            )}
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            {assistant.identity.company}
          </p>
        </div>
        {/* Título */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {mode === "onboarding" ? "Configurando obra" : "Asistente"}
            </p>
            <h1 className="text-xl font-bold truncate" style={{ color: "var(--text)" }}>
              {projectName ?? assistant.identity.name}
            </h1>
          </div>
        </div>
        {/* Nombre del chat editable */}
        {isActive && (
          <div className="flex items-center gap-1 mt-1">
            {editingName ? (
              <>
                <input
                  autoFocus
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renameConversation(chatName);
                      setEditingName(false);
                    }
                  }}
                  className="text-xs px-2 py-0.5 rounded flex-1 outline-none"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--primary)",
                    maxWidth: "180px",
                  }}
                />
                <button
                  onClick={() => { renameConversation(chatName); setEditingName(false); }}
                  className="p-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs truncate max-w-[160px]" style={{ color: "var(--muted)" }}>
                  {chatName || "Chat sin título"}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-0.5"
                  style={{ color: "var(--muted)" }}
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content area: fills all available space */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {!isActive ? (
          /* Inactive: avatar centrado */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
            <Avatar state={state} />
            <StatusLabel state={state} isActive={isActive} />
          </div>
        ) : (
          /* Active: avatar compacto + mensajes scrolleables */
          <>
            <div className="flex flex-col items-center gap-2 py-3 flex-shrink-0">
              <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
                <AvatarRings state={state} />
                <motion.div
                  className="relative z-10 flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, background: "var(--primary)" }}
                >
                  {state === "searching" ? (
                    <Search size={22} color="#ffffff" />
                  ) : state === "processing" ? (
                    <Loader2 size={22} color="#ffffff" className="animate-spin" />
                  ) : state === "recording" ? (
                    <Mic size={22} color="#ffffff" />
                  ) : (
                    <span className="font-bold" style={{ fontSize: 26, lineHeight: 1, color: "#ffffff" }}>{assistant.identity.name.charAt(0)}</span>
                  )}
                </motion.div>
              </div>
              <StatusLabel state={state} isActive={isActive} />
            </div>

            {/* Mensajes — flex-1 para que ocupen todo el espacio disponible */}
            <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2 pb-3 min-h-0">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm px-6 text-center py-2 flex-shrink-0"
            style={{ color: "#ef4444" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Controls — siempre al fondo */}
      <div className="flex-shrink-0 pb-10 pt-4 flex flex-col items-center gap-3">
        {!isActive ? (
          <>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={start}
              className="flex items-center justify-center rounded-full shadow-lg"
              style={{ width: 72, height: 72, background: "var(--primary)" }}
            >
              <Phone size={28} color="#ffffff" />
            </motion.button>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Hablar con {assistant.identity.name}</p>
          </>
        ) : (
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onPointerDown={(e) => {
                  // Capture pointer so events keep firing even if finger drifts outside button
                  e.currentTarget.setPointerCapture(e.pointerId);
                  startRecording();
                }}
                onPointerUp={stopRecording}
                onPointerCancel={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
                disabled={!canRecord}
                className="flex items-center justify-center rounded-full shadow-lg transition-opacity"
                style={{
                  width: 72,
                  height: 72,
                  background: state === "recording" ? "#22c55e" : "var(--surface)",
                  border: "2px solid var(--border)",
                  opacity: canRecord ? 1 : 0.4,
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                {state === "recording" ? (
                  <MicOff size={28} color="white" />
                ) : (
                  <Mic size={28} color="var(--text)" />
                )}
              </motion.button>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {state === "recording" ? "Soltá para enviar" : "Mantené para hablar"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={stop}
                className="flex items-center justify-center rounded-full shadow-lg"
                style={{ width: 56, height: 56, background: "#ef4444" }}
              >
                <PhoneOff size={22} color="white" />
              </motion.button>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Finalizar</p>
            </div>
          </div>
        )}
      </div>

      <ConversationHistory
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={(id) => { loadConversation(id); }}
        onNew={() => { stop(); start(); }}
        projectId={projectId}
      />

      <NoCreditsModal
        open={!!noCredits}
        service={noCredits?.service ?? null}
        onClose={() => setNoCredits(null)}
      />
    </div>
  );
}
