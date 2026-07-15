/**
 * Lesson Entity - Domain model
 * Represents a lesson within a course
 */
export type LessonType = 'THEORY' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ';

// Lesson content structure - flexible JSON for different types
export interface LessonContent {
  // For THEORY
  markdown?: string;
  
  // For VIDEO
  videoUrl?: string;
  videoDuration?: number;
  
  // For INTERACTIVE
  scenario?: {
    title: string;
    description: string;
    inputs: {
      name: string;
      type: 'select' | 'text' | 'number';
      label: string;
      options?: string[];
    }[];
    expectedOutput: string;
    hint: string;
  };
  
  // For QUIZ
  quiz?: {
    id: string;
    title: string;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  content: LessonContent;
  type: LessonType;
  order: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new lesson
 */
export interface CreateLessonInput {
  title: string;
  content: LessonContent;
  type: LessonType;
  order?: number;
  courseId: string;
}

/**
 * Input for updating a lesson
 */
export interface UpdateLessonInput {
  title?: string;
  content?: LessonContent;
  type?: LessonType;
  order?: number;
}

/**
 * Get lesson duration estimate in minutes
 */
export function getLessonDuration(lesson: Lesson): number {
  if (lesson.type === 'VIDEO' && lesson.content.videoDuration) {
    return lesson.content.videoDuration;
  }
  
  // Estimate based on content length
  if (lesson.type === 'THEORY' && lesson.content.markdown) {
    const words = lesson.content.markdown.split(/\s+/).length;
    return Math.max(5, Math.ceil(words / 200)); // ~200 words/min
  }
  
  if (lesson.type === 'QUIZ') {
    return 10; // Estimated quiz time
  }
  
  if (lesson.type === 'INTERACTIVE') {
    return 15; // Estimated interactive time
  }
  
  return 10; // Default
}