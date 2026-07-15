"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SplashScreen from "@/components/ui/SplashScreen";
import { MaxVoiceAssistant } from "@/components/voice/MaxVoiceAssistant";
import HomeScreen from "@/components/home/HomeScreen";

function ChatPageContent() {
  const [splashDone, setSplashDone] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("splash-shown") === "true"
  );

  const handleSplashComplete = () => {
    sessionStorage.setItem("splash-shown", "true");
    setSplashDone(true);
  };
  const searchParams = useSearchParams();
  const isQuick = searchParams.get("quick") === "true";
  const loadId = searchParams.get("load");

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      <AnimatePresence>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {splashDone && (
        isQuick
          ? <MaxVoiceAssistant loadConversationId={loadId ?? undefined} />
          : <HomeScreen />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  );
}
