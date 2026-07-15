"use client";

import { motion, AnimatePresence } from "framer-motion";

interface NoCreditsModalProps {
  open: boolean;
  service: "anthropic" | "elevenlabs" | null;
  onClose: () => void;
}

export function NoCreditsModal({ open, service, onClose }: NoCreditsModalProps) {
  const serviceName = service === "anthropic" ? "Anthropic (IA)" : "ElevenLabs (voz)";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-semibold mb-2">
              Sin créditos disponibles
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Los créditos de <span className="text-zinc-200">{serviceName}</span> se agotaron.
              Esta es una versión de prueba — volvé en unos días cuando recarguemos.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: "#c51216", color: "#fff" }}
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
