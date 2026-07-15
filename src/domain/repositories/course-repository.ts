import type { Course, CreateCourseInput, UpdateCourseInput } from '../entities/course';
import type { Lesson, CreateLessonInput, UpdateLessonInput } from '../entities/lesson';

/**
 * Course Repository Interface
 * Defines the contract for course and lesson data access
 */
export interface ICourseRepository {
  // Course operations
  /**
   * Find course by ID
   */
  findCourseById(id: string): Promise<Course | null>;
  
  /**
   * Find all published courses
   */
  findPublishedCourses(): Promise<Course[]>;
  
  /**
   * Find all courses (including drafts) - admin only
   */
  findAllCourses(): Promise<Course[]>;
  
  /**
   * Find courses by module
   */
  findCoursesByModule(moduleId: string): Promise<Course[]>;
  
  /**
   * Create a new course
   */
  createCourse(input: CreateCourseInput): Promise<Course>;
  
  /**
   * Update existing course
   */
  updateCourse(id: string, input: UpdateCourseInput): Promise<Course>;
  
  /**
   * Delete a course
   */
  deleteCourse(id: string): Promise<void>;
  
  // Lesson operations
  /**
   * Find lesson by ID
   */
  findLessonById(id: string): Promise<Lesson | null>;
  
  /**
   * Find lessons by course
   */
  findLessonsByCourse(courseId: string): Promise<Lesson[]>;
  
  /**
   * Create a new lesson
   */
  createLesson(input: CreateLessonInput): Promise<Lesson>;
  
  /**
   * Update existing lesson
   */
  updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson>;
  
  /**
   * Delete a lesson
   */
  deleteLesson(id: string): Promise<void>;
  
  // Module operations
  /**
   * Find all modules with courses
   */
  findAllModules(): Promise<any[]>;
  
  /**
   * Create a module
   */
  createModule(input: { title: string; description: string; order: number }): Promise<any>;
}