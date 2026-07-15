"use client";

import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

const DISMISSED_KEY = "pwa-dismissed-until";

export default function PWAInstaller() {
  const [show, setShow] = useState(false);
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [ios, setIos] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Registro del SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((r) => console.log("[PWA] SW registrado:", r.scope))
        .catch((e) => console.error("[PWA] SW falló:", e));
    }

    // Ya instalada como standalone → no mostrar nada
    if (isInStandaloneMode()) return;

    // Fue descartado recientemente
    const until = localStorage.getItem(DISMISSED_KEY);
    if (until && Date.now() < Number(until)) return;

    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanNativeInstall(true);
    };

    const onInstalled = () => setShow(false);

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Mostrar banner siempre después de 4s — con o sin beforeinstallprompt
    const timer = setTimeout(() => {
      if (!isInStandaloneMode()) {
        setIos(isIOS());
        setShow(true);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (promptRef.current) {
      await promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === "accepted") setShow(false);
      promptRef.current = null;
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // No mostrar de nuevo por 3 días
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 shadow-2xl p-4" style={{ borderTopColor: "#005bab" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uaa-logo.png" alt="Unión Agrícola de Avellaneda" className="w-9 h-9 object-contain" />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Instalar UAA Omar</p>
            <p className="text-xs text-gray-500">Asistente de la cooperativa</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 text-xl leading-none px-1">×</button>
      </div>

      {ios ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Para instalar desde Safari:</p>
          <ol className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#005bab", color: "#ffffff" }}>1</span>
              <span className="text-sm text-gray-700">Tocá <span className="text-base">📤</span> (el botón de abajo al centro)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#005bab", color: "#ffffff" }}>2</span>
              <span className="text-sm text-gray-700">Desplazá el menú hacia abajo</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#005bab", color: "#ffffff" }}>3</span>
              <span className="text-sm text-gray-700">Tocá <strong>&quot;Agregar a inicio&quot;</strong></span>
            </li>
          </ol>
          <button
            onClick={handleDismiss}
            className="w-full border py-2 rounded-lg text-sm font-semibold"
            style={{ borderColor: "#005bab", color: "#005bab" }}
          >
            Ya lo hice
          </button>
        </div>
      ) : canNativeInstall ? (
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#005bab", color: "#ffffff" }}
          >
            Instalar app
          </button>
          <button onClick={handleDismiss} className="px-4 py-2 text-sm text-gray-500 border rounded-lg">
            Ahora no
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-700">
          <p>Tocá el menú <strong>⋮</strong> de Chrome → <strong>&quot;Instalar app&quot;</strong> o <strong>&quot;Agregar a pantalla de inicio&quot;</strong></p>
        </div>
      )}
    </div>
  );
}
