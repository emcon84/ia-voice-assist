import type { Enrollment, CreateEnrollmentInput, EnrollmentWithCourse } from '../entities/enrollment';
import { isFreeCourse } from '../entities/course';
import type { ICourseRepository } from '../repositories/course-repository';

/**
 * Repository interface for enrollment (to be implemented in infrastructure)
 */
export interface IEnrollmentRepository {
  findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>;
  findByUser(userId: string): Promise<EnrollmentWithCourse[]>;
  create(input: CreateEnrollmentInput): Promise<Enrollment>;
}

/**
 * Enrollment Service - Domain business logic
 * Contains use cases for enrollment management
 */
export class EnrollmentService {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private courseRepository: ICourseRepository
  ) {}

  /**
   * Check if user is enrolled in a course
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    return enrollment !== null;
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string): Promise<EnrollmentWithCourse[]> {
    return this.enrollmentRepository.findByUser(userId);
  }

  /**
   * Enroll in a free course
   */
  async enrollInFreeCourse(userId: string, courseId: string): Promise<Enrollment> {
    // Check if course exists and is free
    const course = await this.courseRepository.findCourseById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (!isFreeCourse(course)) {
      throw new Error('This course requires payment');
    }

    // Check if already enrolled
    const existing = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      throw new Error('Already enrolled in this course');
    }

    // Create enrollment
    return this.enrollmentRepository.create({
      userId,
      courseId,
      stripePaymentId: undefined,
      amount: undefined,
    });
  }

  /**
   * Create a Stripe checkout session for paid course
   * @deprecated Temporarily disabled - payments not available
   */
  async createCheckoutSession(
    _userId: string,
    _courseId: string,
    _successUrl: string,
    _cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    // TODO: Re-enable Stripe payments when needed
    throw new Error('Payment processing is temporarily disabled');
    // Previous implementation:
    // const course = await this.courseRepository.findCourseById(courseId);
    // if (!course) throw new Error('Course not found');
    // if (isFreeCourse(course)) throw new Error('This course is free, use enrollInFreeCourse instead');
    // const { stripe } = await import('@/infrastructure/payments/stripe-client');
    // if (!stripe) throw new Error('Stripe is not configured');
    // const session = await stripe.checkout.sessions.create({...});
    // return { sessionId: session.id, url: session.url };
  }

  /**
   * Handle successful payment (called from webhook)
   */
  async handleSuccessfulPayment(
    userId: string,
    courseId: string,
    paymentId: string,
    amount: number
  ): Promise<Enrollment> {
    // Check if already enrolled (idempotency)
    const existing = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      return existing;
    }

    // Create enrollment
    return this.enrollmentRepository.create({
      userId,
      courseId,
      stripePaymentId: paymentId,
      amount,
    });
  }
}