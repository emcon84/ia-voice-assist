"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, ChevronLeft, Trash2, Pencil, Check } from "lucide-react";
import SplashScreen from "@/components/ui/SplashScreen";
import { MaxVoiceAssistant } from "@/components/voice/MaxVoiceAssistant";
import { useProjects } from "@/hooks/useProjects";
import { useRouter } from "next/navigation";

interface ConversationItem {
  id: string;
  title?: string | null;
  preview?: string;
  createdAt: string;
}

function ProjectChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const urlMode = searchParams.get("mode") as "onboarding" | "chat" | null;

  const { projects, fetchProjects } = useProjects();
  const [splashDone, setSplashDone] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("splash-shown") === "true"
  );
  const [projectContext, setProjectContext] = useState<string | undefined>(undefined);
  const [projectName, setProjectName] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  // "home" = lista de chats del proyecto | "onboarding" | "chat"
  const [view, setView] = useState<"home" | "onboarding" | "chat">("home");
  const [loadConversationId, setLoadConversationId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editConvValue, setEditConvValue] = useState("");
  const convInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setNameValue(projectName);
    setEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmEdit = async () => {
    const name = nameValue.trim();
    if (!name) { setEditingName(false); return; }
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(console.error);
    setProjectName(name);
    setEditingName(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setProjectName(project.name);
    if (urlMode === "onboarding" || !project.context) {
      setView("onboarding");
    } else {
      setProjectContext(project.context ?? undefined);
    }
  }, [projects, projectId, urlMode]);

  useEffect(() => {
    if (!projectId) return;
    setLoadingConvs(true);
    fetch(`/api/conversations?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, [projectId]);

  const handleContextGenerated = useCallback(async (context: string) => {
    setProjectContext(context);
    setView("chat");
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    }).catch(console.error);
  }, [projectId]);

  const startConvEdit = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditConvValue(conv.title ?? "");
    setTimeout(() => convInputRef.current?.focus(), 50);
  };

  const confirmConvEdit = async (id: string) => {
    const name = editConvValue.trim();
    if (!name) { setEditingConvId(null); return; }
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(console.error);
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, title: name } : c)
    );
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(console.error);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  if (!splashDone) {
    return (
      <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
        <AnimatePresence>
          <SplashScreen onComplete={() => { sessionStorage.setItem("splash-shown", "true"); setSplashDone(true); }} />
        </AnimatePresence>
      </div>
    );
  }

  // Vista de chat activo (onboarding o conversación)
  if (view === "onboarding" || view === "chat") {
    return (
      <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
        <MaxVoiceAssistant
          projectId={projectId}
          projectContext={projectContext}
          projectName={projectName}
          mode={view}
          onContextGenerated={handleContextGenerated}
          loadConversationId={loadConversationId}
          onGoHome={() => {
            setView("home");
            setLoadConversationId(undefined);
            // Recargar conversaciones al volver
            fetch(`/api/conversations?projectId=${projectId}`)
              .then((r) => r.json())
              .then((data) => setConversations(data.conversations ?? []))
              .catch(console.error);
          }}
        />
      </div>
    );
  }

  // Vista home del proyecto: lista de conversaciones
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col px-4 pt-12 pb-8"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/chat")} className="p-1" style={{ color: "var(--muted)" }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Contexto personalizado
          </p>
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="text-xl font-bold px-1 rounded outline-none"
                style={{
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--primary)",
                  maxWidth: "220px",
                }}
              />
              <button onClick={confirmEdit} className="p-0.5 flex-shrink-0" style={{ color: "var(--primary)" }}>
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                {projectName}
              </h1>
              <button
                onClick={startEdit}
                className="p-1 flex-shrink-0"
                style={{ color: "var(--muted)" }}
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nuevo chat */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setLoadConversationId(undefined); setView("chat"); }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 font-semibold text-sm"
        style={{ background: "var(--primary)", color: "#ffffff" }}
      >
        <Plus size={18} />
        Nuevo chat en esta obra
      </motion.button>

      {/* Lista de conversaciones */}
      {loadingConvs ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Cargando...</p>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare size={32} className="mb-3 opacity-40" style={{ color: "var(--muted)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No hay chats en esta obra todavía
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
            Chats guardados
          </p>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {editingConvId === conv.id ? (
                <div className="flex items-center gap-1 flex-1 px-3 py-2">
                  <input
                    ref={convInputRef}
                    value={editConvValue}
                    onChange={(e) => setEditConvValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmConvEdit(conv.id);
                      if (e.key === "Escape") setEditingConvId(null);
                    }}
                    className="flex-1 text-sm px-2 py-1 rounded outline-none"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--primary)",
                    }}
                  />
                  <button
                    onClick={() => confirmConvEdit(conv.id)}
                    className="p-1.5 flex-shrink-0"
                    style={{ color: "var(--primary)" }}
                  >
                    <Check size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="flex-1 text-left px-4 py-3 min-w-0"
                    onClick={() => { setLoadConversationId(conv.id); setView("chat"); }}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {conv.title ?? "Chat sin título"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(conv.createdAt)}
                    </p>
                  </button>
                  <div className="flex items-center pr-2 gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => startConvEdit(e, conv)}
                      className="p-2"
                      style={{ color: "var(--muted)" }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      disabled={deletingId === conv.id}
                      className="p-2"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ProjectChatPage() {
  return (
    <Suspense>
      <ProjectChatContent />
    </Suspense>
  );
}
