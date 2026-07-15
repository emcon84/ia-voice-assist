"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderPlus, MessageCircle, Folder, ChevronRight, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

interface RecentChat {
  id: string;
  name?: string | null;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjects();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    // Cargar chats rápidos (sin proyecto)
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => setRecentChats((data.conversations ?? []).slice(0, 5)))
      .catch(console.error);
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const project = await createProject(newProjectName.trim());
    if (project) {
      setCreatingProject(false);
      setNewProjectName("");
      router.push(`/chat/${project.id}?mode=onboarding`);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteProject(id);
    setDeletingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  return (
    <div
      className="min-h-screen flex flex-col px-4 pt-14 pb-8"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
          Asistente técnico
        </p>
        <h1 className="text-4xl font-bold" style={{ color: "var(--text)" }}>OMAR</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Tu asistente de la Unión Agrícola de Avellaneda
        </p>
      </motion.div>

      {/* Acciones principales */}
      <div className="flex gap-3 mb-8">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCreatingProject(true)}
          className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--primary)", color: "#ffffff" }}
        >
          <FolderPlus size={18} />
          Nueva carpeta
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push("/chat?quick=true")}
          className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          <MessageCircle size={18} />
          Chat rápido
        </motion.button>
      </div>

      {/* Modal crear proyecto */}
      {creatingProject && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
            Nombre de la carpeta
          </p>
          <input
            autoFocus
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            placeholder="Ej: Edificio Chacabuco 450"
            className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateProject}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--primary)", color: "#ffffff" }}
            >
              Crear y configurar con OMAR
            </button>
            <button
              onClick={() => { setCreatingProject(false); setNewProjectName(""); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            OMAR te va a hacer preguntas para entender el contexto y personalizar el asesoramiento.
          </p>
        </motion.div>
      )}

      {/* Proyectos */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>
        </div>
      ) : (
        <>
          {projects.length > 0 && (
            <section className="mb-6">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                Contextos personalizados
              </p>
              <div className="flex flex-col gap-2">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    onClick={() => router.push(`/chat/${project.id}`)}
                  >
                    <Folder size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {project.name}
                      </p>
                      {project.conversations?.[0] && (
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                          {formatDate(project.conversations[0].createdAt)}
                          {project.conversations[0].name && ` · ${project.conversations[0].name}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        disabled={deletingId === project.id}
                        className="p-1"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Chats recientes sin proyecto */}
          {recentChats.length > 0 && (
            <section>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                Chats recientes
              </p>
              <div className="flex flex-col gap-2">
                {recentChats.map((chat) => (
                  <motion.button
                    key={chat.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/chat?quick=true&load=${chat.id}`)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <MessageCircle size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    <p className="text-sm truncate flex-1" style={{ color: "var(--text)" }}>
                      {chat.name ?? "Chat rápido"}
                    </p>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                      {formatDate(chat.createdAt)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {projects.length === 0 && recentChats.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "var(--surface)" }}>
                <MessageCircle size={28} style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
                Bienvenido a OMAR
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Creá una carpeta para asesoramiento con contexto, o iniciá un chat rápido.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
