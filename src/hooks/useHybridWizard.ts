"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useVoice } from "@/hooks/useVoice";
import { useSTT } from "@/hooks/useSTT";
import { WIZARD_QUESTIONS } from "@/data/wizardQuestions";
import { WizardAnswers, WelcomeWizardData } from "@/types/wizard";

export type WizardState = "idle" | "speaking" | "listening" | "processing" | "complete";

export interface WizardStepOption {
  id: string;
  label: string;
  color: string;
}

export interface UseHybridWizardReturn {
  state: WizardState;
  maxText: string;
  userText: string;
  stepIndex: number;
  totalSteps: number;
  currentOptions: WizardStepOption[];
  isNameStep: boolean;
  nameValue: string;
  setNameValue: (v: string) => void;
  selectOption: (id: string) => void;
  submitName: () => void;
  isMicListening: boolean;
  toggleMic: () => void;
  isMicSupported: boolean;
  start: () => void;
  skip: () => void;
}

// ---------------------------------------------------------------------------
// Step option definitions
// ---------------------------------------------------------------------------

const USER_TYPE_OPTIONS: WizardStepOption[] = [
  { id: "particular", label: "Particular", color: "#c51216" },
  { id: "constructor", label: "Constructor", color: "#1d1d1b" },
  { id: "arquitecto", label: "Arquitecto", color: "#c51216" },
  { id: "ingeniero", label: "Ingeniero", color: "#1d1d1b" },
  { id: "empresa", label: "Empresa", color: "#c51216" },
];

const TIPO_OPTIONS: WizardStepOption[] = WIZARD_QUESTIONS[0].options.map((o) => ({
  id: o.id,
  label: o.label,
  color: "#c51216",
}));

const AGUA_OPTIONS: WizardStepOption[] = [
  { id: "si", label: "Sí, habrá agua", color: "#0ea5e9" },
  { id: "no", label: "No, uso seco", color: "#6e6c6a" },
];

const RESISTENCIA_OPTIONS: WizardStepOption[] = WIZARD_QUESTIONS[2].options.map((o) => ({
  id: o.id,
  label: o.label,
  color: o.color,
}));

const TIEMPO_OPTIONS: WizardStepOption[] = WIZARD_QUESTIONS[3].options.map((o) => ({
  id: o.id,
  label: o.label,
  color: o.color,
}));

