"use client";
import { useState, useRef, useEffect } from "react";

interface UseSTTReturn {
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  clearTranscript: () => void;
}

export const useSTT = (): UseSTTReturn => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  const startListening = async () => {
    if (!isSupported || isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsListening(false);
        await sendToGroq(blob);
      };

      recorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Mic error:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const sendToGroq = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");

      const res = await fetch("/api/stt", { method: "POST", body: form });
      if (!res.ok) return;

      const data = await res.json();
      if (data.transcript) setTranscript(data.transcript);
    } catch (err) {
      console.error("STT send error:", err);
    }
  };

  const clearTranscript = () => setTranscript("");

  return {
    startListening,
    stopListening,
    transcript,
    isListening,
    isSupported,
    clearTranscript,
  };
};
