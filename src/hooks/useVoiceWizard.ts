"use client";
import { useState, useRef, useCallback } from "react";
import { useVoice } from "@/hooks/useVoice";
import { WIZARD_QUESTIONS } from "@/data/wizardQuestions";
import { WizardAnswers, WelcomeWizardData } from "@/types/wizard";

export type WizardState = "idle" | "speaking" | "listening" | "processing" | "complete";

export interface UseVoiceWizardReturn {
  state: WizardState;
  maxText: string;
  userText: string;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  skip: () => void;
}

const USER_TYPES = ["particular", "constructor", "arquitecto", "ingeniero", "empresa"];

function matchOption(
  transcript: string,
  options: { id: string; label: string }[]
): string | null {
  const lower = transcript.toLowerCase();
  return (
    options.find((o) => lower.includes(o.label.toLowerCase()))?.id ||
    options.find((o) => o.id.split("-").some((part) => lower.includes(part)))?.id ||
    null
  );
}

function matchUserType(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  return USER_TYPES.find((t) => lower.includes(t)) ?? null;
}

function matchWater(transcript: string): "si" | "no" {
  const lower = transcript.toLowerCase();
  return lower.includes("sí") || lower.includes("si") ? "si" : "no";
}

function matchResistencia(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  if (lower.includes("alta") || lower.includes("edificio") || lower.includes("puente")) return "alta";
  if (lower.includes("media") || lower.includes("casa") || lower.includes("comercio")) return "media";
  if (lower.includes("baja") || lower.includes("contrapiso") || lower.includes("vereda")) return "baja";
  return null;
}

function matchTiempo(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  if (lower.includes("muy") || lower.includes("sin curado") || lower.includes("sin tiempo")) return "muy-rapido";
  if (lower.includes("rápido") || lower.includes("rapido") || lower.includes("24") || lower.includes("48")) return "rapido";
  if (lower.includes("normal") || lower.includes("28")) return "normal";
  return null;
}

function buildResults(answers: WizardAnswers): string[] {
  const results: string[] = [];

  if (answers.tipo) {
    const opt = WIZARD_QUESTIONS[0].options.find((o) => o.id === answers.tipo);
    if (opt) results.push(...opt.result);
  }
  if (answers.agua === "si" && !results.includes("impermeable")) results.push("impermeable");
  if (answers.resistencia === "alta" && !results.includes("alta-resistencia")) results.push("alta-resistencia");
  if (answers.tiempo === "rapido" && !results.includes("fast-track")) results.push("fast-track");
  if (answers.tiempo === "muy-rapido" && !results.includes("autocompactante")) results.push("autocompactante");

  if (results.length === 0) results.push("estructural");
  return [...new Set(results)].slice(0, 3);
}