function getOptionsForStep(step: number): WizardStepOption[] {
  switch (step) {
    case 0:
      return []; // name step — no buttons
    case 1:
      return USER_TYPE_OPTIONS;
    case 2:
      return TIPO_OPTIONS;
    case 3:
      return AGUA_OPTIONS;
    case 4:
      return RESISTENCIA_OPTIONS;
    case 5:
      return TIEMPO_OPTIONS;
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// buildResults — exact copy from useVoiceWizard.ts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHybridWizard(
  onComplete: (data: WelcomeWizardData, results: string[], answers: WizardAnswers) => void,
  onSkip: () => void
): UseHybridWizardReturn {
  const [state, setState] = useState<WizardState>("idle");
  const [maxText, setMaxText] = useState("");
  const [userText, setUserText] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [nameValue, setNameValue] = useState("");
  const [currentOptions, setCurrentOptions] = useState<WizardStepOption[]>([]);

  const { speak } = useVoice();
  const { startListening, stopListening, transcript, isListening, isSupported, clearTranscript } =
    useSTT();

  const dataRef = useRef<WelcomeWizardData>({ name: "", userType: "" });
  const answersRef = useRef<WizardAnswers>({});
  const stepRef = useRef(0);
  const skippedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Mic transcript → matchAndSelect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!transcript) return;
    matchAndSelect(transcript);
    clearTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // ---------------------------------------------------------------------------
  // Core helpers
  // ---------------------------------------------------------------------------

  const sayAndListen = useCallback(
    (text: string) => {
      if (skippedRef.current) return;
      setMaxText(text);
      setUserText("");
      setState("speaking");
      speak(text, () => {
        if (!skippedRef.current) setState("listening");
      });
    },
    [speak]
  );

  const askStep = useCallback(
    (step: number) => {
      setCurrentOptions(getOptionsForStep(step));
      const name = dataRef.current.name || "amigo";

      switch (step) {
        case 0:
          sayAndListen("¡Bienvenido! Soy MAX, el asesor de HORMAX. ¿Cómo te llamás?");
          break;
        case 1:
          sayAndListen(`${name}, ¿qué tipo de usuario sos?`);
          break;
        case 2:
          sayAndListen("¿Qué vas a construir?");
          break;
        case 3:
          sayAndListen("¿Va a tener contacto con agua o humedad?");
          break;
        case 4:
          sayAndListen("¿Qué carga va a soportar?");
          break;
        case 5:
          sayAndListen("¿Tenés tiempo de curado?");
          break;
        default:
          break;
      }
    },
    [sayAndListen]
  );

  const advanceWithAck = useCallback(
    (nextStep: number, ack: string) => {
      if (skippedRef.current) return;
      stepRef.current = nextStep;
      setStepIndex(nextStep);
      setUserText("");
      setState("speaking");
      speak(ack, () => {
        if (!skippedRef.current) askStep(nextStep);
      });
    },
    [speak, askStep]
  );

  // ---------------------------------------------------------------------------
  // finalize
  // ---------------------------------------------------------------------------

  const finalize = useCallback(async () => {
    if (skippedRef.current) return;
    setState("processing");

    const answers = answersRef.current;
    const results = buildResults(answers);
    const data = dataRef.current;

    const tipoLabel =
      WIZARD_QUESTIONS[0].options.find((o) => o.id === answers.tipo)?.label ?? answers.tipo ?? "";
    const contextLines = [
      answers.agua === "si" ? "Con contacto con agua/humedad." : "Sin contacto con agua.",
      `Resistencia: ${answers.resistencia ?? "media"}`,
      answers.tiempo === "rapido"
        ? "Necesita curado rápido (24-48hs)."
        : answers.tiempo === "muy-rapido"
        ? "Necesita curado muy rápido (sin tiempo de curado)."
        : "Tiempo de curado normal.",
    ];

    const triggerMessage = `Hola soy ${data.name}. Voy a construir ${tipoLabel.toLowerCase()}. ${contextLines.join(" ")} Recomendame el hormigón ideal de HORMAX.`;

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
          setState("speaking");
          setMaxText(reply);
          speak(reply, () => {
            if (!skippedRef.current) {
              setState("complete");
              onComplete(data, results, answers);
            }
          });
          return;
        }
      }
    } catch {
      // fallback — complete without MAX reply
    }

    setState("complete");
    onComplete(data, results, answers);
  }, [speak, onComplete]);

  // ---------------------------------------------------------------------------
  // selectOption — called by buttons and matchAndSelect (mic)
  // ---------------------------------------------------------------------------

  const selectOption = useCallback(
    (id: string) => {
      if (skippedRef.current) return;
      const step = stepRef.current;
      setUserText(id);

      switch (step) {
        case 1: {
          dataRef.current.userType = id as WelcomeWizardData["userType"];
          advanceWithAck(2, "Perfecto.");
          break;
        }
        case 2: {
          answersRef.current.tipo = id;
          advanceWithAck(3, "Buenísimo.");
          break;
        }
        case 3: {
          answersRef.current.agua = id;
          const ack = id === "si" ? "Con agua, anotado." : "Sin agua, ok.";
          advanceWithAck(4, ack);
          break;
        }
        case 4: {
          answersRef.current.resistencia = id;
          advanceWithAck(5, "Entendido.");
          break;
        }
        case 5: {
          answersRef.current.tiempo = id;
          finalize();
          break;
        }
        default:
          break;
      }
    },
    [advanceWithAck, finalize]
  );

  // ---------------------------------------------------------------------------
  // submitName — step 0
  // ---------------------------------------------------------------------------

  const submitName = useCallback(() => {
    const name = nameValue.trim();
    if (!name) return;
    dataRef.current.name = name;
    setUserText(name);
    stepRef.current = 1;
    setStepIndex(1);
    setState("speaking");
    speak(`¡Hola ${name}, qué bueno conocerte!`, () => {
      if (!skippedRef.current) askStep(1);
    });
  }, [nameValue, speak, askStep]);

  // ---------------------------------------------------------------------------
  // matchAndSelect — parse mic transcript
  // ---------------------------------------------------------------------------

  const matchAndSelect = useCallback(
    (text: string) => {
      const step = stepRef.current;

      if (step === 0) {
        const name = text.trim();
        if (name) {
          setNameValue(name);
          // Trigger submitName logic inline since nameValue state may lag
          dataRef.current.name = name;
          setUserText(name);
          stepRef.current = 1;
          setStepIndex(1);
          setState("speaking");
          speak(`¡Hola ${name}, qué bueno conocerte!`, () => {
            if (!skippedRef.current) askStep(1);
          });
        }
        return;
      }

      const options = getOptionsForStep(step);
      const lower = text.toLowerCase();
      const match = options.find((o) => lower.includes(o.label.toLowerCase()));
      if (match) {
        selectOption(match.id);
      }
    },
    [speak, askStep, selectOption]
  );

  // ---------------------------------------------------------------------------
  // toggleMic (push-to-talk)
  // ---------------------------------------------------------------------------

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ---------------------------------------------------------------------------
  // start / skip
  // ---------------------------------------------------------------------------

  const start = useCallback(() => {
    skippedRef.current = false;
    stepRef.current = 0;
    setStepIndex(0);
    setNameValue("");
    dataRef.current = { name: "", userType: "" };
    answersRef.current = {};
    askStep(0);
  }, [askStep]);

  const skip = useCallback(() => {
    skippedRef.current = true;
    window.speechSynthesis?.cancel();
    setState("idle");
    onSkip();
  }, [onSkip]);

  // ---------------------------------------------------------------------------

  return {
    state,
    maxText,
    userText,
    stepIndex,
    totalSteps: 6,
    currentOptions,
    isNameStep: stepIndex === 0,
    nameValue,
    setNameValue,
    selectOption,
    submitName,
    isMicListening: isListening,
    toggleMic,
    isMicSupported: isSupported,
    start,
    skip,
  };
}
