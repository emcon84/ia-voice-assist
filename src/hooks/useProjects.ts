"use client";
import { useState, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  context?: string | null;
  createdAt: string;
  updatedAt: string;
  conversations?: { name?: string | null; createdAt: string }[];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch (e) {
      console.error("useProjects fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name: string): Promise<Project | null> => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const { project } = await res.json();
      setProjects((prev) => [project, ...prev]);
      return project;
    } catch (e) {
      console.error("createProject error:", e);
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: { name?: string; context?: string }): Promise<void> => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
    } catch (e) {
      console.error("updateProject error:", e);
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("deleteProject error:", e);
    }
  }, []);

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}
