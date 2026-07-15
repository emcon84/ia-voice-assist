/**
 * Course Entity - Domain model
 * Represents a course in the learning platform
 */
export type CourseStatus = 'DRAFT' | 'PUBLISHED';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null; // null = free course
  status: CourseStatus;
  order: number;
  authorId: string;
  moduleId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new course
 */
export interface CreateCourseInput {
  title: string;
  description: string;
  price?: number | null;
  order?: number;
  authorId: string;
  moduleId: string;
}

/**
 * Input for updating a course
 */
export interface UpdateCourseInput {
  title?: string;
  description?: string;
  price?: number | null;
  status?: CourseStatus;
  order?: number;
}

/**
 * Check if course is free
 */
export function isFreeCourse(course: Course): boolean {
  return course.price === null || course.price === 0;
}

/**
 * Check if course is published
 */
export function isPublished(course: Course): boolean {
  return course.status === 'PUBLISHED';
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === 0) {
    return 'Gratis';
  }
  return `$${price.toLocaleString('es-AR')}`;
}