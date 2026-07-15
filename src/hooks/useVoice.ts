"use client";
import { useState, useEffect, useRef } from "react";

interface UseVoiceReturn {
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
}

export const useVoice = (): UseVoiceReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const stop = () => {
    window.speechSynthesis?.cancel();
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setIsSpeaking(false);
  };

  const doSpeak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice =
      voices.find((v) => v.lang === "es-AR") ||
      voices.find((v) => v.lang === "es-ES") ||
      voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Chrome/Linux bug: speechSynthesis pauses on long texts — keep it alive
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        }
      }, 10000);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      onEnd?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices not loaded yet — wait for them
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak(text, onEnd);
      };
    } else {
      doSpeak(text, onEnd);
    }
  };

  return { speak, stop, isSpeaking };
};
