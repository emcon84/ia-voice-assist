"use client";
import { useState, useRef, useCallback } from "react";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

const CONTEXT_TAG_RE = /\[CONTEXTO_GENERADO:\s*([\s\S]*?)\]/;

export type AssistantState = "idle" | "recording" | "searching" | "processing" | "speaking" | "error";

export interface ConversationMessage {
  role: "assistant" | "user";
  text: string;
}

export interface UseMaxAssistantOptions {
  projectId?: string;
  projectContext?: string;
  mode?: "chat" | "onboarding";
  onContextGenerated?: (context: string) => void;
}

export interface UseMaxAssistantReturn {
  state: AssistantState;
  messages: ConversationMessage[];
  currentMaxText: string;
  currentUserText: string;
  error: string | null;
  isActive: boolean;
  conversationId: string | undefined;
  noCredits: { service: "anthropic" | "elevenlabs" } | null;
  setNoCredits: (value: { service: "anthropic" | "elevenlabs" } | null) => void;
  start: () => void;
  stop: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  loadConversation: (id: string) => Promise<void>;
  renameConversation: (name: string) => Promise<void>;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function useMaxAssistant(options: UseMaxAssistantOptions = {}): UseMaxAssistantReturn {
  const { projectId, projectContext, mode = "chat", onContextGenerated } = options;

  const [state, _setState] = useState<AssistantState>("idle");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMaxText, setCurrentMaxText] = useState("");
  const [currentUserText, setCurrentUserText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isActive, _setIsActive] = useState(false);
  const [noCredits, setNoCredits] = useState<{ service: "anthropic" | "elevenlabs" } | null>(null);

  // Refs that mirror state so callbacks never use stale closures
  const stateRef = useRef<AssistantState>("idle");
  const isActiveRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const setState = useCallback((s: AssistantState) => {
    stateRef.current = s;
    _setState(s);
  }, []);

  const setIsActive = useCallback((v: boolean) => {
    isActiveRef.current = v;
    _setIsActive(v);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const conversationIdRef = useRef<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const updateMessages = useCallback((updated: ConversationMessage[]) => {
    messagesRef.current = updated;
    setMessages(updated);
  }, []);

  const playAudio = useCallback(async (text: string): Promise<void> => {
    setState("speaking");
    setCurrentMaxText(text);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "NO_CREDITS") {
          setNoCredits({ service: body.service });
          setState("idle");
          return;
        }
        throw new Error("TTS falló");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Reuse the same Audio element — iOS unlocks playback per-instance during user gesture.
      // Creating new Audio() each time produces a locked element that silently fails after the first play.
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = url;

      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
      });
    } catch (err) {
      console.error("TTS error:", err);
    }

