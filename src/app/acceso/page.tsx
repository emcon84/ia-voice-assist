"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { getActiveAssistant } from "@/assistants/registry";

export default function AccesoPage() {
  const { identity } = getActiveAssistant();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        window.location.href = "/chat?quick=true";
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--primary)" }}
        >
          <Lock size={24} color="#ffffff" />
        </div>

        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {identity.company}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Asistente {identity.name}
        </p>
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Ingresá el código de acceso para probar la demo.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder="Código de acceso"
            autoFocus
            autoComplete="off"
            className="w-full rounded-xl px-4 py-3 text-center text-base outline-none"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
            }}
          />

          {error && (
            <p className="text-sm" style={{ color: "#ef4444" }}>
              Código incorrecto. Probá de nuevo.
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "var(--primary)", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Verificando..." : "Entrar"}
            {!loading && <ArrowRight size={16} />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
