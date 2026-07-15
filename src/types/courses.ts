// Tipos para el sistema de cursos profesional

import { LucideIcon } from 'lucide-react';

// Quiz
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

// Interactive Scenario
export interface InteractiveScenario {
  id: string;
  title: string;
  description: string;
  inputs: ScenarioInput[];
  expectedOutput: string;
  hint: string;
}

export interface ScenarioInput {
  name: string;
  type: 'select' | 'text' | 'number';
  label: string;
  options?: string[];
}

// Product Recommendation
export interface ProductRecommendation {
  product: HormaxProduct | undefined;
  reason: string;
  alternatives: HormaxProduct[];
}

export interface HormaxProduct {
  id: string;
  code: string;
  name: string;
  fc: number; // kg/cm²
  useCases: string[];
  features: string[];
  available: boolean;
}

// Lesson
export type LessonType = 'theory' | 'video' | 'interactive' | 'quiz';

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown
  type: LessonType;
  duration: number; // minutos
  order: number;
  quiz?: Quiz;
  videoUrl?: string;
  interactiveScenario?: InteractiveScenario;
}

// Course
export interface Course {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  estimatedMinutes: number;
  certificateId?: string;
}

// Module
export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  icon: LucideIcon;
  courses: Course[];
  estimatedHours: number;
}

// Progress
export interface ModuleProgress {
  moduleId: string;
  completedCourses: string[];
  completedLessons: string[];
  progress: number; // 0-100
  lastAccessedAt: string;
}

export interface ModuleUserProgress {
  [moduleId: string]: ModuleProgress;
}

export interface UserProfile {
  name: string;
  completedAt?: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  MODULE_PROGRESS: 'yapur-module-progress',
  USER_PROFILE: 'yapur-user-profile',
} as const;