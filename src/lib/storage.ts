import { ModuleUserProgress, UserProfile, STORAGE_KEYS } from '@/types/courses';

// ==================== MODULE PROGRESS ====================

export function loadModuleProgress(): ModuleUserProgress {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MODULE_PROGRESS);
    if (!stored) return {};
    
    return JSON.parse(stored) as ModuleUserProgress;
  } catch (error) {
    console.error('Error loading module progress:', error);
    return {};
  }
}

export function saveModuleProgress(moduleId: string, data: {
  completedCourses?: string[];
  completedLessons?: string[];
  progress?: number;
}): void {
  if (typeof window === 'undefined') return;
  
  try {
    const progress = loadModuleProgress();
    
    if (!progress[moduleId]) {
      progress[moduleId] = {
        moduleId,
        completedCourses: [],
        completedLessons: [],
        progress: 0,
        lastAccessedAt: new Date().toISOString()
      };
    }
    
    const moduleProgress = progress[moduleId];
    
    if (data.completedCourses !== undefined) {
      moduleProgress.completedCourses = data.completedCourses;
    }
    
    if (data.completedLessons !== undefined) {
      moduleProgress.completedLessons = data.completedLessons;
    }
    
    if (data.progress !== undefined) {
      moduleProgress.progress = data.progress;
    }
    
    moduleProgress.lastAccessedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEYS.MODULE_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving module progress:', error);
  }
}

export function getModuleProgress(moduleId: string) {
  const progress = loadModuleProgress();
  return progress[moduleId];
}

export function isModuleCompleted(moduleId: string): boolean {
  const progress = getModuleProgress(moduleId);
  return progress?.progress === 100 || false;
}

export function getModuleProgressPercent(moduleId: string, totalCourses: number): number {
  const progress = getModuleProgress(moduleId);
  if (!progress || totalCourses === 0) return 0;
  return Math.round((progress.completedCourses.length / totalCourses) * 100);
}

// ==================== GLOBAL PROGRESS ====================

export function calculateGlobalProgress(modules: { id: string; courses: { id: string }[] }[]): number {
  const progress = loadModuleProgress();
  
  if (modules.length === 0) return 0;
  
  let totalCourses = 0;
  let completedCourses = 0;
  
  modules.forEach(module => {
    totalCourses += module.courses.length;
    const moduleProgress = progress[module.id];
    if (moduleProgress) {
      completedCourses += moduleProgress.completedCourses.length;
    }
  });
  
  if (totalCourses === 0) return 0;
  return Math.round((completedCourses / totalCourses) * 100);
}

// ==================== USER PROFILE ====================

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return { name: '' };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!stored) return { name: '' };
    
    return JSON.parse(stored) as UserProfile;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return { name: '' };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

export function getUserName(): string {
  const profile = loadUserProfile();
  return profile.name || '';
}

export function setUserName(name: string): void {
  saveUserProfile({ name });
}

// ==================== CLEAR ====================

export function clearAllProgress(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.MODULE_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  } catch (error) {
    console.error('Error clearing progress:', error);
  }
}

// ==================== LEGACY COMPATIBILITY (v1) ====================
// Funciones para compatibilidad con código existente

const LEGACY_STORAGE_KEY = 'yapur-courses-progress';

export function loadProgressLegacy() {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function saveProgress(courseId: string, lessonId: string, data: {
  completed?: boolean;
  quizScore?: number;
  quizCompleted?: boolean;
}): void {
  // Por ahora solo guardamos, no usamos para nada
  console.log('Legacy saveProgress called:', courseId, lessonId, data);
}

export function getCourseProgress(courseId: string) {
  return loadProgressLegacy()[courseId];
}

export function getLessonProgress(courseId: string, lessonId: string) {
  const courseProgress = getCourseProgress(courseId);
  if (!courseProgress) return undefined;
  return courseProgress.lessonProgress?.[lessonId];
}

export function isLessonCompleted(courseId: string, lessonId: string): boolean {
  const progress = getLessonProgress(courseId, lessonId);
  return progress?.completed ?? false;
}

export function isQuizCompleted(courseId: string, lessonId: string): boolean {
  const progress = getLessonProgress(courseId, lessonId);
  return progress?.quizCompleted ?? false;
}