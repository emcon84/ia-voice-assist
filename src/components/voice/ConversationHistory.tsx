"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Plus, Trash2, Pencil, Check } from "lucide-react";

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  projectId?: string;
}

export default function ConversationHistory({ open, onClose, onSelect, onNew, projectId }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditValue(conv.title);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmEdit = async (id: string) => {
    const name = editValue.trim();
    if (!name) { setEditingId(null); return; }
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(console.error);
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, title: name } : c)
    );
    setEditingId(null);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const url = projectId ? `/api/conversations?projectId=${projectId}` : "/api/conversations";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col shadow-2xl"
            style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 pt-12 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>Historial</h2>
              <button onClick={onClose} className="p-1" style={{ color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>

            {/* Nueva conversación */}
            <button
              onClick={() => { onNew(); onClose(); }}
              className="flex items-center gap-3 px-4 py-3 mx-3 mt-3 rounded-xl flex-shrink-0"
              style={{ background: "var(--primary)", color: "#ffffff" }}
            >
              <Plus size={18} />
              <span className="text-sm font-semibold">Nueva conversación</span>
            </button>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
              {loading ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Cargando...</p>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8" style={{ color: "var(--muted)" }}>
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay conversaciones guardadas</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    {editingId === conv.id ? (
                      /* Modo edición inline */
                      <div className="flex items-center gap-1 px-3 py-2">
                        <input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmEdit(conv.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 text-sm px-2 py-1 rounded outline-none"
                          style={{
                            background: "var(--bg)",
                            color: "var(--text)",
                            border: "1px solid var(--primary)",
                          }}
                        />
                        <button
                          onClick={() => confirmEdit(conv.id)}
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ color: "var(--primary)" }}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      /* Vista normal */
                      <div className="flex items-center">
                        <button
                          onClick={() => { onSelect(conv.id); onClose(); }}
                          className="flex-1 text-left px-3 py-3 min-w-0"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium truncate flex-1" style={{ color: "var(--text)" }}>
                              {conv.title}
                            </p>
                            <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                              {formatDate(conv.createdAt)}
                            </span>
                          </div>
                          {conv.preview && (
                            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                              {conv.preview}
                            </p>
                          )}
                        </button>
                        {/* Acciones: lápiz + basura */}
                        <div className="flex items-center pr-2 gap-0.5 flex-shrink-0">
                          <button
                            onClick={(e) => startEdit(e, conv)}
                            className="p-2"
                            style={{ color: "var(--muted)" }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            disabled={deleting === conv.id}
                            className="p-2"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
