/**
 * Repository interface for progress (to be implemented in infrastructure)
 */
export interface IProgressRepository {
  findByUserAndLesson(userId: string, lessonId: string): Promise<{
    id: string;
    completed: boolean;
    completedAt: Date | null;
  } | null>;
  
  findByUser(userId: string): Promise<Array<{
    lessonId: string;
    completed: boolean;
    completedAt: Date | null;
  }>>;
  
  markComplete(userId: string, lessonId: string): Promise<void>;
  markIncomplete(userId: string, lessonId: string): Promise<void>;
}

/**
 * Progress Service - Domain business logic
 * Tracks user progress through lessons
 */
export class ProgressService {
  constructor(private progressRepository: IProgressRepository) {}

  /**
   * Check if a lesson is completed
   */
  async isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
    const progress = await this.progressRepository.findByUserAndLesson(userId, lessonId);
    return progress?.completed ?? false;
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId: string): Promise<Map<string, boolean>> {
    const progressList = await this.progressRepository.findByUser(userId);
    const map = new Map<string, boolean>();
    
    progressList.forEach((p) => {
      map.set(p.lessonId, p.completed);
    });
    
    return map;
  }

  /**
   * Mark a lesson as complete
   */
  async completeLesson(userId: string, lessonId: string): Promise<void> {
    // Check if already completed
    const existing = await this.progressRepository.findByUserAndLesson(userId, lessonId);
    if (existing?.completed) {
      return; // Already completed, idempotent
    }
    
    return this.progressRepository.markComplete(userId, lessonId);
  }

  /**
   * Mark a lesson as incomplete
   */
  async uncompleteLesson(userId: string, lessonId: string): Promise<void> {
    return this.progressRepository.markIncomplete(userId, lessonId);
  }

  /**
   * Calculate course completion percentage
   */
  async calculateCourseProgress(
    userId: string,
    lessonIds: string[]
  ): Promise<number> {
    if (lessonIds.length === 0) {
      return 0;
    }

    let completedCount = 0;
    
    for (const lessonId of lessonIds) {
      const isCompleted = await this.isLessonCompleted(userId, lessonId);
      if (isCompleted) {
        completedCount++;
      }
    }

    return Math.round((completedCount / lessonIds.length) * 100);
  }

  /**
   * Get completion stats for a course
   */
  async getCourseStats(
    userId: string,
    lessonIds: string[]
  ): Promise<{
    completed: number;
    total: number;
    percentage: number;
  }> {
    const completed = (await Promise.all(
      lessonIds.map((id) => this.isLessonCompleted(userId, id))
    )).filter(Boolean).length;

    return {
      completed,
      total: lessonIds.length,
      percentage: lessonIds.length > 0 
        ? Math.round((completed / lessonIds.length) * 100) 
        : 0,
    };
  }
}