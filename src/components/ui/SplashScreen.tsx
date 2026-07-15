"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { getActiveAssistant } from "@/assistants/registry";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { identity } = getActiveAssistant();

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--primary)" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-6 text-center"
        >
          {/* Wordmark: nombre del asistente. Reemplazá por <img src={logo}/> cuando tengas el logo. */}
          <p className="text-6xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
            {identity.name}
          </p>
          <p className="text-lg font-medium mt-1" style={{ color: "#ffffff", opacity: 0.85 }}>
            {identity.company}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-sm"
          style={{ color: "#ffffff", opacity: 0.75 }}
        >
          {identity.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex gap-2 mt-10"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#ffffff" }}
              animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