export function useVoiceWizard(
  onComplete: (data: WelcomeWizardData, results: string[], answers: WizardAnswers) => void,
  onSkip: () => void
): UseVoiceWizardReturn {
  const [state, setState] = useState<WizardState>("idle");
  const [maxText, setMaxText] = useState("");
  const [userText, setUserText] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  const { speak } = useVoice();

  const dataRef = useRef<WelcomeWizardData>({ name: "", userType: "" });
  const answersRef = useRef<WizardAnswers>({});
  const retryCountRef = useRef(0);
  const stepRef = useRef(0);
  const stateRef = useRef<WizardState>("idle");
  const skippedRef = useRef(false);

  // Audio recording refs
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const setStateSync = (s: WizardState) => {
    stateRef.current = s;
    setState(s);
  };

  const stopAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const sayAndListen = useCallback(
    (text: string) => {
      if (skippedRef.current) return;
      setMaxText(text);
      setUserText("");
      setStateSync("speaking");

      speak(text, () => {
        if (skippedRef.current) return;
        setTimeout(() => startListening(), 300);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speak]
  );

  const advanceStep = useCallback(
    (nextStep: number) => {
      if (skippedRef.current) return;
      retryCountRef.current = 0;
      stepRef.current = nextStep;
      setStepIndex(nextStep);
      askStep(nextStep);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const advanceWithAck = useCallback(
    (nextStep: number, ack: string) => {
      if (skippedRef.current) return;
      retryCountRef.current = 0;
      stepRef.current = nextStep;
      setStepIndex(nextStep);
      setUserText("");
      setStateSync("speaking");
      speak(ack, () => {
        if (!skippedRef.current) askStep(nextStep);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speak]
  );

  const askStep = useCallback(
    (step: number) => {
      const name = dataRef.current.name || "amigo";

      switch (step) {
        case 0:
          sayAndListen("¡Bienvenido! Soy MAX, el asesor de HORMAX. ¿Cómo te llamás?");
          break;
        case 1:
          sayAndListen(
            `¿Sos particular, constructor, arquitecto, ingeniero, o representás una empresa?`
          );
          break;
        case 2:
          sayAndListen(
            "¿Qué vas a construir? Podés decirme: losa, fundación, pileta, piso, camino, o estructura especial."
          );
          break;
        case 3:
          sayAndListen("¿Va a tener contacto con agua o humedad?");
          break;
        case 4:
          sayAndListen(
            "¿Qué carga va a soportar? Alta como un edificio, media como una casa, o baja como contrapisos."
          );
          break;
        case 5:
          sayAndListen(
            "¿Necesitás curado normal de 28 días, rápido en 24 horas, o sin tiempo de curado?"
          );
          break;
        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sayAndListen]
  );

  const handleTranscript = useCallback(
    (transcript: string, step: number) => {
      if (skippedRef.current) return;
      setUserText(transcript);

      const retry = () => {
        retryCountRef.current += 1;
        if (retryCountRef.current >= 2) {
          applyDefault(step);
        } else {
          sayAndListen("No te escuché bien, ¿podés repetirlo?");
        }
      };

      switch (step) {
        case 0: {
          const name = transcript.trim();
          if (name.length > 0) {
            dataRef.current.name = name;
            advanceWithAck(1, `¡Hola ${name}, qué bueno conocerte!`);
          } else {
            retry();
          }
          break;
        }
        case 1: {
          const userType = matchUserType(transcript);
          if (userType) {
            dataRef.current.userType = userType as WelcomeWizardData["userType"];
            advanceWithAck(2, `Perfecto, ${userType} anotado.`);
          } else {
            retry();
          }
          break;
        }
        case 2: {
          const tipoOptions = WIZARD_QUESTIONS[0].options.map((o) => ({
            id: o.id,
            label: o.label,
          }));
          const tipo = matchOption(transcript, tipoOptions);
          if (tipo) {
            answersRef.current.tipo = tipo;
            advanceWithAck(3, "Buenísimo.");
          } else {
            retry();
          }
          break;
        }
        case 3: {
          const agua = matchWater(transcript);
          answersRef.current.agua = agua;
          const ack = agua === "si" ? "Con agua, lo tengo en cuenta." : "Sin agua, ok.";
          advanceWithAck(4, ack);
          break;
        }
        case 4: {
          const res = matchResistencia(transcript);
          if (res) {
            answersRef.current.resistencia = res;
            advanceWithAck(5, "Entendido.");
          } else {
            retry();
          }
          break;
        }
        case 5: {
          const tiempo = matchTiempo(transcript);
          if (tiempo) {
            answersRef.current.tiempo = tiempo;
          } else {
            answersRef.current.tiempo = "normal";
          }
          finalize();
          break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advanceWithAck, sayAndListen]
  );

  const applyDefault = useCallback(
    (step: number) => {
      switch (step) {
        case 0:
          dataRef.current.name = "amigo";
          advanceStep(1);
          break;
        case 1:
          dataRef.current.userType = "particular";
          advanceStep(2);
          break;
        case 2:
          answersRef.current.tipo = "losa";
          advanceStep(3);
          break;
        case 3:
          answersRef.current.agua = "no";
          advanceStep(4);
          break;
        case 4:
          answersRef.current.resistencia = "media";
          advanceStep(5);
          break;
        case 5:
          answersRef.current.tiempo = "normal";
          finalize();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advanceStep]
  );

  const finalize = useCallback(async () => {
    if (skippedRef.current) return;
    setStateSync("processing");

    const answers = answersRef.current;
    const results = buildResults(answers);
    const data = dataRef.current;

    // Build context message to send to /api/chat
    const tipoLabel =
      WIZARD_QUESTIONS[0].options.find((o) => o.id === answers.tipo)?.label ?? answers.tipo ?? "";
    const contextLines = [
      `Nombre: ${data.name}`,
      `Tipo de usuario: ${data.userType}`,
      `Tipo de obra: ${tipoLabel}`,
      answers.agua === "si" ? "Con contacto con agua/humedad." : "Sin contacto con agua.",
      `Resistencia: ${answers.resistencia ?? "media"}`,
      answers.tiempo === "rapido"
        ? "Necesita curado rápido (24-48hs)."
        : answers.tiempo === "muy-rapido"
        ? "Necesita curado muy rápido (sin tiempo de curado)."
        : "Tiempo de curado normal.",
    ];

    const triggerMessage = `Hola, soy ${data.name}. El usuario quiere construir ${tipoLabel.toLowerCase()}. ${contextLines.slice(2).join(" ")} Recomendame el hormigón ideal de HORMAX.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: triggerMessage }],
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        const reply: string = responseData.text ?? "";

        if (reply) {
          setStateSync("speaking");
          setMaxText(reply);
          speak(reply, () => {
            if (!skippedRef.current) {
              setStateSync("complete");
              onComplete(data, results, answers);
            }
          });
          return;
        }
      }
    } catch {
      // fallback — complete without MAX reply
    }

    setStateSync("complete");
    onComplete(data, results, answers);
  }, [speak, onComplete]);

  const startListening = useCallback(async () => {
    if (skippedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopAudio();
        if (skippedRef.current) return;

        setStateSync("processing");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Blob demasiado chico = mic no capturó nada útil → reintentar
        if (blob.size < 2000) {
          handleSilenceTimeout();
          return;
        }

        try {
          const form = new FormData();
          form.append("audio", blob, "audio.webm");
          const res = await fetch("/api/stt", { method: "POST", body: form });

          if (!res.ok) throw new Error("STT HTTP error");

          const json = await res.json();
          const transcript: string = json.transcript ?? "";

          if (transcript.trim().length > 0) {
            handleTranscript(transcript, stepRef.current);
          } else {
            // Empty transcript → treat as silence timeout
            handleSilenceTimeout();
          }
        } catch {
          // Network/STT error — ask to repeat once
          retryCountRef.current += 1;
          if (retryCountRef.current >= 2) {
            applyDefault(stepRef.current);
          } else {
            sayAndListen("Tuve un problema escuchándote, ¿podés repetirlo?");
          }
        }
      };

      recorder.start();
      setStateSync("listening");

      // Silence detection loop
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      let speechDetected = false;
      let silenceStart: number | null = null;
      const startTime = Date.now();
      const WARMUP_MS = 1500; // mic warmup — no silence detection before this

      const loop = () => {
        if (skippedRef.current) return;
        if (!recorderRef.current || recorderRef.current.state !== "recording") return;

        analyser.getByteFrequencyData(dataArr);
        const avg = dataArr.reduce((sum, v) => sum + v, 0) / dataArr.length;
        const now = Date.now();
        const elapsed = now - startTime;

        if (avg > 10) {
          speechDetected = true;
          silenceStart = null;
        } else if (speechDetected && elapsed > WARMUP_MS) {
          if (silenceStart === null) silenceStart = now;
          if (now - silenceStart > 2000) {
            if (recorderRef.current && recorderRef.current.state === "recording") {
              recorderRef.current.stop();
            }
            return;
          }
        }

        // No-speech timeout only after warmup
        if (!speechDetected && elapsed > 10000) {
          if (recorderRef.current && recorderRef.current.state === "recording") {
            recorderRef.current.stop();
          }
          return;
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch {
      // Mic permission denied or unavailable → skip
      onSkip();
    }
  }, [stopAudio, handleTranscript, sayAndListen, applyDefault, onSkip]);

  const handleSilenceTimeout = useCallback(() => {
    retryCountRef.current += 1;
    if (retryCountRef.current >= 2) {
      applyDefault(stepRef.current);
    } else {
      sayAndListen("¿Seguís ahí? Tomá tu tiempo, te escucho.");
    }
  }, [applyDefault, sayAndListen]);

  const start = useCallback(() => {
    skippedRef.current = false;
    retryCountRef.current = 0;
    stepRef.current = 0;
    setStepIndex(0);
    dataRef.current = { name: "", userType: "" };
    answersRef.current = {};
    askStep(0);
  }, [askStep]);

  const skip = useCallback(() => {
    skippedRef.current = true;
    window.speechSynthesis?.cancel();
    stopAudio();
    setStateSync("idle");
    onSkip();
  }, [stopAudio, onSkip]);

  return {
    state,
    maxText,
    userText,
    stepIndex,
    totalSteps: 6,
    start,
    skip,
  };
}
