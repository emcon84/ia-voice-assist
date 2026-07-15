import type { User, CreateUserInput, UpdateUserInput } from '../entities/user';

/**
 * User Repository Interface
 * Defines the contract for user data access
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Create a new user
   */
  create(input: CreateUserInput): Promise<User>;
  
  /**
   * Update existing user
   */
  update(id: string, input: UpdateUserInput): Promise<User>;
  
  /**
   * Get all users (admin only)
   */
  findAll(): Promise<User[]>;
  
  /**
   * Update user role (admin only)
   */
  updateRole(id: string, role: 'ADMIN' | 'USER'): Promise<User>;
  
  /**
   * Ensure user exists (sync with NextAuth)
   */
  upsertFromAuth(userId: string, email: string, name?: string): Promise<User>;
}