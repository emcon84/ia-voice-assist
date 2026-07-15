import type { Course, CreateCourseInput, UpdateCourseInput } from '../entities/course';
import type { Lesson, CreateLessonInput, UpdateLessonInput } from '../entities/lesson';
import type { ICourseRepository } from '../repositories/course-repository';

/**
 * Course Service - Domain business logic
 * Contains use cases for course management
 */
export class CourseService {
  constructor(private courseRepository: ICourseRepository) {}

  /**
   * Get all published courses (public)
   */
  async getPublishedCourses(): Promise<Course[]> {
    return this.courseRepository.findPublishedCourses();
  }

  /**
   * Get course by ID (if published or user is enrolled)
   */
  async getCourse(courseId: string): Promise<Course | null> {
    return this.courseRepository.findCourseById(courseId);
  }

  /**
   * Get all courses including drafts (admin only)
   */
  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAllCourses();
  }

  /**
   * Get courses by module
   */
  async getCoursesByModule(moduleId: string): Promise<Course[]> {
    return this.courseRepository.findCoursesByModule(moduleId);
  }

  /**
   * Create a new course (admin only)
   */
  async createCourse(input: CreateCourseInput): Promise<Course> {
    // Validate input
    if (!input.title.trim()) {
      throw new Error('Course title is required');
    }
    if (!input.description.trim()) {
      throw new Error('Course description is required');
    }
    
    return this.courseRepository.createCourse(input);
  }

  /**
   * Update existing course (admin only)
   */
  async updateCourse(courseId: string, input: UpdateCourseInput): Promise<Course> {
    const course = await this.courseRepository.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    return this.courseRepository.updateCourse(courseId, input);
  }

  /**
   * Publish a course (admin only)
   */
  async publishCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check if course has lessons before publishing
    const lessons = await this.courseRepository.findLessonsByCourse(courseId);
    if (lessons.length === 0) {
      throw new Error('Cannot publish a course without lessons');
    }
    
    return this.courseRepository.updateCourse(courseId, { status: 'PUBLISHED' });
  }

  /**
   * Unpublish a course (admin only)
   */
  async unpublishCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    return this.courseRepository.updateCourse(courseId, { status: 'DRAFT' });
  }

  /**
   * Delete a course (admin only)
   */
  async deleteCourse(courseId: string): Promise<void> {
    const course = await this.courseRepository.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    return this.courseRepository.deleteCourse(courseId);
  }

  // Lesson operations
  /**
   * Get lessons for a course
   */
  async getLessons(courseId: string): Promise<Lesson[]> {
    return this.courseRepository.findLessonsByCourse(courseId);
  }

  /**
   * Create a lesson (admin only)
   */
  async createLesson(input: CreateLessonInput): Promise<Lesson> {
    if (!input.title.trim()) {
      throw new Error('Lesson title is required');
    }
    
    return this.courseRepository.createLesson(input);
  }

  /**
   * Update a lesson (admin only)
   */
  async updateLesson(lessonId: string, input: UpdateLessonInput): Promise<Lesson> {
    const lesson = await this.courseRepository.findLessonById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    
    return this.courseRepository.updateLesson(lessonId, input);
  }

  /**
   * Delete a lesson (admin only)
   */
  async deleteLesson(lessonId: string): Promise<void> {
    const lesson = await this.courseRepository.findLessonById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    
    return this.courseRepository.deleteLesson(lessonId);
  }

  // Module operations
  /**
   * Get all modules with courses
   */
  async getModules() {
    return this.courseRepository.findAllModules();
  }
}