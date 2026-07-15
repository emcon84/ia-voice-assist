/**
 * Enrollment Entity - Domain model
 * Represents a user's enrollment/purchase in a course
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  stripePaymentId: string | null; // null for free courses
  amount: number | null; // Amount paid, null for free
  createdAt: Date;
}

/**
 * Check if enrollment was free
 */
export function isFreeEnrollment(enrollment: Enrollment): boolean {
  return enrollment.stripePaymentId === null;
}

/**
 * Input for creating an enrollment
 */
export interface CreateEnrollmentInput {
  userId: string;
  courseId: string;
  stripePaymentId?: string;
  amount?: number;
}

/**
 * Enrollment with course details
 */
export interface EnrollmentWithCourse extends Enrollment {
  course: {
    id: string;
    title: string;
    description: string;
    price: number | null;
  };
}