    setState("idle");
  }, []);

  const sendToMax = useCallback(async (userText: string): Promise<void> => {
    const searchStart = Date.now();
    setState("searching");
    setCurrentUserText(userText);

    const updated = [...messagesRef.current, { role: "user" as const, text: userText }];
    updateMessages(updated);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.text })),
          projectId,
          conversationId: conversationIdRef.current,
          mode,
          projectContext,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Error desconocido" }));
        if (body.error === "NO_CREDITS") {
          setNoCredits({ service: body.service });
          setState("idle");
          return;
        }
        throw new Error(body.error ?? "Chat falló");
      }

      // Asegurar que "searching" se vea al menos 1.5s
      const elapsed = Date.now() - searchStart;
      if (elapsed < 1500) {
        await new Promise((r) => setTimeout(r, 1500 - elapsed));
      }

      setState("processing");

      const { reply, conversationId: returnedConvId } = await res.json();
      if (returnedConvId) conversationIdRef.current = returnedConvId;

      let cleanReply = stripMarkdown(reply);

      if (mode === "onboarding" && onContextGenerated) {
        const match = cleanReply.match(CONTEXT_TAG_RE);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            onContextGenerated(parsed.resumen ?? match[1]);
          } catch {
            onContextGenerated(match[1]);
          }
          cleanReply = cleanReply.replace(CONTEXT_TAG_RE, "").trim();
        }
      }

      const withReply = [...updated, { role: "assistant" as const, text: cleanReply }];
      updateMessages(withReply);
      setCurrentUserText("");
      await playAudio(cleanReply);
    } catch (err) {
      console.error("MAX chat error:", err);
      setError("No pude conectarme con MAX. Revisá las API keys.");
      setState("idle");
    }
  }, [updateMessages, playAudio, projectId, mode, projectContext, onContextGenerated]);

  const startRecording = useCallback(() => {
    // Use refs to avoid stale closure — state/isActive may be stale from the render cycle
    if (stateRef.current !== "idle" || !isActiveRef.current) return;
    setError(null);
    stopRequestedRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // On iOS, webkitSpeechRecognition exists but continuous:true is broken (ends immediately).
    // Always use MediaRecorder + Whisper on iOS for reliable PTT.
    const useMediaRecorder = !SpeechRecognition || detectIOS();

    if (useMediaRecorder) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // User may have released the button before getUserMedia resolved
          if (stopRequestedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/ogg";
          const recorder = new MediaRecorder(stream, { mimeType });
          audioChunksRef.current = [];
          recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            setState("processing");
            try {
              const form = new FormData();
              form.append("audio", blob);
              const res = await fetch("/api/stt", { method: "POST", body: form });
              const { transcript } = await res.json();
              if (transcript?.trim()) sendToMax(transcript.trim());
              else setState("idle");
            } catch {
              setError("No te escuché bien. Intentá de nuevo.");
              setState("idle");
            }
          };
          mediaRecorderRef.current = recorder;
          recorder.start();
          setState("recording");
        })
        .catch(() => {
          setError("No se pudo acceder al micrófono.");
        });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = false;

    transcriptRef.current = "";

    recognition.onstart = () => setState("recording");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const segment = event.results[i][0].transcript;
          transcriptRef.current += (transcriptRef.current ? " " : "") + segment;
        }
      }
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setError("No te escuché bien. Intentá de nuevo.");
      setState("idle");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      const transcript = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (transcript) {
        sendToMax(transcript);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendToMax, setState]);

  const stopRecording = useCallback(() => {
    // Signal early so getUserMedia.then() can bail out if it resolves after this
    stopRequestedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    conversationIdRef.current = undefined;
    setIsActive(true);
    setError(null);
    updateMessages([]);
    setCurrentMaxText("");
    setCurrentUserText("");
    // Create the Audio element here (user gesture context) so iOS considers it unlocked for
    // all subsequent playAudio calls — the element is reused rather than recreated each time.
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    await sendToMax("inicio_conversacion");
  }, [sendToMax, updateMessages]);

  const stop = useCallback(() => {
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsActive(false);
    setState("idle");
    setCurrentMaxText("");
    setCurrentUserText("");
  }, [stopRecording]);

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("No se pudo cargar la conversación");
      const data = await res.json();
      const loaded: ConversationMessage[] = (data.messages ?? []).map(
        (m: { role: "assistant" | "user"; content: string }) => ({
          role: m.role,
          text: m.content,
        })
      );
      updateMessages(loaded);
      conversationIdRef.current = id;
      setIsActive(true);
    } catch (err) {
      console.error("loadConversation error:", err);
      setError("No se pudo cargar la conversación.");
    }
  }, [updateMessages]);

  const renameConversation = useCallback(async (name: string): Promise<void> => {
    const id = conversationIdRef.current;
    if (!id) return;
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(console.error);
  }, []);

  return {
    state, messages, currentMaxText, currentUserText,
    error, isActive,
    conversationId: conversationIdRef.current,
    noCredits, setNoCredits,
    start, stop,
    startRecording, stopRecording, loadConversation, renameConversation,
  };
}
